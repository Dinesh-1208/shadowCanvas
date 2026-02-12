import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(" ")[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Add user to request (standard practice, though we might not look up the full user in DB every time for performance, depending on needs)
            // For now, let's just attach the decoded payload which contains userId and email
            req.user = decoded;

            next();
        } catch (error) {
            console.error("Auth Middleware Error:", error.message);
            res.status(401).json({ message: "Not authorized, token failed" });
            return;
        }
        return;
    }

    if (!token) {
        res.status(401).json({ message: "Not authorized, no token" });
    }
};
