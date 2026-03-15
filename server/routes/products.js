import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get('/latest', async (_req, res) => {
    try {
        const productsResult = await pool.query(
            `SELECT p.id, p.name, p.image_url, p.price_cents, p.discount_percentage, p.created_at,
            AVG(r.rating) AS average_rating, COUNT(r.id) AS total_reviews
            FROM products p
            LEFT JOIN reviews r ON r.product_id = p.id
            GROUP BY p.id, p.name, p.image_url, p.price_cents, p.discount_percentage, p.created_at
            ORDER BY p.created_at DESC LIMIT 6`
        );
        res.json(productsResult.rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Server error"});
    }
});

router.get('/trending', async (_req, res) => {
    try {
        const productsResult = await pool.query(
            `SELECT p.id, p.name, p.image_url, p.price_cents, p.discount_percentage, p.total_sold,
            AVG(r.rating) AS average_rating, COUNT(r.id) AS total_reviews
            FROM products p
            LEFT JOIN reviews r ON r.product_id = p.id
            GROUP BY p.id, p.name, p.image_url, p.price_cents, p.discount_percentage, p.total_sold
            ORDER BY p.total_sold DESC LIMIT 6`
        );
        res.json(productsResult.rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Server error"});
    }
});

router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || !q.trim()) {
            return res.json([]);
        }
        const result = await pool.query(
            `SELECT p.id, p.name, p.image_url, p.price_cents, p.discount_percentage,
            AVG(r.rating) AS average_rating, COUNT(r.id) AS total_reviews
            FROM products p
            LEFT JOIN reviews r ON p.id = r.product_id
            WHERE p.name ILIKE $1
            GROUP BY p.id, p.name, p.image_url, p.price_cents, p.discount_percentage
            ORDER BY p.name`, [`%${q}%`]
        );
        res.json(result.rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Server error"});
    }
});

router.get('/:id/related', async (req, res) => {
    try {
        const {id} = req.params;
        const existing = await pool.query(
            "SELECT name FROM products WHERE id = $1", [id]
        );
        if (existing.rows.length === 0) {
            return res.status(404).json({message: "No product found"});
        }
        const name = existing.rows[0].name;
        const result = await pool.query(
            `SELECT p.id, p.name, p.image_url, p.price_cents, p.discount_percentage,
            COUNT(r.id) AS total_reviews, AVG(r.rating) AS average_rating
            FROM products p
            JOIN products_categories pc ON p.id = pc.product_id
            LEFT JOIN reviews r ON r.product_id = p.id
            WHERE pc.category_id IN (
                SELECT category_id FROM products_categories WHERE product_id = $1
            )
            AND p.id != $1
            -- AND p.name % $2
            GROUP BY p.id, p.name, p.image_url, p.price_cents,p.discount_percentage
            ORDER BY similarity(p.name, $2) DESC, average_rating DESC
            LIMIT 6`, [id, name]
        );
        res.json(result.rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Server error"});
    }
});

router.get('/:id', async (req, res) => {
    try {
        const product_id = req.params.id;
        const productResult = await pool.query(
            `SELECT p.id, p.name, p.image_url, p.price_cents, p.discount_percentage,
            AVG(r.rating) AS average_rating, COUNT(r.id) AS total_reviews
            FROM products p
            LEFT JOIN reviews r ON r.product_id = p.id
            WHERE p.id = $1
            GROUP BY p.id, p.name, p.image_url, p.price_cents, p.discount_percentage`, [product_id]
        );
        res.json(productResult.rows[0]);
    } catch (err) {
        console.log(err);
        res.status(500).json({message: "Server error"});
    }
});

router.get('/:id/stock', async (req, res) => {
    try {
        const productId = req.params.id;
        const result = await pool.query(
            "SELECT id, size, stock FROM product_variants WHERE product_id = $1 ORDER BY id", [productId]
        );
        res.json(result.rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({message: "Server error"});
    }
});

router.get('/categories/:id', async (req, res) => {
    try {
        const categoryId = req.params.id;
        const sort = req.query.sort;
        let orderClause = "p.total_sold DESC";
        if (sort === "popularity_lowest") {
            orderClause = "p.total_sold ASC";
        } else if (sort === "price_lowest") {
            orderClause = "p.price_cents ASC";
        } else if (sort === "price_highest") {
            orderClause = "p.price_cents DESC";
        }
        const productsResult = await pool.query(
            `SELECT p.id, p.name, p.image_url, p.price_cents, p.discount_percentage, p.total_sold,
            COALESCE(AVG(r.rating), 0) AS average_rating, COUNT(r.id) AS total_reviews
            from categories c
            JOIN products_categories pc ON pc.category_id = c.id
            JOIN products p ON p.id = pc.product_id
            LEFT JOIN reviews r ON r.product_id = p.id
            WHERE c.id = $1
            GROUP BY p.id, p.name, p.image_url, p.price_cents, p.discount_percentage, p.total_sold
            ORDER BY ${orderClause}`, [categoryId]
        );
        res.json(productsResult.rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Server error"});
    }
});

export default router;
