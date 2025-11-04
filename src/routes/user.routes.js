import { Router } from "express";
import {
  getCurrentUser,
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";
import { authGuard } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", listUsers);
router.get("/me", authGuard(), getCurrentUser);
router.get("/:id", getUser);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
