import express from "express";
import stripe from "../services/stripe.js";
import pool from "../db.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

router.get('/orders', requireAuth, async (req, res) => {
    const orders = {};
    try {
        const result = await pool.query(
            `SELECT o.id, o.status, o.total_cents, o.phone, o.shipping_address, o.created_at, d.estimated_days,
            oi.product_id, oi.size, oi.quantity, p.name, p.image_url
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.id
            JOIN products p ON p.id = oi.product_id
            JOIN delivery_options d ON d.id = o.delivery_option_id
            WHERE o.user_id = $1
            ORDER BY o.created_at DESC`, [req.session.userId]
        );
        for (let row of result.rows) {
            if (!orders[row.id]) {
                orders[row.id] = {
                    id: row.id,
                    status: row.status,
                    total_cents: row.total_cents,
                    phone: row.phone,
                    shipping_address: row.shipping_address,
                    created_at: row.created_at,
                    estimated_days: row.estimated_days,
                    products: {},
                }
            }
            if (!orders[row.id].products[row.product_id]) {
                orders[row.id].products[row.product_id] = {
                    product_id: row.product_id,
                    name: row.name,
                    image_url: row.image_url,
                    sizes: []
                }
            }
            orders[row.id].products[row.product_id].sizes.push({
                size: row.size,
                quantity: row.quantity
            });
        }
        const formatted = Object.values(orders).map((order) => {
            return {
                ...order,
                products: Object.values(order.products)
            }
        });
        formatted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        res.json(formatted);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Server error"});
    }
});

router.post('/orders', requireAuth, async (req, res) => {
    const client = await pool.connect();
    try {
        const {delivery_option_id, shipping_address, phone, payment_method} = req.body;
        if (payment_method !== 'cod' && payment_method !== 'card') {
            throw new Error("Invalid payment_method");
        }
        await client.query("BEGIN");
        const cartResult = await client.query(
            "SELECT id FROM carts WHERE user_id = $1", [req.session.userId]
        );
        const cart_id = cartResult.rows[0].id;
        const cartItemsResults = await client.query(
            `SELECT ci.product_id, ci.size, ci.quantity, p.price_cents, p.discount_percentage, pv.stock, p.name
            FROM cart_items ci
            JOIN product_variants pv ON pv.product_id = ci.product_id AND pv.size = ci.size
            JOIN products p ON p.id = pv.product_id
            WHERE ci.cart_id = $1
            FOR UPDATE`, [cart_id]
        );
        const cartItems = cartItemsResults.rows;
        if (cartItems.length === 0) {
            throw new Error("Cart is empty");
        }
        for (let item of cartItems) {
            if (item.quantity > item.stock) {
                throw new Error(`Not enough stock for product ${item.name} size ${item.size}`);
            }
        }
        let total = 0;
        for (let item of cartItems) {
            let price = item.price_cents;
            if (item.discount_percentage) {
                price = Math.round(price - (price * item.discount_percentage) / 100);
            }
            total += price * item.quantity;
        }
        const deliveryResult = await client.query(
            "SELECT price_cents FROM delivery_options WHERE id = $1", [delivery_option_id]
        );
        const deliveryCost = deliveryResult.rows[0].price_cents;
        total += deliveryCost;
        const status = (payment_method === 'card') ? "pending" : "confirmed";
        const orderResult = await client.query(
            `INSERT INTO orders (user_id, status, total_cents, phone, shipping_address, delivery_option_id)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [req.session.userId, status, total, phone, shipping_address, delivery_option_id]
        );
        const order = orderResult.rows[0];
        const orderId = order.id;
        for (let item of cartItems) {
            await client.query(
                `INSERT INTO order_items (order_id, product_id, size, quantity)
                VALUES ($1, $2, $3, $4)`, [orderId, item.product_id, item.size, item.quantity]
            );
        }
        for (let item of cartItems) {
            await client.query(
                `UPDATE product_variants SET stock = stock - $1 WHERE product_id = $2 AND size = $3`,
                [item.quantity, item.product_id, item.size]
            );
        }
        await client.query(
            "DELETE FROM cart_items WHERE cart_id = $1", [cart_id]
        );
        await client.query("COMMIT");
        res.json({orderId});
    } catch (err) {
        await client.query("ROLLBACK");
        console.log(err);
        res.status(400).json({error: err.message});
    } finally {
        client.release();
    }
});

router.delete('/orders/:id', requireAuth, async (req, res) => {
    const client = await pool.connect();
    try {
        const orderId = req.params.id;
        await client.query("BEGIN");
        const orderCheck = await client.query(
            "SELECT status, payment_intent_id from orders WHERE id = $1 FOR UPDATE", [orderId]
        );
        if (orderCheck.rows.length === 0) {
            throw new Error("No order found");
        }
        const {status, payment_intent_id} = orderCheck.rows[0];
        if (status !== 'confirmed') {
            throw new Error("Order cannot be canceled");
        }
        const itemsResult = await client.query(
            `SELECT product_id, size, quantity FROM order_items WHERE order_id = $1`, [orderId]
        );
        const items = itemsResult.rows;
        for (let item of items) {
            await client.query(
                `UPDATE product_variants SET stock = stock + $1 WHERE product_id = $2 AND size = $3`,
                [item.quantity, item.product_id, item.size]
            );
        }
        if (payment_intent_id) {
            await stripe.paymentIntents.cancel(payment_intent_id);
        }
        await client.query(
            `DELETE FROM order_items WHERE order_id = $1`, [orderId]
        );
        await client.query(
            `DELETE FROM orders WHERE id = $1`, [orderId]
        );
        await client.query("COMMIT");
        res.json({message: "Order was successfully canceled"});
    } catch (err) {
        await client.query("ROLLBACK");
        console.log(err);
        res.status(400).json({error: err.message});
    } finally {
        client.release();
    }
});

router.delete('/cancel/:id', requireAuth, async (req, res) => {
    try {
        const orderId = req.params.id;
        const orderCheck = await pool.query(
            "SELECT status, payment_intent_id from orders WHERE id = $1 FOR UPDATE", [orderId]
        );
        if (orderCheck.rows.length === 0) {
            throw new Error("No order found");
        }
        const {status, payment_intent_id} = orderCheck.rows[0];
        if (status !== 'pending') {
            throw new Error("Order cannot be canceled");
        }
        if (payment_intent_id) {
            await stripe.paymentIntents.cancel(payment_intent_id);
        }
        res.json({message: "Order was canceled successfully"});
    } catch (err) {
        console.log(err);
        res.status(400).json({error: err.message});
    }
});

export default router;
