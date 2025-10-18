import { signToken } from "../utils/jwt.js";
import { verifyPassword, hashPassword } from "../utils/password.js";
import { User } from "../models/user.model.js";
import { sanitizeUser } from "./user.controller.js";

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Incorrect email or password" });
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect email or password" });
    }

    const token = signToken({ sub: user._id, role: user.role });

    return res.json({
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req, res, next) => {
  try {
    const { password, role = "renter", ...rest } = req.body;
    if (!password) {
      return res.status(400).json({ message: "password is required" });
    }

    const existing = await User.findOne({ email: rest.email });
    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    const user = await User.create({
      ...rest,
      role,
      passwordHash: await hashPassword(password),
    });

    const token = signToken({ sub: user._id, role: user.role });

    return res.status(201).json({
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  login,
  register,
};
