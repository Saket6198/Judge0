import jwt, {JwtPayload} from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import userModel from "../models/user";
import {client} from "../config/redis";

export const userMiddleware  = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const token = req.cookies.token;
        if(!token){
            throw new Error("Authentication token is required");
        }
        const payload = jwt.verify(token, process.env.JWT_SECRET || '') as JwtPayload;
        const {emailId} = payload;
        const result = await userModel.findOne({emailId: emailId});
        if(!result){
            throw new Error("User doesn't exist");
        }
        const expired = await client.get(`token:${token}`);
        if(expired){
            throw new Error("Token has expired, please login again");
        }
        req.result = result;
        next();
    }
    catch(err: any){
        res.status(401).json({ "error": err.message });
        return;
    }
}