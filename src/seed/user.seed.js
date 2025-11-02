import User from "../models/user.model.js";
import { hashPassword } from "../utils/password.js";

const DEFAULT_USERS = [
  {
    email: "admin@example.com",
    fullName: "Admin User",
    phone: "0900000001",
    password: "admin123", // Will be hashed
    role: "admin",
    status: "active",
  },
  {
    email: "staff@example.com",
    fullName: "Staff User",
    phone: "0900000002",
    password: "staff123", // Will be hashed
    role: "staff",
    status: "active",
  },
  {
    email: "customer1@example.com",
    fullName: "Customer One",
    phone: "0900123456",
    password: "customer123", // Will be hashed
    role: "renter",
    status: "active",
  },
  {
    email: "customer2@example.com",
    fullName: "Customer Two",
    phone: "0900765432",
    password: "customer123", // Will be hashed
    role: "renter",
    status: "active",
  },
  {
    email: "staff2@example.com",
    fullName: "Staff Two",
    phone: "0911222333",
    password: "staff123", // Will be hashed
    role: "staff",
    status: "active",
  },
];

export const seedUsers = async () => {
  const userMap = new Map();

  for (const user of DEFAULT_USERS) {
    const { password, ...userData } = user;

    // Hash password trước khi lưu
    const passwordHash = await hashPassword(password);

    const doc = await User.findOneAndUpdate(
      { email: user.email },
      { ...userData, passwordHash },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    userMap.set(user.email, doc);
  }

  const count = await User.estimatedDocumentCount();
  console.log(`User seed complete. Total users: ${count}`);

  return userMap;
};

export default seedUsers;
