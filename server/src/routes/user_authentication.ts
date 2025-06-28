import express from "express";
import {
  register,
  adminRegister,
  login,
  logout,
  getProfile,
  deleteProfile,
  googleLogin,
} from "../controllers/userAuthenticate";
import { userMiddleware } from "../middleware/userMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { Request, Response } from "express";
const authRouter = express.Router();

// Register route
authRouter.post("/register", register);

// admin register route seperate
authRouter.post("/admin/register", adminMiddleware, adminRegister);

//login route
authRouter.post("/login", login);

// Google OAuth login route
authRouter.post("/google-login", googleLogin as any);

// //logout route
authRouter.post("/logout", userMiddleware, logout);

// // get user profile route
authRouter.get("/profile", userMiddleware, getProfile);

authRouter.delete("/deleteProfile", userMiddleware, deleteProfile);

authRouter.get("/checkAuth", userMiddleware, (req, res) => {
  const reply = {
    name: req.result.name,
    emailId: req.result.emailId,
    _id: req.result._id,
    role: req.result.role,
  };
  res.status(200).json({
    user: reply,
    message: "User is authenticated",
  });
});
export { authRouter };
