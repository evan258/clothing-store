const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({message: "Not logged in"});
    }
    next();
}

export default requireAuth;
