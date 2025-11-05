import Booking from "../models/booking.model.js";
import { BOOKING_STATUS } from "../constants/statusCodes.js";

const DEFAULT_BOOKINGS = [
  {
    key: "alice-early-june",
    renterEmail: "alice.nguyen@example.com",
    pickupStationCode: "station-hcm-01",
    vehicleVin: "EVR-2024-0001",
    brandCode: "TESLA-M3",
    pickupTimeExpected: new Date("2024-06-01T08:00:00.000Z"),
    status: BOOKING_STATUS.SUCCESS,
    rentalDays: 3,
    surchargeAmount: 50000,
  },
  {
    key: "alice-july-hold",
    renterEmail: "alice.nguyen@example.com",
    pickupStationCode: "station-hn-01",
    vehicleVin: null,
    brandCode: "NISSAN-LEAF",
    pickupTimeExpected: new Date("2024-07-10T09:00:00.000Z"),
    status: BOOKING_STATUS.PENDING_APPROVAL,
    rentalDays: 2,
  },
  {
    key: "alice-august-getaway",
    renterEmail: "alice.nguyen@example.com",
    pickupStationCode: "station-hcm-01",
    vehicleVin: "EVR-2024-0005",
    brandCode: "KIA-EV6",
    pickupTimeExpected: new Date("2024-08-05T02:00:00.000Z"),
    status: BOOKING_STATUS.SUCCESS,
    rentalDays: 5,
  },
  {
    key: "minh-danang-weekend",
    renterEmail: "minh.pham@example.com",
    pickupStationCode: "station-dn-01",
    vehicleVin: "EVR-2024-0003",
    brandCode: "VINFAST-VF-E34",
    pickupTimeExpected: new Date("2024-08-17T02:30:00.000Z"),
    status: BOOKING_STATUS.SUCCESS,
    rentalDays: 4,
    surchargeAmount: 30000,
  },
  {
    key: "linh-vf3-hanoi",
    renterEmail: "linh.vu@example.com",
    pickupStationCode: "station-hn-01",
    vehicleVin: "EVR-2024-0006",
    brandCode: "VINFAST-VF3",
    pickupTimeExpected: new Date("2025-10-20T03:00:00.000Z"),
    status: BOOKING_STATUS.PENDING_APPROVAL,
    rentalDays: 3,
  },
];

export const seedBookings = async ({ userMap, stationMap, vehicleMap, brandMap }) => {
  const bookingMap = new Map();

  for (const booking of DEFAULT_BOOKINGS) {
    const renter = userMap.get(booking.renterEmail);
    const pickupStation = stationMap.get(booking.pickupStationCode);
    const brand = brandMap?.get(booking.brandCode);

    if (!renter || !pickupStation || !brand) {
      continue;
    }

    const baseAmount = Math.round((brand.baseDailyRate ?? 0) * (booking.rentalDays ?? 1));
    const depositAmount = Math.round(brand.depositAmount ?? 0);
    const surchargeAmount = booking.surchargeAmount ?? 0;

    const payload = {
      renter: renter._id,
      pickupStation: pickupStation._id,
      vehicle: booking.vehicleVin
        ? vehicleMap.get(booking.vehicleVin)?._id ?? null
        : null,
      pickupTimeExpected: booking.pickupTimeExpected,
      status: booking.status,
      rentalDays: booking.rentalDays ?? 1,
      brand: brand._id,
      baseAmount,
      depositAmount,
      surchargeAmount,
      totalAmount: baseAmount + depositAmount + surchargeAmount,
    };

    let doc = await Booking.findOneAndUpdate(
      {
        renter: renter._id,
        pickupTimeExpected: booking.pickupTimeExpected,
      },
      payload,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    doc = await doc.populate(["renter", "pickupStation", "vehicle"]);
    bookingMap.set(booking.key, doc);
  }

  const count = await Booking.estimatedDocumentCount();
  console.log(`Booking seed complete. Total bookings: ${count}`);

  return bookingMap;
};

export default seedBookings;
