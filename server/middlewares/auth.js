import { clerkClient } from "@clerk/express";

export const authMiddleware = async (req, res, next) => {
    try {
        const authObject = req.auth();
        
        const { userId, has } = authObject;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication failed'
            });
        }

        const hasPremiumPlan = has?.({ plan: 'premium' });
        const user = await clerkClient.users.getUser(userId);
        const freeUsage = Number(user?.privateMetadata?.free_usage || 0);

        if (hasPremiumPlan) {
            if (freeUsage > 0) {
                await clerkClient.users.updateUserMetadata(userId, {
                    privateMetadata: { free_usage: 0 }
                });
            }
            req.free_usage = 0;
        } else {
            req.free_usage = freeUsage;
        }

        req.plan = hasPremiumPlan ? 'premium' : 'free';
        next();

    } catch (error) {
        console.error('Auth middleware error:', error?.message || error);
        res.status(401).json({
            success: false,
            message: 'Authentication failed'
        });
    }
}