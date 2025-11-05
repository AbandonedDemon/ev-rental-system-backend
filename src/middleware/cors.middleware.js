import cors from "cors";

const allowedOrigins = [
  "http://localhost:4200",
  "http://localhost:5000",
  "http://localhost:8081",
  "exp://192.168.1.140:8081",
  "https://electric-rental-p4ohi.ondigitalocean.app",
  "https://electric-vehicle-rental.pages.dev",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

export default cors(corsOptions);
