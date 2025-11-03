import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Brand from './src/models/brand.model.js';
import Vehicle from './src/models/vehicle.model.js';

dotenv.config();

const testAvailability = async () => {
  try {
    await mongoose.connect(process.env.ATLAS_URI);
    console.log('✅ MongoDB connected\n');

    // Get first station ObjectId
    const station = await mongoose.connection.db.collection('stations').findOne();
    const stationId = station._id;
    
    console.log(`📍 Testing with station: ${station.code} (${stationId})\n`);

    // Get all brands
    const brands = await Brand.find().sort({ name: 1 }).lean();
    
    console.log('🔍 Checking availability for each brand:\n');
    
    for (const brand of brands.slice(0, 5)) { // Test first 5 brands
      const totalVehicles = await Vehicle.countDocuments({
        brand: brand._id,
        stationId: stationId,
      });

      const availableVehicles = await Vehicle.countDocuments({
        brand: brand._id,
        stationId: stationId,
        status: "available",
      });

      const rentedVehicles = await Vehicle.countDocuments({
        brand: brand._id,
        stationId: stationId,
        status: "rented",
      });

      const maintenanceVehicles = await Vehicle.countDocuments({
        brand: brand._id,
        stationId: stationId,
        status: "maintenance",
      });

      let status;
      if (totalVehicles === 0) {
        status = "no_vehicles";
      } else if (availableVehicles === 0) {
        status = "out_of_stock";
      } else {
        status = "available";
      }

      console.log(`${brand.name}:`);
      console.log(`  Status: ${status}`);
      console.log(`  Total: ${totalVehicles} | Available: ${availableVehicles} | Rented: ${rentedVehicles} | Maintenance: ${maintenanceVehicles}`);
      console.log('');
    }

    await mongoose.disconnect();
    console.log('✅ Test complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testAvailability();
