import express from "express";
import pool from "../db.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
    try {
        const cartResults = await pool.query(
            `SELECT p.id, p.name, p.image_url, p.price_cents, p.discount_percentage, 
            ci.size, ci.quantity, pv.stock
            FROM carts c
            JOIN cart_items ci ON c.id = ci.cart_id
            JOIN products p ON ci.product_id = p.id
            JOIN product_variants pv ON pv.product_id = p.id AND pv.size = ci.size
            WHERE c.user_id = $1
            ORDER BY p.id ASC, ci.size ASC`,[req.session.userId]
        );
        res.json(cartResults.rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Server error"});
    }
});

router.post('/', requireAuth, async (req, res) => {
    try {
        const {product_id, size, quantity} = req.body;
        if (!quantity) {
            return res.status(400).json({message: "Bad connection"});
        }
        const userCart = await pool.query(
            "SELECT id FROM carts WHERE user_id = $1", [req.session.userId]
        );
        const cart_id = userCart.rows[0].id;
        const variant = await pool.query(
            "SELECT stock FROM product_variants WHERE product_id = $1 AND size = $2", [product_id, size]
        );
        if (variant.rows.length === 0) {
            return res.status(404).json({message: "No product found"});
        }
        const stock = variant.rows[0].stock;
        const existing = await pool.query(
            `SELECT quantity, id FROM cart_items WHERE cart_id = $1 AND product_id = $2 AND size = $3`,[cart_id, product_id, size]
        );
        if (existing.rows.length > 0) {
            const newQuantity = existing.rows[0].quantity + quantity;
            if (newQuantity > stock) {
                return res.status(400).json({message: `Only ${stock} items left in stock`});
            }
            await pool.query(
                `UPDATE cart_items SET quantity = $1 WHERE id = $2`, [newQuantity, existing.rows[0].id]
            );
        } else {
            if (quantity > stock) {
                return res.status(400).json({message: `Only ${stock} items left in stock`});
            }
            await pool.query(
                `INSERT INTO cart_items (cart_id, product_id, size, quantity) VALUES ($1, $2, $3, $4)`, [cart_id, product_id, size, quantity]
            );
        }
        const updatedCart = await pool.query(
            `SELECT p.id, p.name, p.image_url, p.price_cents, p.discount_percentage, 
            ci.size, ci.quantity, pv.stock
            FROM carts c
            JOIN cart_items ci ON c.id = ci.cart_id
            JOIN products p ON ci.product_id = p.id
            JOIN product_variants pv ON pv.product_id = p.id AND pv.size = ci.size
            WHERE c.user_id = $1`,[req.session.userId]
        );
        res.json(updatedCart.rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Server error"});
    }
});

router.put('/', requireAuth, async (req, res) => {
    try {
        const {product_id, size, quantity} = req.body;
        const userCart = await pool.query(
            "SELECT id FROM carts WHERE user_id = $1", [req.session.userId]
        );
        const cart_id = userCart.rows[0].id;
        const cartItemCheck = await pool.query(
            `SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2 AND size = $3`,
            [cart_id, product_id, size]
        );
        if (cartItemCheck.rows.length === 0) {
            return res.status(404).json({message: "Not found"});
        }
        if (quantity <= 0) {
            await pool.query(
                "DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2 AND size = $3",
                [cart_id, product_id, size]
            );
        } else {
            const variant = await pool.query(
                "SELECT stock FROM product_variants WHERE product_id = $1 AND size = $2", [product_id, size]
            );
            const stock = variant.rows[0].stock;
             if (quantity > stock) {
                return res.status(400).json({message: `Only ${stock} items left in stock`});
            }
            await pool.query(
                `UPDATE cart_items SET quantity = $1 WHERE cart_id = $2 AND product_id = $3 AND size = $4`,[quantity, cart_id, product_id, size]
            );
        }
        const updatedCart = await pool.query(
            `SELECT p.id, p.name, p.image_url, p.price_cents, p.discount_percentage, 
            ci.size, ci.quantity, pv.stock
            FROM carts c
            JOIN cart_items ci ON c.id = ci.cart_id
            JOIN products p ON ci.product_id = p.id
            JOIN product_variants pv ON pv.product_id = p.id AND pv.size = ci.size
            WHERE c.user_id = $1
            ORDER BY p.id ASC, ci.size ASC`,[req.session.userId]
        );
        res.json(updatedCart.rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({message: "Server error"});
    }
});

router.delete('/', requireAuth, async (req, res) => {
    try {
        const {product_id, size} = req.body;
        const userCart = await pool.query(
            "SELECT id FROM carts WHERE user_id = $1", [req.session.userId]
        );
        const cart_id = userCart.rows[0].id;
        const cartItemCheck = await pool.query(
            `SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2 AND size = $3`,
            [cart_id, product_id, size]
        );
        if (cartItemCheck.rows.length === 0) {
            return res.status(404).json({message: "Not found"});
        }
        await pool.query(
            "DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2 AND size = $3",
            [cart_id, product_id, size]
        );
        const updatedCart = await pool.query(
            `SELECT ci.id, p.name, p.image_url, p.price_cents, p.discount_percentage, 
            ci.size, ci.quantity, pv.stock
            FROM carts c
            JOIN cart_items ci ON c.id = ci.cart_id
            JOIN products p ON ci.product_id = p.id
            JOIN product_variants pv ON pv.product_id = p.id AND pv.size = ci.size
            WHERE c.user_id = $1`,[req.session.userId]
        );
        res.json(updatedCart.rows);
    }  catch (err) {
        console.log(err);
        res.status(500).json({error: "Server error"});
    }
});

export default router;
