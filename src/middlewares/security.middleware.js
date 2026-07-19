import { slidingWindow } from "@arcjet/node";
import aj from "../config/arcjet.js"
import logger from "../config/logger.js";

export const securityMiddleware = async (req, res, next) => {
    try {

        const role = req.user?.role || 'guest'

        let limit;
        let message;

        switch (role) {
            case "admin":
                limit = 20,
                    message = "Admin Limit reached to 20 per minute. Slow Down"
                break;
            case "user":
                limit = 10,
                    message = "User Limit reached to 10 per minute. Slow Down"
                break;
            case "guest":
                limit = 5,
                    message = "Guest Limit reached to 5 per minute. Slow Down"
                break;
        }

        const client = aj.withRule(slidingWindow({ mode: "LIVE", interval: "1m", max: limit, name: "Role rate Limit" }))
        const decision = await client.protect(req)

        if(decision.isDenied() && decision.reason.isBot()){
            logger.warn("Bot request Blocked ",{ip : req.ip,path : req.path , userAgent: req.get("User-Agent") })

            return res.status(403).json({error: "Forbidden",message: "Automated requests are not allowed"})
        }
        if(decision.isDenied() && decision.reason.isRateLimit()){
            logger.warn("RateLimit request exceed ",{ip : req.ip,path : req.path , userAgent: req.get("User-Agent") })

            return res.status(403).json({error: "Forbidden",message: "Too many request"})
        }
        if(decision.isDenied() && decision.reason.isShield()){
            logger.warn("Shield Blocked request",{ip : req.ip,path : req.path , userAgent: req.get("User-Agent"),method: req.method })

            return res.status(403).json({error: "Forbidden",message: "Request Blocked due to security policy"})
        }


        next()

    } catch (e) {
        console.log("Error by Arcjet Security Middleware : ", e)
        return res.status(500).json({ error: "Internal Server Error", message: "Something went wrong from the security middleware " })
    }
}