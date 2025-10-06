import express from "express";
import dotenv from "dotenv";

import connectDB from "./config/mongodb.js";
import vehicleRoutes from "./routes/vehicle.routes.js";
import { seedVehicles } from "./seed/vehicle.seed.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "EV Rental System API" });
});

app.use("/api/vehicles", vehicleRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }
  res.status(500).json({ message: "Internal server error" });
});

const startServer = async () => {
  try {
    await connectDB();
    await seedVehicles();

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server start failed:", error.message);
    process.exit(1);
  }
};

startServer();
