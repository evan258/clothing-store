import express from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcrypt";
import Stripe from "stripe";
import nodeCron from "node-cron";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import pool from "./db.js";

const PORT = process.env.PORT || 3000;
const app = express();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

const pgSession = connectPgSimple(session);

app.set("trust proxy", 1);

app.use(
    session({
        store: new pgSession({
            pool: pool,
            tableName: "session"
        }),
        secret: process.env.SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000
        }
    })
);

nodeCron.schedule('*/5 * * * *', async () => {
    try {
        const {rows} = await pool.query(
            `SELECT id, payment_intent_id FROM orders
            WHERE status = 'pending'
            AND created_at < NOW() - INTERVAL '5 minutes'`,
        );
        for (const order of rows) {
            console.log(`from node cron orderId:${order.id}`);
            await stripe.paymentIntents.cancel(order.payment_intent_id);
        }
    } catch (err) {
        console.log(err);
    }
});

app.post('/webhook', express.raw({type: "application/json"}), async (req, res) => {
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

app.use(express.json());

const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({message: "Not logged in"});
    }
    next();
}

const contactLimiter = rateLimit({
    windowMs: 60* 60 * 1000,
    max: 3,
    message: {error: "Too many contact requests, Try again later"},
});

const contactSchema = z.object({
    name: z.string().trim().min(2),
    email: z.string().email(),
    text: z.string().trim().min(10).max(100),
    captchaToken: z.string()
});

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
});

app.post('/contact', requireAuth, contactLimiter, async (req, res) => {
    try {
        const result = contactSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json(result.error.flatten().fieldErrors);
        }
        const {name, email, text, captchaToken} = result.data;
        const captchaRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
        });
        const captchaData = await captchaRes.json();
        if (!captchaData.success) {
            return res.status(400).json({error: "Captcha verification failed"});
        }
        const otp = Math.floor(100000 + Math.random() * 900000);
        req.session.email = email;
        req.session.otp = otp;
        req.session.expire = Date.now() + 5 * 60 * 1000;
        req.session.text = text;
        req.session.name = name;
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your OTP code",
            text: `Your verification code is ${otp}. It expires in 5 minutes`
        });
        res.json({message: "OTP sent to your email"});
    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Server error"});
    }
});

app.post('/contact/verification', requireAuth, async (req, res) => {
    const {otp} = req.body;
    if (req.session.otp != otp) {
        return res.status(401).json({error: "Invalid code"});
    }
    if (!req.session.expire || req.session.expire < Date.now()) {
        return res.status(400).json({error: "OTP expired"});
    }
    const {name, email, text} = req.session;
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            replyTo: email,
            subject: "New contact message",
            text: `
Name: ${name}
Email: ${email}
Message: ${text}
`
        });
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "We received your message!",
            text: "Thanks for reaching out! We will get back to you soon."
        });
        req.session.otp = null;
        req.session.expire = null;
        req.session.email = null;
        req.session.text = null;
        req.session.name = null;

        res.json({message: "Message sent successfully"});
    } catch (err) {
        console.log(err);
        return res.status(400).json({error: "Failed to sent mail"});
    }
});


app.post('/register', async (req, res) => {
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

app.post('/login', async (req, res) => {
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

app.get('/delivery/options', async (_req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM delivery_options"
        );
        res.json(result.rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Server error"});
    }
});


app.get('/cart', requireAuth, async (req, res) => {
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

app.post('/cart', requireAuth, async (req, res) => {
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

app.put('/cart', requireAuth, async (req, res) => {
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

app.delete('/cart', requireAuth, async (req, res) => {
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

app.get('/checkout/:id', requireAuth, async (req, res) => {
    const orderId = req.params.id;
    try {
        const orderResult = await pool.query(
            "SELECT status, total_cents, payment_intent_id FROM orders where id = $1", [orderId]
        );
        if (!orderResult.rows.length) {
            return res.status(404).json({message: "Order has been expired"});
        }
        if (orderResult.rows[0].status !== 'pending') {
            return res.status(400).json({message: "Order has already been paid"});
        }
        const payment_intent_id = orderResult.rows[0].payment_intent_id;
        const total = orderResult.rows[0].total_cents;
        if (!payment_intent_id) {
            const payment_intent = await stripe.paymentIntents.create({
                amount: total,
                currency: "usd",
                metadata: {
                    order_id: orderId,
                    user_id: req.session.userId,
                },
                automatic_payment_methods: {enabled: true, },
            });
            await pool.query(
                "UPDATE orders SET payment_intent_id = $1 WHERE id = $2", [payment_intent.id, orderId]
            );
            return res.json({clientSecret: payment_intent.client_secret});
        } else {
            const payment_intent = await stripe.paymentIntents.retrieve(payment_intent_id);
            return res.json({clientSecret: payment_intent.client_secret});
        }
    } catch (err) {
        console.log(err);
        return res.json({message: "Server error"});
    }
});

app.get('/orders', requireAuth, async (req, res) => {
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
        res.json(formatted);
    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Server error"});
    }
});


app.post('/orders', requireAuth, async (req, res) => {
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

app.delete('/orders/:id', requireAuth, async (req, res) => {
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

app.delete('/cancel/:id', requireAuth, async (req, res) => {
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

app.post('/reviews', requireAuth,  async (req, res) => {
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

app.put('/reviews/:id', requireAuth, async (req, res) => {
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

app.delete('/reviews/:id', requireAuth, async (req, res) => {
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

app.get('/reviews/:id', async (req, res) => {
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


app.get('/users/:id/reviews', async (req, res) => {
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


app.get('/highest/reviews', async (_req, res) => {
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


app.get('/users', requireAuth, async (req, res) => {
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

app.get('/products/:id/reviews', async (req, res) => {
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

app.get('/me', requireAuth, async (req, res) => {
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

app.get('/products/latest', async (_req, res) => {
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

app.get('/products/trending', async (_req, res) => {
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

app.get('/products/search', async (req, res) => {
    try {
        const { q } = req.query; // http://localhost:3000/products/search?q=tshirt
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

app.get('/products/:id/related', async (req, res) => {
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

app.get('/products/:id', async (req, res) => {
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

app.get('/products/:id/stock', async (req, res) => {
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

app.get('/products/categories/:id', async (req, res) => {
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

app.get('/categories', async (_req, res) => {
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

app.get('/logout', requireAuth, (req, res) => {
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
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        });
        res.json({message: "Logged out successfully"});
    });
});



app.listen(PORT, () => {
    console.log(`server has been started on port:${PORT}`);
});

