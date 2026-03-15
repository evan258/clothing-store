import express from "express";
import pool from "../db.js";
import bcrypt from "bcrypt";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const {username, email, password} = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({message: "Bad connection"});
        }
        const existing = await pool.query(
            "SELECT id FROM users WHERE email = $1",[email]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({error: "Email already registered"});
        }

        const hash = await bcrypt.hash(password, 10);
        const newUser = await pool.query(
            `INSERT INTO users (user_name, email, password_hash)
        VALUES ($1, $2, $3) RETURNING id, user_name, email`,[username, email, hash]
        );

        const user = newUser.rows[0];
        await pool.query(
            "INSERT INTO carts (user_id) VALUES($1)",[user.id]
        );
    
        req.session.userId = user.id;
        res.status(201).json({id: user.id, cart_count: 0});

    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Server error"});
    }
});

router.post('/login', async (req, res) => {
    try {
        const {email, password} = req.body;
        const result = await pool.query(
            `SELECT id, user_name, email, password_hash FROM users WHERE email = $1`, [email]
        );
        if (result.rows.length === 0) {
            return res.status(401).json({error: "Invalid credentials"});
        }

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({error: "Invalid credentials"});
        }

        req.session.userId = user.id;
        const cartCountResult = await pool.query(
            `SELECT COUNT(ci.id) as cart_count FROM carts c
            LEFT JOIN cart_items ci on ci.cart_id = c.id
            WHERE c.id = $1`, [user.id]
        );
        const cart_count = parseInt(cartCountResult.rows[0].cart_count, 10);
        res.json({id: user.id, cart_count});
    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Server error"});
    }
});


router.get('/logout', requireAuth, (req, res) => {
    if (!req.session) {
        return res.status(400).json({message: "No session found"});
    }
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
            return res.status(500).json({message: "Could not logout"});
        }
        res.clearCookie("connect.sid", {
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });
        res.json({message: "Logged out successfully"});
    });
});

export default router;
