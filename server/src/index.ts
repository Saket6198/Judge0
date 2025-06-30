import express from "express";
import dotenv from "dotenv";
import submitRouter from "./routes/submit";
import main from "./config/db";
import cookieParser from "cookie-parser";
import problemRouter from "./routes/problem";
import { authRouter } from "./routes/user_authentication";
import { connectRedis } from "./config/redis";
import { chatRouter } from "./routes/chat";
import cors from "cors";
import { videoRouter } from "./routes/videoCreator";
dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "https://judge0.netlify.app",
      "https://judge0.netlify.app",
      "http://localhost:5173",
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Health check endpoint for Render
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: "Service is healthy",
  });
});

app.use("/user", authRouter);
app.use("/problem", problemRouter);
app.use("/submission", submitRouter);
app.use("/chat", chatRouter);
app.use("/video", videoRouter);
main()
  .then(async () => {
    await connectRedis();
    console.log("Connected to MongoDB");
    const port = process.env.PORT || process.env.PORT_NUMBER || 3000;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.log("error connecting to the database:", err);
  });
