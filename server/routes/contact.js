import express from "express";
import contactLimiter from "../middleware/contactLimiter.js";
import resend from "../services/resend.js";
import contactSchema from "../schemas/contactSchema.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

router.post('/contact', requireAuth, contactLimiter, async (req, res) => {
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
        await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: email,
            subject: "Your OTP code",
            text: `SHOP.CO - Your verification code is ${otp}. It expires in 5 minutes`
        });
        res.json({message: "OTP sent to your email"});
    } catch (err) {
        console.log(err);
        res.status(500).json({error: "Server error"});
    }
});

router.post('/contact/verification', requireAuth, async (req, res) => {
    const {otp} = req.body;
    if (req.session.otp != otp) {
        return res.status(401).json({error: "Invalid code"});
    }
    if (!req.session.expire || req.session.expire < Date.now()) {
        return res.status(400).json({error: "OTP expired"});
    }
    const {name, email, text} = req.session;
    try {
        await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: process.env.EMAIL_USER,
            replyTo: email,
            subject: "New contact message",
            text: `
Name: ${name}
Email: ${email}
Message: ${text}
`
        });
        await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: email,
            subject: "SHOP\u200B.CO - We received your message!",
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

export default router;
