import express from "express";
import stripe from "../services/stripe.js";
import pool from "../db.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

router.get('/checkout/:id', requireAuth, async (req, res) => {
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

export default router;
