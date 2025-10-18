import { Router } from "express";
import {
  listUserDocuments,
  getUserDocument,
  createUserDocument,
  updateUserDocument,
  deleteUserDocument,
} from "../controllers/userDocument.controller.js";
import { documentUpload } from "../middleware/upload.middleware.js";
import authGuard from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authGuard("admin", "staff"), listUserDocuments);
router.get("/:id", authGuard("admin", "staff", "renter"), getUserDocument);
router.post(
  "/",
  authGuard("admin", "staff", "renter"),
  documentUpload.fields([
    { name: "frontImage", maxCount: 1 },
    { name: "backImage", maxCount: 1 },
    { name: "drivingLicenseImage", maxCount: 1 },
  ]),
  createUserDocument,
);
router.put("/:id", authGuard("admin", "staff"), updateUserDocument);
router.delete("/:id", authGuard("admin"), deleteUserDocument);

export default router;
