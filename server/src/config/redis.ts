import { createClient } from "redis";
import dotenv from "dotenv";
dotenv.config();

const client = createClient({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: 'redis-19429.c264.ap-south-1-1.ec2.redns.redis-cloud.com',
        port: 19429
    }
});


const connectRedis = async () => {
    try{
        await client.connect();
        console.log("Connected to Redis");
    }catch(err: any){
        console.error("Error connecting to Redis:", err);
    }
}
export {connectRedis, client};