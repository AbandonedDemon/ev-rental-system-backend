import Brand from "../models/brand.model.js";
import Vehicle from "../models/vehicle.model.js";
import mongoose from "mongoose";

// LIST Brands
export const listBrands = async (req, res, next) => {
  try {
    const brands = await Brand.find().sort({ name: 1 }).lean();
    return res.json({ data: brands });
  } catch (error) {
    return next(error);
  }
};

// GET Brand by ID
export const getBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const brand = await Brand.findById(id).lean();

    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    return res.json({ data: brand });
  } catch (error) {
    return next(error);
  }
};

// CREATE Brand
export const createBrand = async (req, res, next) => {
  try {
    const {
      code,
      name,
      description,
      baseDailyRate,
      depositAmount,
      imageUrl,
      images,
      specs,
      manufacturer,
      features,
      isActive,
    } = req.body;

    // Validation
    if (!code || !name || !baseDailyRate) {
      return res.status(400).json({
        message: "Missing required fields: code, name, baseDailyRate"
      });
    }

    // Kiểm tra trùng code
    const existingBrand = await Brand.findOne({ code });
    if (existingBrand) {
      return res.status(400).json({
        message: `Brand with code '${code}' already exists`
      });
    }

    const newBrand = await Brand.create({
      code,
      name,
      description,
      baseDailyRate,
      depositAmount,
      imageUrl,
      images: images || [],
      specs: specs || {},
      manufacturer: manufacturer || {},
      features: features || [],
      isActive: isActive !== false,
    });

    return res.status(201).json({
      message: "Brand created successfully",
      data: newBrand,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Brand with this code or name already exists"
      });
    }
    return next(error);
  }
};

// UPDATE Brand
export const updateBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      code,
      name,
      description,
      baseDailyRate,
      depositAmount,
      imageUrl,
      images,
      specs,
      manufacturer,
      features,
      isActive,
    } = req.body;

    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    // Update fields
    if (code !== undefined) brand.code = code;
    if (name !== undefined) brand.name = name;
    if (description !== undefined) brand.description = description;
    if (baseDailyRate !== undefined) brand.baseDailyRate = baseDailyRate;
    if (depositAmount !== undefined) brand.depositAmount = depositAmount;
    if (imageUrl !== undefined) brand.imageUrl = imageUrl;
    if (images !== undefined) brand.images = images;
    if (specs !== undefined) brand.specs = { ...brand.specs, ...specs };
    if (manufacturer !== undefined) brand.manufacturer = { ...brand.manufacturer, ...manufacturer };
    if (features !== undefined) brand.features = features;
    if (isActive !== undefined) brand.isActive = isActive;

    await brand.save();

    return res.json({
      message: "Brand updated successfully",
      data: brand,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Brand with this code or name already exists"
      });
    }
    return next(error);
  }
};

// DELETE Brand
export const deleteBrand = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Kiểm tra xem có vehicle nào đang dùng brand này không
    const vehicleCount = await Vehicle.countDocuments({ brand: id });
    if (vehicleCount > 0) {
      return res.status(400).json({
        message: `Cannot delete brand. ${vehicleCount} vehicle(s) are using this brand.`
      });
    }

    const brand = await Brand.findByIdAndDelete(id);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    return res.json({
      message: "Brand deleted successfully",
      data: brand,
    });
  } catch (error) {
    return next(error);
  }
};

export const getBrandsByStation = async (req, res, next) => {
  try {
    let { stationId } = req.query;

    if (!stationId) {
      return res.status(400).json({
        message: "stationId query parameter is required"
      });
    }

    // Convert stationId to ObjectId if it's a valid ObjectId string
    // Otherwise keep it as string (for station code lookup)
    let stationQuery = stationId;
    if (mongoose.Types.ObjectId.isValid(stationId) && stationId.length === 24) {
      stationQuery = new mongoose.Types.ObjectId(stationId);
    }

    // Lấy tất cả brands
    const brands = await Brand.find().sort({ name: 1 }).lean();

    // Tính toán availability cho từng brand
    const brandsWithAvailability = await Promise.all(
      brands.map(async (brand) => {
        // Đếm tổng số xe của brand tại station
        const totalVehicles = await Vehicle.countDocuments({
          brand: brand._id,
          stationId: stationQuery,
        });

        // Đếm số xe available
        const availableVehicles = await Vehicle.countDocuments({
          brand: brand._id,
          stationId: stationQuery,
          status: "available",
        });

        // Đếm số xe đang được thuê
        const rentedVehicles = await Vehicle.countDocuments({
          brand: brand._id,
          stationId: stationQuery,
          status: "rented",
        });

        // Đếm số xe đang bảo trì
        const maintenanceVehicles = await Vehicle.countDocuments({
          brand: brand._id,
          stationId: stationQuery,
          status: "maintenance",
        });

        // Xác định trạng thái availability
        let availabilityStatus = "available"; // Mặc định: sẵn sàng

        if (totalVehicles === 0) {
          availabilityStatus = "no_vehicles"; // Không có xe tại station
        } else if (availableVehicles === 0) {
          availabilityStatus = "out_of_stock"; // Hết xe (tất cả đều bị thuê hoặc maintenance)
        }

        return {
          _id: brand._id,
          code: brand.code,
          name: brand.name,
          description: brand.description,
          baseDailyRate: brand.baseDailyRate,
          depositAmount: brand.depositAmount,
          imageUrl: brand.imageUrl,
          images: brand.images || [],
          specs: brand.specs || {},
          manufacturer: brand.manufacturer || {},
          features: brand.features || [],
          isActive: brand.isActive !== false,
          availability: {
            status: availabilityStatus,
            total: totalVehicles,
            available: availableVehicles,
            rented: rentedVehicles,
            maintenance: maintenanceVehicles,
          },
        };
      })
    );

    return res.json({
      data: brandsWithAvailability,
      stationId: stationId,
    });
  } catch (error) {
    return next(error);
  }
};

export const getBrandVehicleCount = async (req, res, next) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findById(id).lean();

    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    const totalVehicles = await Vehicle.countDocuments({ brand: id });

    const { _id: brandId, name, description, baseDailyRate, depositAmount, imageUrl } = brand;

    return res.json({
      data: {
        brand: {
          id: brandId.toString(),
          name,
          description,
          baseDailyRate,
          depositAmount,
          imageUrl,
        },
        totalVehicles,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export default {
  listBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
  getBrandVehicleCount,
  getBrandsByStation,
};
