import jwt from "jsonwebtoken";

const DEFAULT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

export const signToken = (payload, options = {}) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: DEFAULT_EXPIRES_IN,
    ...options,
  });
};

export const verifyToken = (token) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.verify(token, process.env.JWT_SECRET);
};

export default {
  signToken,
  verifyToken,
};
