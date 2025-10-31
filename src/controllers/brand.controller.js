import Brand from "../models/brand.model.js";
import Vehicle from "../models/vehicle.model.js";
import { createCrudHandlers } from "../utils/crudFactory.js";

const { list, get, create, update, remove } = createCrudHandlers(Brand, {
  defaultSort: { name: 1 },
});

export const listBrands = list;
export const getBrand = get;
export const createBrand = create;
export const updateBrand = update;
export const deleteBrand = remove;

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

export const getBrandsByStation = async (req, res, next) => {
  try {
    const { stationId } = req.query;

    if (!stationId) {
      return res.status(400).json({
        message: "stationId query parameter is required"
      });
    }

    // Lấy tất cả brands
    const brands = await Brand.find().sort({ name: 1 }).lean();

    // Tính toán availability cho từng brand
    const brandsWithAvailability = await Promise.all(
      brands.map(async (brand) => {
        // Đếm tổng số xe của brand tại station
        const totalVehicles = await Vehicle.countDocuments({
          brand: brand._id,
          stationId: stationId,
        });

        // Đếm số xe available
        const availableVehicles = await Vehicle.countDocuments({
          brand: brand._id,
          stationId: stationId,
          status: "available",
        });

        // Đếm số xe đang được thuê
        const rentedVehicles = await Vehicle.countDocuments({
          brand: brand._id,
          stationId: stationId,
          status: "rented",
        });

        // Đếm số xe đang bảo trì
        const maintenanceVehicles = await Vehicle.countDocuments({
          brand: brand._id,
          stationId: stationId,
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

export default {
  listBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
  getBrandVehicleCount,
  getBrandsByStation,
};
