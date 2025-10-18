import { Router } from "express";
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";
import authGuard from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authGuard("admin"), listUsers);
router.get(
  "/:id",
  authGuard("admin", "staff", "renter"),
  (req, res, next) => {
    const requester = req.user;
    if (!requester) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (requester.role === "admin" || requester.role === "staff" || requester.id === req.params.id || requester._id?.toString() === req.params.id) {
      return getUser(req, res, next);
    }
    return res.status(403).json({ message: "Insufficient permission" });
  }
);
router.post("/", authGuard("admin"), createUser);
router.put("/:id", authGuard("admin", "staff"), updateUser);
router.delete("/:id", authGuard("admin"), deleteUser);

export default router;
