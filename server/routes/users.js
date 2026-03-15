import express from "express";
import pool from "../db.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

router.get('/users', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const userResult = await pool.query(
            `SELECT id, user_name, email, created_at FROM users
            WHERE id = $1`, [userId]
        );
        if (userResult.rows.length === 0) {
            return res.status(404).json({message: "No user found"});
        }
        const reviewsResult = await pool.query(
            `SELECT r.id, r.rating, r.review_text, r.created_at, p.name AS product_name, p.image_url
            FROM reviews r
            JOIN products p ON p.id = r.product_id
            WHERE r.user_id = $1
            ORDER BY r.created_at DESC`, [userId]
        );
        res.json({
            user: userResult.rows[0],
            reviews: reviewsResult.rows
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({message: "Server error"});
    }
});

router.get('/me', requireAuth, async (req, res) => {
    try {
        const cartCountResult = await pool.query(
            `SELECT count(ci.id) AS cart_count
            FROM carts c
            LEFT JOIN cart_items ci ON c.id = ci.cart_id
            WHERE c.user_id = $1`, [req.session.userId]
        );
        const cart_count = parseInt(cartCountResult.rows[0].cart_count, 10); // base 10
        res.json({id: req.session.userId, cart_count});
    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Server error"});
    }
});



export default router;
