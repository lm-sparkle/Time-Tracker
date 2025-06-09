import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.model";
import Admin from "../models/Admin.model";

const JWT_SECRET = process.env.JWT_SECRET;

// POST /api/login?adminKey

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any | void> => {
  try {
    const { email, password } = req.body;
    const { adminKey } = req.query;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    let role: "admin" | "user" = "user";

    if (adminKey && adminKey === process.env.ADMIN_SECRET_KEY) {
      role = "admin";
    }

    const Model = role === "admin" ? Admin : User;
    const user = await Model.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Wrong password." });
    }

    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in the environment variables");
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role },
      JWT_SECRET,
      { expiresIn: "12h" }
    );

    return res.status(200).json({
      message: `${role} logged in successfully.`,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role,
      },
    });
  } catch (error) {
    next(error);
  }
};
