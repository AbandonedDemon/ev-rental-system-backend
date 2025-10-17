import path from "path";
import dotenv from "dotenv";
import express from "express";

import connectDB from "./config/mongodb.js";
import { createSwaggerSpec, createSwaggerUiHtml } from "./config/swagger.js";
import bookingRoutes from "./routes/booking.routes.js";
import handoverRoutes from "./routes/handover.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import rentalRoutes from "./routes/rental.routes.js";
import stationRoutes from "./routes/station.routes.js";
import userRoutes from "./routes/user.routes.js";
import userDocumentRoutes from "./routes/userDocument.routes.js";
import vehicleRoutes from "./routes/vehicle.routes.js";
import corsMiddleware from "./middleware/cors.middleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

const swaggerSpec = createSwaggerSpec({
  serverUrl:
    process.env.SWAGGER_SERVER_URL ||
    (PORT ? `http://localhost:${PORT}` : "http://localhost:4000"),
});
const swaggerUiHtml = createSwaggerUiHtml();

app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/", (req, res) => {
  res.json({ message: "EV Rental System API" });
});

app.get("/swagger.json", (req, res) => {
  res.json(swaggerSpec);
});

app.get("/docs", (req, res) => {
  res.type("html").send(swaggerUiHtml);
});

app.use("/api/booking", bookingRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/booking", bookingRoutes); // legacy support
app.use("/api/handovers", handoverRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/rentals", rentalRoutes);
app.use("/api/stations", stationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/user-documents", userDocumentRoutes);
app.use("/api/userDocs", userDocumentRoutes); // legacy support
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

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server start failed:", error.message);
    process.exit(1);
  }
};

startServer();
