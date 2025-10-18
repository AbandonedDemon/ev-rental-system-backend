import { Router } from "express";
import {
  listRentals,
  getRental,
  createRental,
  updateRental,
  deleteRental,
} from "../controllers/rental.controller.js";
import authGuard from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authGuard("admin", "staff"), listRentals);
router.get("/:id", authGuard("admin", "staff"), getRental);
router.post("/", authGuard("admin", "staff"), createRental);
router.put("/:id", authGuard("admin", "staff"), updateRental);
router.delete("/:id", authGuard("admin"), deleteRental);

export default router;
