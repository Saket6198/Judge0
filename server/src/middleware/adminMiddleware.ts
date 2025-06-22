import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import userModel from "../models/user";
import { client } from "../config/redis";

// Extend Express Request interface to include 'result'
declare global {
    namespace Express {
        interface Request {
            result?: any;
        }
    }
}

export const adminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            throw new Error("Invalid Credentials");
        }
        const payload = jwt.verify(token, process.env.JWT_SECRET || '') as JwtPayload;
        const {emailId, role} = payload;
        if (!emailId){
            throw new Error("Invalid Credentials");
        }
        const result = await userModel.findOne({ emailId: emailId});
        if (!result) {
            throw new Error("User doesn't exist");
        }
        if( role != "admin") {
            throw new Error("Invalid Token");
        }
        const isBlocked = await client.exists(`token:${token}`);
        if(isBlocked){
            throw new Error("Token has expired, please login again"); 
        }

        req.result = result;
        next();
    } catch (err: any) {
        res.status(403).json({ "error": err.message });
    }
};