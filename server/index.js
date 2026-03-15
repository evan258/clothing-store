import express from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import nodeCron from "node-cron";
import stripe from "./services/stripe.js";
import pool from "./db.js";
import authRoutes from "./routes/auth.js";
import webhookRoute from "./routes/webhook.js";
import contactRoutes from "./routes/contact.js";
import cartRoutes from "./routes/cart.js";
import deliveryOptionsRoute from "./routes/devliveryOptions.js";
import checkoutRoute from "./routes/checkout.js";
import ordersRoutes from "./routes/orders.js";
import reviewsRoutes from "./routes/reviews.js";
import productsRoutes from "./routes/products.js";
import usersRoutes from "./routes/users.js";
import categoriesRoute from "./routes/categories.js";


const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));


app.set("trust proxy", 1);

app.use("/", webhookRoute);

app.use(express.json());

const pgSession = connectPgSimple(session);

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
            AND created_at < NOW() - INTERVAL '10 minutes'`,
        );
        for (const order of rows) {
            console.log(`from node cron orderId:${order.id}`);
            await stripe.paymentIntents.cancel(order.payment_intent_id);
        }
    } catch (err) {
        console.log(err);
    }
});

app.use("/", authRoutes);
app.use("/", contactRoutes);
app.use("/cart", cartRoutes);
app.use("/", deliveryOptionsRoute);
app.use("/", checkoutRoute);
app.use("/", ordersRoutes);
app.use("/", reviewsRoutes);
app.use("/", usersRoutes);
app.use("/products", productsRoutes);
app.use("/categories", categoriesRoute);

app.listen(PORT, () => {
    console.log(`server has been started on port:${PORT}`);
});

