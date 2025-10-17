import fs from "fs";
import path from "path";
import multer from "multer";

const ensureDirSync = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const createStorage = (folderName) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(process.cwd(), "uploads", folderName);
      ensureDirSync(uploadPath);
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const safeName = file.originalname.replace(/\s+/g, "-");
      cb(null, `${timestamp}-${safeName}`);
    },
  });

export const documentUpload = multer({
  storage: createStorage("documents"),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const handoverUpload = multer({
  storage: createStorage("handovers"),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export default {
  documentUpload,
  handoverUpload,
};
