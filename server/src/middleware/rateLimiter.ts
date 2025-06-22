import { Request, Response, NextFunction } from "express"
import { client } from "../config/redis";

export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const redisKey = `submit_cooldown:${req.result._id}`;
        const exists = await client.exists(redisKey);
        if(exists){
            res.status(429).json({ error: "You are submitting too frequently. Please wait before trying again." });
            return;
        }
        await client.set(redisKey, `submit_cooldown`, {
            EX: 10 ,
            NX: true
        });
        next();
    }catch(err: any){
        console.error("Error in rate limiter middleware:", err);
        res.status(500).json({ error: "Internal server error" });
    }
}