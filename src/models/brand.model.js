import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    baseDailyRate: {
      type: Number,
      required: true,
      min: 0,
    },
    depositAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    imageUrl: {
      type: String,
      default: null,
      trim: true,
    },
    images: {
      type: [String], // Danh sách nhiều ảnh cho carousel
      default: [],
    },
    // Thông tin chi tiết xe
    specs: {
      seats: {
        type: Number,
        default: null,
        min: 2,
        max: 9,
      },
      range: {
        type: Number, // Quãng đường di chuyển tối đa (km)
        default: null,
        min: 0,
      },
      horsePower: {
        type: Number, // Công suất (HP)
        default: null,
        min: 0,
      },
      batteryCapacity: {
        type: Number, // Dung lượng pin (kWh)
        default: null,
        min: 0,
      },
      transmission: {
        type: String, // Số tự động/số tay
        enum: ["automatic", "manual", "cvt", "single-speed"],
        default: null,
      },
      fuelType: {
        type: String,
        enum: ["electric", "hybrid"],
        default: "electric",
      },
      carType: {
        type: String, // Loại xe
        enum: ["sedan", "suv", "hatchback", "minivan", "crossover", "minicar"],
        default: null,
      },
      trunkCapacity: {
        type: Number, // Dung tích cốp (lít)
        default: null,
        min: 0,
      },
      airbags: {
        type: Number, // Số túi khí
        default: null,
        min: 0,
        max: 12,
      },
      wheelSize: {
        type: Number, // Kích thước la-zăng (inch)
        default: null,
        min: 13,
        max: 22,
      },
      screenSize: {
        type: Number, // Kích thước màn hình (inch)
        default: null,
        min: 5,
        max: 17,
      },
      dailyKmLimit: {
        type: Number, // Giới hạn km/ngày
        default: 300,
        min: 0,
      },
    },
    // Thông tin hãng
    manufacturer: {
      country: {
        type: String, // Quốc gia sản xuất
        default: null,
      },
      website: {
        type: String,
        default: null,
      },
    },
    // Tính năng
    features: {
      type: [String], // Danh sách tính năng: ["GPS", "Camera lùi", "Cảm biến lốp", ...]
      default: [],
    },
    // Trạng thái
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Brand = mongoose.model("Brand", brandSchema);

export default Brand;
