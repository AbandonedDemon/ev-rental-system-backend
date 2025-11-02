import { Router } from "express";
import {
  listBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
  getBrandVehicleCount,
  getBrandsByStation,
} from "../controllers/brand.controller.js";
import authGuard from "../middleware/auth.middleware.js";

const router = Router();

// Public routes (GET - No auth required)
router.get("/by-station", getBrandsByStation);
router.get("/", listBrands);
router.get("/:id", getBrand);
router.get("/:id/vehicles/count", getBrandVehicleCount);

// Protected routes (Admin only)
router.post("/", authGuard("admin"), createBrand);
router.put("/:id", authGuard("admin"), updateBrand);
router.delete("/:id", authGuard("admin"), deleteBrand);

export default router;
