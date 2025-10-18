import { verifyToken } from "../utils/jwt.js";
import { User } from "../models/user.model.js";

export const authGuard = (...allowedRoles) => async (req, res, next) => {
  try {
    const headerToken = req.headers.authorization?.replace("Bearer ", "");
    const cookieToken = req.cookies?.token;
    const token = headerToken || cookieToken;

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub ?? decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: "Insufficient permission" });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default authGuard;
