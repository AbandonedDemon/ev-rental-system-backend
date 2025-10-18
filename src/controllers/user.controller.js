import { hashPassword } from "../utils/password.js";
import User from "../models/user.model.js";

export const sanitizeUser = (userDoc) => {
  const user = userDoc?.toObject ? userDoc.toObject() : userDoc;
  if (user?.passwordHash) {
    delete user.passwordHash;
  }
  return user;
};

export const listUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1, _id: -1 });
    res.json({ data: users.map(sanitizeUser) });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ data: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { password, role = "renter", ...rest } = req.body;
    if (!password) {
      return res.status(400).json({ message: "password is required" });
    }

    const payload = {
      ...rest,
      role,
      passwordHash: await hashPassword(password),
    };

    const user = await User.create(payload);
    res.status(201).json({ data: sanitizeUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "User already exists" });
    }
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (updates.password) {
      updates.passwordHash = await hashPassword(updates.password);
      delete updates.password;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ data: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export default {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
};
