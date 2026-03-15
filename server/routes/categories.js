import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get('/', async (_req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM categories"
        );
        res.json(result.rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Server error"});
    }
});

export default router;
