export const protect = async (req, res, next) => {
    try {
        const { userId } = await req.auth();
        console.log("Authenticated user ID:", userId);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        next();
    } catch (error) {
        console.error("Authentication error:", error);
        res.status(401).json({ error: "Unauthorized" });
    }
}

