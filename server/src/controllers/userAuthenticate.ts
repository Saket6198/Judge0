import userModel from "../models/user";
import { validate, adminvalidate } from "../utils/validator";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { client } from "../config/redis";
import submissionModel from "../models/submissions";

const register = async (req: Request, res: Response) => {
  try {
    validate(req.body);
    // first validate the req body elements
    // const {name, emailId, password} = req.body;
    req.body.role = "user";
    // check if user already exists
    req.body.password = await bcrypt.hash(req.body.password, 10);
    const user = await userModel.create(req.body);

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret)
      throw new Error("JWT_SECRET environment variable is not defined");

    const token = jwt.sign(
      { emailId: req.body.emailId, role: req.body.role },
      jwtSecret,
      { expiresIn: "1h" }
    );
    const reply = {
      name: user.name,
      emailId: user.emailId,
      _id: user._id,
    };
    res.cookie("token", token, {
      maxAge: 60 * 60 * 1000, // 1 hour
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    res.status(201).json({
      user: reply,
      message: "User registered successfully",
    });
  } catch (err: any) {
    if (err.code === 11000 && err.keyPattern && err.keyPattern.emailId) {
      res.status(400).json({ error: "A user with this email already exists." });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
};

const adminRegister = async (req: Request, res: Response) => {
  try {
    adminvalidate(req.body);
    // first validate the req body elements
    // const {name, emailId, password} = req.body;
    // req.body.role = "admin";
    // check if user already exists
    req.body.password = await bcrypt.hash(req.body.password, 10);
    const user = await userModel.create(req.body);
    const reply = {
      name: user.name,
      emailId: user.emailId,
      _id: user._id,
      role: user.role
    };
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret)
      throw new Error("JWT_SECRET environment variable is not defined");

    const token = jwt.sign(
      { emailId: req.body.emailId, role: req.body.role },
      jwtSecret,
      { expiresIn: "1h" }
    );
    res.cookie("token", token, {
      maxAge: 60 * 60 * 1000, // 1 hour
    });
    res.status(201).json({
      user: reply,
      message: "User registered successfully",
      token: token,
    });
  } catch (err: any) {
    if (err.code === 11000 && err.keyPattern && err.keyPattern.emailId) {
      res.status(400).json({ error: "A user with this email already exists." });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
};

const login = async (req: Request, res: Response) => {
  try {
    const { emailId, password } = req.body;
    if (!emailId) {
      throw new Error("Email And Password is required");
    }
    if (!password) {
      throw new Error("Email And Password is required");
    }
    const user = await userModel.findOne({ emailId: emailId });
    if (!user) {
      throw new Error("Invalid Credentials");
    }
    const reply = {
      name: user.name,
      emailId: user.emailId,
      _id: user._id,
      role: user.role
    };
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new Error("Invalid Credentials");
    }
    const token = jwt.sign(
      { emailId: user.emailId, role: user.role },
      process.env.JWT_SECRET || "",
      { expiresIn: "1h" }
    );
    res.cookie("token", token, {
      maxAge: 60 * 60 * 1000, // 1 hour
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    res.status(201).json({
      user: reply,
      message: "Login successful",
    });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
};

const logout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.token;
    const payload = jwt.decode(token);

    await client.set(`token:${token}`, "blocked");
    let exp: number | undefined;
    if (
      payload &&
      typeof payload === "object" &&
      "exp" in payload &&
      typeof payload.exp === "number"
    ) {
      exp = payload.exp;
    }
    if (exp) {
      await client.expireAt(`token:${token}`, exp);
    }
    res.cookie("token", null, {
      expires: new Date(Date.now()),
    });
    res.status(200).json({ message: "Logout successful" });
  } catch (err: any) {
    res.status(503).json({ error: err.message });
  }
};

const getProfile = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.token;
    const payload = jwt.decode(token);
    const { emailId } = payload as { emailId: string };
    const data = await userModel.findOne({ emailId: emailId });
    res.status(200).json({ data: data });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
};

export const deleteProfile = async (req: Request, res: Response) => {
  try {
    await userModel.findByIdAndDelete(req.result._id);
    await submissionModel.deleteMany(req.result._id);
    res.status(200).json({ message: "Profile deleted successfully" });
  } catch (err: any) {
    res
      .status(500)
      .json({ error: "Error in deleting profile: " + err.message });
    return;
  }
};
export { register, adminRegister, login, logout, getProfile };
