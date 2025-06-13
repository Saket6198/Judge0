import express from 'express';
import dotenv from 'dotenv';
import submitRouter from './routes/submit';
import main from './config/db';
import cookieParser from 'cookie-parser';
import problemRouter from './routes/problem';
import {authRouter} from './routes/user_authentication'
import {connectRedis} from './config/redis'

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/user', authRouter);
app.use('/problem', problemRouter);
app.use('/submission', submitRouter);


main()
    .then(async () => {
        await connectRedis();
        console.log('Connected to MongoDB');
        app.listen(process.env.PORT_NUMBER, () => {
        console.log(`Server is running on port ${process.env.PORT_NUMBER}`);
        })
    })
    .catch((err) => {
        console.log("error connecting to the database:", err);
    })

