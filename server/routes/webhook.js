import express from "express";
import stripe from "../services/stripe.js";
import pool from "../db.js";

const router = express.Router();

router.post('/webhook', express.raw({type: "application/json"}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET_KEY);
    } catch (err) {
        console.log(err);
        return res.status(400).send(err.message);
    }
    const payment_intent = event.data.object;
    const orderId = parseInt(payment_intent.metadata.order_id);
    console.log(`from webhook orderId:${orderId}`);
    const userId = parseInt(payment_intent.metadata.user_id);
    if (event.type === "payment_intent.succeeded") {
        try {
            await pool.query(
                "UPDATE orders SET status = 'paid' WHERE id = $1", [orderId]
            );
            console.log(`Order${orderId} was confirmed`);
        } catch (err) {
            console.log(err);
        }
    } else if (event.type === "payment_intent.canceled") {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            const itemsResult = await client.query(
                "SELECT * FROM order_items WHERE order_id = $1", [orderId]
            );
            const items = itemsResult.rows;
            const userCart = await client.query(
                "SELECT id FROM carts WHERE user_id = $1", [userId]
            );
            const cart_id = userCart.rows[0].id;
            for (let item of items) {
                const existing = await client.query(
                    `SELECT quantity, id FROM cart_items WHERE cart_id = $1 AND product_id = $2 AND size = $3`,
                    [cart_id, item.product_id, item.size]
                );
                if (existing.rows.length > 0) {
                    const newQuantity = existing.rows[0].quantity + item.quantity;
                    await client.query(
                        `UPDATE cart_items SET quantity = $1 WHERE id = $2`, [newQuantity, existing.rows[0].id]
                    );
                } else {
                    await client.query(
                        `INSERT INTO cart_items (cart_id, product_id, size, quantity) VALUES ($1, $2, $3, $4)`,
                        [cart_id, item.product_id, item.size, item.quantity]
                    );
                }
                await client.query(
                    "UPDATE product_variants SET stock = stock + $1 WHERE product_id = $2 AND size = $3",
                    [item.quantity, item.product_id, item.size]
                );
            }
            await client.query("DELETE FROM order_items WHERE order_id = $1", [orderId]);
            await client.query("DELETE FROM orders where id = $1", [orderId]);
            await client.query("COMMIT")
            console.log(`Order${orderId} was canceled`);
        } catch (err) {
            await client.query("ROLLBACK");
            console.log(err);
        } finally {
            client.release();
        }
    }
    console.log(event.type);
    res.json({received: true});
});

export default router;
