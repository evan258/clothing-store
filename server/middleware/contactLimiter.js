import rateLimit from "express-rate-limit";

const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: {error: "Too many contact requests, Try again later"},
});

export default contactLimiter;
