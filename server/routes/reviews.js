import express from "express";
import pool from "../db.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

router.post('/reviews', requireAuth,  async (req, res) => {
    try {
        const {product_id, rating, review_text} = req.body;
        const productCheck = await pool.query(
            "SELECT * FROM products WHERE id = $1", [product_id]
        );
        if (productCheck.rows.length === 0) {
            return res.status(404).json({message: "Product not found"});
        }
        const existing = await pool.query(
            "SELECT * FROM reviews WHERE user_id = $1 AND product_id = $2", [req.session.userId, product_id]
        );
        if (existing.rows.length > 0) {
            return res.status(400).json({message: "You already have reviewed this product"});
        }
        const reviewResult = await pool.query(
            `INSERT INTO reviews (user_id, product_id, rating, review_text)
            VALUES ($1, $2, $3, $4) RETURNING *`, [req.session.userId, product_id, rating, review_text]
        );
        res.json(reviewResult.rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Server error"});
    }
});

router.put('/reviews/:id', requireAuth, async (req, res) => {
    try {
        const reviewId = req.params.id;
        const {rating, review_text} = req.body;
        const reviewCheck = await pool.query(
            "SELECT user_id FROM reviews WHERE id = $1", [reviewId]
        );
        if (reviewCheck.rows.length === 0) {
            return res.status(404).json({message: "No reviews found"});
        }
        if (reviewCheck.rows[0].user_id !== req.session.userId) {
            return res.status(403).json({message: "Not allowed to edit this review"});
        }
        const updated = await pool.query(
            `UPDATE reviews SET rating = $1, review_text = $2
            WHERE id = $3 RETURNING *`, [rating, review_text, reviewId]
        );
        res.json(updated.rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Server error"});
    }
});

router.delete('/reviews/:id', requireAuth, async (req, res) => {
    try {
        const reviewId = req.params.id;
        const reviewCheck = await pool.query(
            "SELECT user_id FROM reviews WHERE id = $1", [reviewId]
        );
        if (reviewCheck.rows.length === 0) {
            return res.status(404).json({message: "No reviews found"});
        }
        if (reviewCheck.rows[0].user_id !== req.session.userId) {
            return res.status(403).json({message: "Not allowed to edit this review"});
        }
        await pool.query(
            "DELETE FROM reviews WHERE id = $1", [reviewId]
        );
        res.json({message: "Review deleted successfully"});
    } catch (err) {
        console.log(err);
        res.status(500).json({error: err.message});
    }
});

router.get('/reviews/:id', async (req, res) => {
    try {
        const reviewId = req.params.id;
        const reviewCheck = await pool.query(
            "SELECT * FROM reviews WHERE id = $1", [reviewId]
        );
        if (reviewCheck.rows.length === 0) {
            return res.status(404).json({message: "No reviews found"});
        }
            res.json(reviewCheck.rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: err.message});
    }
})


router.get('/users/:id/reviews', async (req, res) => {
    const userId = req.params.id;
    try {
        const result = await pool.query(
            `SELECT r.id, r.product_id, r.rating, r.review_text, r.created_at, p.name AS product_name, p.image_url,
            p.price_cents, p.discount_percentage, u.user_name, u.email, u.created_at
            FROM reviews r
            JOIN products p ON p.id = r.product_id
            JOIN users u ON u.id = r.user_id
            WHERE r.user_id = $1
            ORDER BY r.created_at DESC`,[userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({message: "Server error"});
    }
});


router.get('/highest/reviews', async (_req, res) => {
    try {
        const result = await pool.query(
            `SELECT r.id, r.user_id, r.product_id, r.rating, r.review_text, r.created_at, u.user_name
            FROM reviews r
            JOIN users u ON u.id = r.user_id
            ORDER BY r.rating DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({message: "Server error"});
    }
});

router.get('/products/:id/reviews', async (req, res) => {
    try {
        const product_id = req.params.id;
        const sort = req.query.sort;
        let orderClause = "r.created_at DESC";
        if (sort === "highest") {
            orderClause = "r.rating DESC, r.created_at DESC";
        } else if (sort === "lowest") {
            orderClause = "r.rating ASC, r.created_at DESC";
        }
        const result = await pool.query(
            `SELECT r.id, r.user_id, r.rating, r.review_text, r.created_at, u.user_name
            FROM reviews r
            JOIN users u ON u.id = r.user_id
            WHERE r.product_id = $1
            ORDER BY ${orderClause}`, [product_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({message: "Server error"});
    }
});

export default router;
