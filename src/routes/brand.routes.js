import { Router } from "express";
import {
  listBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
} from "../controllers/brand.controller.js";
import authGuard from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", listBrands);
router.get("/:id", getBrand);
router.post("/", authGuard("admin", "staff"), createBrand);
router.put("/:id", authGuard("admin", "staff"), updateBrand);
router.delete("/:id", authGuard("admin"), deleteBrand);

export default router;
