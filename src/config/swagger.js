export const createSwaggerSpec = ({ serverUrl } = {}) => {
  const resolvedServerUrl =
    serverUrl && serverUrl.trim().length > 0
      ? serverUrl
      : "http://localhost:4000";

  return {
    openapi: "3.1.0",
    info: {
      title: "EV Rental System API",
      description:
        "Interactive documentation for the EV Rental System backend. The collection exposes CRUD endpoints for core domain resources such as vehicles, stations, bookings, rentals, and payments.",
      version: "1.0.0",
      contact: {
        name: "EV Rental System",
        url: "https://github.com/baole405/ev-rental-system-backend",
      },
    },
    servers: [
      {
        url: resolvedServerUrl,
        description: "Primary API server",
      },
    ],
    tags: [
      {
        name: "Health",
        description: "Basic uptime check endpoints.",
      },
      {
        name: "Auth",
        description: "User authentication endpoints (login & register).",
      },
      {
        name: "Users",
        description: "Manage renter, staff, and admin accounts.",
      },
      {
        name: "User Documents",
        description: "Upload and verify renter identification documents.",
      },
      {
        name: "Stations",
        description: "EV charging or pickup station catalog.",
      },
      {
        name: "Vehicles",
        description: "Electric vehicles available for rental.",
      },
      {
        name: "Brands",
        description: "Vehicle brands and pricing profiles.",
      },
      {
        name: "Bookings",
        description: "Reservations placed by renters before pickup.",
      },
      {
        name: "Rentals",
        description: "Active and historical vehicle rentals.",
      },
      {
        name: "Handovers",
        description: "Pickup and return inspection records.",
      },
      {
        name: "Payments",
        description: "Rental payment transactions.",
      },
    ],
    components: {
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Human readable error message.",
            },
          },
          required: ["message"],
        },
        AuthLoginRequest: {
          type: "object",
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 1 },
          },
          required: ["email", "password"],
        },
        AuthRegisterRequest: {
          type: "object",
          properties: {
            fullName: { type: "string" },
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 1 },
            phone: { type: "string", nullable: true },
            role: {
              type: "string",
              enum: ["renter", "staff", "admin"],
              description:
                "Optional role override. Defaults to renter if omitted.",
            },
          },
          required: ["fullName", "email", "password"],
        },
        AuthResponse: {
          type: "object",
          properties: {
            token: { type: "string", description: "JWT access token." },
            user: { $ref: "#/components/schemas/User" },
          },
          required: ["token", "user"],
        },
        User: {
          type: "object",
          properties: {
            _id: { type: "string", description: "Unique identifier." },
            fullName: { type: "string" },
            email: { type: "string", format: "email" },
            phone: { type: "string", nullable: true },
            passwordHash: {
              type: "string",
              description: "BCrypt hash stored for authentication.",
            },
            role: {
              type: "string",
              enum: ["renter", "staff", "admin"],
            },
            status: {
              type: "string",
              enum: ["active", "inactive", "suspended"],
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: [
            "_id",
            "fullName",
            "email",
            "passwordHash",
            "role",
            "status",
            "createdAt",
            "updatedAt",
          ],
        },
        UserInput: {
          type: "object",
          properties: {
            fullName: { type: "string" },
            email: { type: "string", format: "email" },
            phone: { type: "string" },
            passwordHash: {
              type: "string",
              description: "BCrypt hash that will be persisted.",
            },
            role: {
              type: "string",
              enum: ["renter", "staff", "admin"],
            },
            status: {
              type: "string",
              enum: ["active", "inactive", "suspended"],
            },
          },
          required: ["fullName", "email", "passwordHash", "role"],
        },
        UserDocument: {
          type: "object",
          properties: {
            _id: { type: "string" },
            user: {
              description:
                "Reference to the owning user. Responses may include a populated user document.",
              oneOf: [
                { type: "string" },
                { $ref: "#/components/schemas/User" },
              ],
            },
            docType: { type: "string" },
            docNumber: { type: "string", nullable: true },
            docImageUrl: { type: "string", nullable: true },
            verifyStatus: {
              type: "string",
              enum: ["pending", "approved", "rejected"],
            },
            uploadedAt: { type: "string", format: "date-time" },
            verifiedAt: { type: "string", format: "date-time", nullable: true },
            verifiedBy: {
              description:
                "Staff member that verified the document. Responses may include a populated user document.",
              oneOf: [
                { type: "string", nullable: true },
                { $ref: "#/components/schemas/User" },
              ],
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: [
            "_id",
            "user",
            "docType",
            "verifyStatus",
            "uploadedAt",
            "createdAt",
            "updatedAt",
          ],
        },
        UserDocumentInput: {
          type: "object",
          properties: {
            user: { type: "string" },
            docType: { type: "string" },
            docNumber: { type: "string" },
            docImageUrl: { type: "string" },
            verifyStatus: {
              type: "string",
              enum: ["pending", "approved", "rejected"],
            },
            uploadedAt: { type: "string", format: "date-time" },
            verifiedAt: { type: "string", format: "date-time" },
            verifiedBy: { type: "string" },
          },
          required: ["user", "docType"],
        },
        Station: {
          type: "object",
          properties: {
            _id: { type: "string" },
            code: { type: "string" },
            name: { type: "string" },
            address: { type: "string", nullable: true },
            lat: { type: "number", nullable: true },
            lng: { type: "number", nullable: true },
            openHours: { type: "string", nullable: true },
            status: {
              type: "string",
              enum: ["active", "maintenance", "closed"],
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: ["_id", "code", "name", "status", "createdAt", "updatedAt"],
        },
        StationInput: {
          type: "object",
          properties: {
            code: { type: "string" },
            name: { type: "string" },
            address: { type: "string" },
            lat: { type: "number" },
            lng: { type: "number" },
            openHours: { type: "string" },
            status: {
              type: "string",
              enum: ["active", "maintenance", "closed"],
            },
          },
          required: ["code", "name"],
        },
        Brand: {
          type: "object",
          properties: {
            _id: { type: "string" },
            code: { type: "string" },
            name: { type: "string" },
            description: { type: "string", nullable: true },
            baseDailyRate: { type: "number", minimum: 0 },
            depositAmount: { type: "number", minimum: 0 },
            imageUrl: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: [
            "_id",
            "code",
            "name",
            "baseDailyRate",
            "depositAmount",
            "createdAt",
            "updatedAt",
          ],
        },
        BrandInput: {
          type: "object",
          properties: {
            code: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            baseDailyRate: { type: "number", minimum: 0 },
            depositAmount: { type: "number", minimum: 0 },
            imageUrl: { type: "string" },
          },
          required: ["code", "name", "baseDailyRate"],
        },
        Vehicle: {
          type: "object",
          properties: {
            _id: { type: "string" },
            stationId: { type: "string", nullable: true },
            vin: { type: "string", nullable: true },
            model: { type: "string" },
            plateNo: { type: "string", nullable: true },
            batteryPercent: { type: "number" },
            status: {
              type: "string",
              enum: ["available", "maintenance", "rented", "unavailable"],
            },
            odometer: { type: "number" },
            brand: {
              description: "Brand profile associated with the vehicle.",
              oneOf: [
                { type: "string" },
                { $ref: "#/components/schemas/Brand" },
              ],
            },
            specifications: {
              type: "object",
              nullable: true,
              properties: {
                seatCount: {
                  type: "integer",
                  minimum: 1,
                  maximum: 20,
                  nullable: true,
                },
                transmissionType: {
                  type: "string",
                  nullable: true,
                  enum: [
                    "automatic",
                    "manual",
                    "cvt",
                    "dual-clutch",
                    "semi-automatic",
                    "single-speed",
                    "other",
                  ],
                },
                airbagCount: {
                  type: "integer",
                  minimum: 0,
                  maximum: 20,
                  nullable: true,
                },
                horsepower: {
                  type: "number",
                  minimum: 0,
                  maximum: 2000,
                  nullable: true,
                },
                motorType: { type: "string", nullable: true },
                motorSupplier: { type: "string", nullable: true },
                batteryCapacityKWh: {
                  type: "number",
                  minimum: 0,
                  maximum: 500,
                  nullable: true,
                },
              },
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: [
            "_id",
            "model",
            "brand",
            "batteryPercent",
            "status",
            "odometer",
            "createdAt",
            "updatedAt",
          ],
        },
        VehicleInput: {
          type: "object",
          properties: {
            stationId: { type: "string" },
            vin: { type: "string" },
            model: { type: "string" },
            plateNo: { type: "string" },
            batteryPercent: { type: "number", minimum: 0, maximum: 100 },
            status: {
              type: "string",
              enum: ["available", "maintenance", "rented", "unavailable"],
            },
            odometer: { type: "number", minimum: 0 },
            brand: { type: "string" },
            specifications: {
              type: "object",
              properties: {
                seatCount: { type: "integer", minimum: 1, maximum: 20 },
                transmissionType: {
                  type: "string",
                  enum: [
                    "automatic",
                    "manual",
                    "cvt",
                    "dual-clutch",
                    "semi-automatic",
                    "single-speed",
                    "other",
                  ],
                },
                airbagCount: { type: "integer", minimum: 0, maximum: 20 },
                horsepower: { type: "number", minimum: 0, maximum: 2000 },
                motorType: { type: "string" },
                motorSupplier: { type: "string" },
                batteryCapacityKWh: {
                  type: "number",
                  minimum: 0,
                  maximum: 500,
                },
              },
            },
          },
          required: ["model", "brand"],
        },
        Booking: {
          type: "object",
          properties: {
            _id: { type: "string" },
            renter: {
              description:
                "Renter reference. Responses populate the full user object.",
              oneOf: [
                { type: "string" },
                { $ref: "#/components/schemas/User" },
              ],
            },
            brand: {
              description: "Selected brand (vehicle model) for the booking.",
              oneOf: [
                { type: "string" },
                { $ref: "#/components/schemas/Brand" },
              ],
            },
            pickupStation: {
              description:
                "Pickup station reference. Responses populate the full station object.",
              oneOf: [
                { type: "string" },
                { $ref: "#/components/schemas/Station" },
              ],
            },
            vehicle: {
              description:
                "Assigned vehicle reference (optional). Responses populate the full vehicle object when available.",
              oneOf: [
                { type: "string", nullable: true },
                { $ref: "#/components/schemas/Vehicle" },
              ],
            },
            pickupTimeExpected: { type: "string", format: "date-time" },
            rentalDays: { type: "integer", minimum: 1 },
            baseAmount: { type: "number", minimum: 0 },
            depositAmount: { type: "number", minimum: 0 },
            surchargeAmount: { type: "number", minimum: 0 },
            totalAmount: { type: "number", minimum: 0 },
            status: {
              type: "string",
              enum: ["pending", "confirmed", "cancelled", "expired"],
            },
            pricing: {
              description: "Denormalized pricing breakdown for convenience.",
              $ref: "#/components/schemas/BookingPricing",
            },
            availability: {
              description:
                "Availability summary for the requested brand at the pickup station.",
              $ref: "#/components/schemas/BookingAvailability",
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: [
            "_id",
            "renter",
            "brand",
            "pickupStation",
            "pickupTimeExpected",
            "rentalDays",
            "baseAmount",
            "depositAmount",
            "surchargeAmount",
            "totalAmount",
            "status",
            "createdAt",
            "updatedAt",
          ],
        },
        BookingInput: {
          type: "object",
          properties: {
            // Thông tin khách hàng (required)
            renterName: {
              type: "string",
              description: "Tên người thuê"
            },
            phoneNumber: {
              type: "string",
              pattern: "^0[0-9]{9}$",
              description: "Số điện thoại (10 số bắt đầu bằng 0)"
            },
            email: {
              type: "string",
              format: "email",
              description: "Email người thuê"
            },
            // Thông tin booking (required)
            brand: {
              type: "string",
              description: "Brand ObjectId"
            },
            pickupStation: {
              type: "string",
              description: "Station code hoặc ObjectId"
            },
            pickupTimeExpected: {
              type: "string",
              format: "date-time",
              description: "Thời gian nhận xe dự kiến"
            },
            rentalDays: {
              type: "integer",
              minimum: 1,
              description: "Số ngày thuê"
            },
            paymentMethod: {
              type: "string",
              enum: ["online", "cash", "bank_transfer", "credit_card", "e_wallet"],
              description: "Phương thức thanh toán"
            },
            agreedToPaymentTerms: {
              type: "boolean",
              description: "Đồng ý điều khoản thanh toán (phải true)"
            },
            agreedToDataSharing: {
              type: "boolean",
              description: "Đồng ý chia sẻ dữ liệu (phải true)"
            },
            // Optional fields
            renter: {
              type: "string",
              nullable: true,
              description: "User ObjectId (nếu đã đăng nhập)"
            },
            vehicle: {
              type: "string",
              nullable: true,
              description: "Vehicle ObjectId (optional, để staff assign sau)"
            },
            surchargeAmount: {
              type: "number",
              minimum: 0,
              default: 0,
              description: "Phụ phí thêm"
            },
            status: {
              type: "string",
              enum: ["pending", "confirmed", "paid", "completed", "cancelled", "expired"],
              default: "pending",
              description: "Trạng thái booking"
            },
            notes: {
              type: "string",
              nullable: true,
              description: "Ghi chú"
            }
          },
          required: [
            "renterName",
            "phoneNumber",
            "email",
            "brand",
            "pickupStation",
            "pickupTimeExpected",
            "rentalDays",
            "paymentMethod",
            "agreedToPaymentTerms",
            "agreedToDataSharing"
          ],
        },
        BookingPricing: {
          type: "object",
          properties: {
            baseAmount: { type: "number", minimum: 0 },
            depositAmount: { type: "number", minimum: 0 },
            surchargeAmount: { type: "number", minimum: 0 },
            totalAmount: { type: "number", minimum: 0 },
          },
          required: [
            "baseAmount",
            "depositAmount",
            "surchargeAmount",
            "totalAmount",
          ],
        },
        BookingAvailability: {
          type: "object",
          properties: {
            stationCode: { type: "string", nullable: true },
            availableVehicleCount: { type: "integer", minimum: 0 },
            isAvailable: { type: "boolean" },
            fallbackVehicles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  _id: { type: "string" },
                  vin: { type: "string" },
                  model: { type: "string" },
                  stationId: { type: "string", nullable: true },
                  status: { type: "string" },
                },
              },
            },
          },
          required: ["availableVehicleCount", "isAvailable"],
        },
        Rental: {
          type: "object",
          properties: {
            _id: { type: "string" },
            booking: {
              description: "Booking reference used to create the rental.",
              oneOf: [
                { type: "string", nullable: true },
                { $ref: "#/components/schemas/Booking" },
              ],
            },
            renter: {
              oneOf: [
                { type: "string" },
                { $ref: "#/components/schemas/User" },
              ],
            },
            vehicle: {
              oneOf: [
                { type: "string" },
                { $ref: "#/components/schemas/Vehicle" },
              ],
            },
            pickupStation: {
              oneOf: [
                { type: "string" },
                { $ref: "#/components/schemas/Station" },
              ],
            },
            returnStation: {
              oneOf: [
                { type: "string", nullable: true },
                { $ref: "#/components/schemas/Station" },
              ],
            },
            pickupTime: { type: "string", format: "date-time" },
            returnTime: { type: "string", format: "date-time", nullable: true },
            odoStart: { type: "number", nullable: true },
            odoEnd: { type: "number", nullable: true },
            conditionNotes: { type: "string", nullable: true },
            baseAmount: { type: "number", minimum: 0 },
            depositAmount: { type: "number", minimum: 0 },
            surchargeAmount: { type: "number", minimum: 0 },
            totalAmount: { type: "number", minimum: 0 },
            paidAmount: { type: "number", minimum: 0 },
            extraCharges: { type: "number", minimum: 0 },
            extraChargeNotes: { type: "string", nullable: true },
            lateDays: { type: "integer", minimum: 0 },
            lateFeeAmount: { type: "number", minimum: 0 },
            amountDue: { type: "number", minimum: 0 },
            refundAmount: { type: "number", minimum: 0 },
            status: {
              type: "string",
              enum: ["ongoing", "completed", "cancelled", "overdue"],
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: [
            "_id",
            "renter",
            "vehicle",
            "pickupStation",
            "pickupTime",
            "baseAmount",
            "depositAmount",
            "surchargeAmount",
            "totalAmount",
            "status",
            "createdAt",
            "updatedAt",
          ],
        },
        RentalInput: {
          type: "object",
          properties: {
            booking: { type: "string" },
            renter: { type: "string" },
            vehicle: { type: "string" },
            pickupStation: { type: "string" },
            returnStation: { type: "string" },
            pickupTime: { type: "string", format: "date-time" },
            returnTime: { type: "string", format: "date-time" },
            odoStart: { type: "number" },
            odoEnd: { type: "number" },
            conditionNotes: { type: "string" },
            status: {
              type: "string",
              enum: ["ongoing", "completed", "cancelled", "overdue"],
            },
          },
          required: ["renter", "vehicle", "pickupStation", "pickupTime"],
        },
        Handover: {
          type: "object",
          properties: {
            _id: { type: "string" },
            rental: {
              oneOf: [
                { type: "string" },
                { $ref: "#/components/schemas/Rental" },
              ],
            },
            vehicle: {
              oneOf: [
                { type: "string" },
                { $ref: "#/components/schemas/Vehicle" },
              ],
            },
            staff: {
              oneOf: [
                { type: "string" },
                { $ref: "#/components/schemas/User" },
              ],
            },
            action: {
              type: "string",
              enum: ["pickup", "return", "inspection"],
            },
            notes: { type: "string", nullable: true },
            photosUrl: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: [
            "_id",
            "rental",
            "vehicle",
            "staff",
            "action",
            "createdAt",
            "updatedAt",
          ],
        },
        HandoverInput: {
          type: "object",
          properties: {
            rental: { type: "string" },
            vehicle: { type: "string" },
            staff: { type: "string" },
            action: {
              type: "string",
              enum: ["pickup", "return", "inspection"],
            },
            notes: { type: "string" },
            photosUrl: { type: "string" },
          },
          required: ["rental", "vehicle", "staff", "action"],
        },
        Payment: {
          type: "object",
          properties: {
            _id: { type: "string" },
            booking: {
              oneOf: [
                { type: "string" },
                { $ref: "#/components/schemas/Booking" },
              ],
            },
            rental: {
              oneOf: [
                { type: "string", nullable: true },
                { $ref: "#/components/schemas/Rental" },
              ],
            },
            processedBy: {
              description: "Staff member who processed the payment.",
              oneOf: [
                { type: "string", nullable: true },
                { $ref: "#/components/schemas/User" },
              ],
            },
            method: {
              type: "string",
              enum: ["cash", "card", "wallet", "transfer"],
            },
            status: {
              type: "string",
              enum: ["pending", "paid", "failed", "refunded"],
            },
            baseAmount: { type: "number" },
            depositAmount: { type: "number" },
            surchargeAmount: { type: "number" },
            totalAmount: { type: "number" },
            pricing: {
              description:
                "Convenience pricing summary duplicated from base/surcharge/total fields.",
              $ref: "#/components/schemas/BookingPricing",
            },
            txnRef: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: [
            "_id",
            "booking",
            "method",
            "status",
            "baseAmount",
            "depositAmount",
            "surchargeAmount",
            "totalAmount",
            "createdAt",
            "updatedAt",
          ],
        },
        PaymentInput: {
          type: "object",
          properties: {
            booking: { type: "string" },
            rental: { type: "string" },
            processedBy: { type: "string" },
            method: {
              type: "string",
              enum: ["cash", "card", "wallet", "transfer"],
            },
            status: {
              type: "string",
              enum: ["pending", "paid", "failed", "refunded"],
            },
            surchargeAmount: { type: "number", minimum: 0 },
            txnRef: { type: "string" },
          },
          required: ["booking", "method"],
        },
      },
    },
    paths: {
      "/": {
        get: {
          tags: ["Health"],
          summary: "API root",
          description:
            "Returns a simple message so uptime checks can verify the API is reachable.",
          responses: {
            200: {
              description: "Root response",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                    },
                    required: ["message"],
                  },
                },
              },
            },
          },
        },
      },
      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "User login",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthLoginRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Authenticated user and JWT token",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/AuthResponse" },
                    },
                    required: ["data"],
                  },
                },
              },
            },
            400: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            401: {
              description: "Invalid credentials",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a new user account",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthRegisterRequest" },
              },
            },
          },
          responses: {
            201: {
              description: "User registered",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/AuthResponse" },
                    },
                    required: ["data"],
                  },
                },
              },
            },
            400: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            409: {
              description: "User already exists",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/users": {
        get: {
          tags: ["Users"],
          summary: "List users",
          responses: {
            200: {
              description: "Array of users",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/User" },
                      },
                    },
                    required: ["data"],
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Users"],
          summary: "Create user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserInput" },
              },
            },
          },
          responses: {
            201: {
              description: "Created user",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/User" },
                    },
                    required: ["data"],
                  },
                },
              },
            },
            400: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/users/{id}": {
        get: {
          tags: ["Users"],
          summary: "Get user",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "User identifier",
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "User payload",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/User" },
                    },
                    required: ["data"],
                  },
                },
              },
            },
            404: {
              description: "User not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        put: {
          tags: ["Users"],
          summary: "Update user",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "User identifier",
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserInput" },
              },
            },
          },
          responses: {
            200: {
              description: "Updated user",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/User" },
                    },
                    required: ["data"],
                  },
                },
              },
            },
            404: {
              description: "User not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        delete: {
          tags: ["Users"],
          summary: "Delete user",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "User identifier",
              schema: { type: "string" },
            },
          ],
          responses: {
            204: {
              description: "User removed",
            },
            404: {
              description: "User not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/userDocs": {
        get: {
          tags: ["User Documents"],
          summary: "List user documents",
          responses: {
            200: {
              description: "Array of user documents",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/UserDocument" },
                      },
                    },
                    required: ["data"],
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["User Documents"],
          summary: "Create user document",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserDocumentInput" },
              },
            },
          },
          responses: {
            201: {
              description: "Created user document",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/UserDocument" },
                    },
                    required: ["data"],
                  },
                },
              },
            },
            400: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/userDocs/{id}": {
        get: {
          tags: ["User Documents"],
          summary: "Get user document",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Document identifier",
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "User document payload",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/UserDocument" },
                    },
                    required: ["data"],
                  },
                },
              },
            },
            404: {
              description: "Document not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        put: {
          tags: ["User Documents"],
          summary: "Update user document",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Document identifier",
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserDocumentInput" },
              },
            },
          },
          responses: {
            200: {
              description: "Updated user document",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/UserDocument" },
                    },
                    required: ["data"],
                  },
                },
              },
            },
            404: {
              description: "Document not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        delete: {
          tags: ["User Documents"],
          summary: "Delete user document",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Document identifier",
              schema: { type: "string" },
            },
          ],
          responses: {
            204: {
              description: "Document removed",
            },
            404: {
              description: "Document not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/stations": {
        get: {
          tags: ["Stations"],
          summary: "List stations",
          responses: {
            200: {
              description: "Array of stations",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Station" },
                      },
                    },
                    required: ["data"],
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Stations"],
          summary: "Create station",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StationInput" },
              },
            },
          },
          responses: {
            201: {
              description: "Created station",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Station" },
                    },
                    required: ["data"],
                  },
                },
              },
            },
            400: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/stations/{id}": {
        get: {
          tags: ["Stations"],
          summary: "Get station",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Station identifier",
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "Station payload",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Station" },
                    },
                    required: ["data"],
                  },
                },
              },
            },
            404: {
              description: "Station not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        put: {
          tags: ["Stations"],
          summary: "Update station",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Station identifier",
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StationInput" },
              },
            },
          },
          responses: {
            200: {
              description: "Updated station",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Station" },
                    },
                    required: ["data"],
                  },
                },
              },
            },
            404: {
              description: "Station not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        delete: {
          tags: ["Stations"],
          summary: "Delete station",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Station identifier",
              schema: { type: "string" },
            },
          ],
          responses: {
            204: {
              description: "Station removed",
            },
            404: {
              description: "Station not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/brands": {
        get: {
          tags: ["Brands"],
          summary: "List brands",
          responses: {
            200: {
              description: "Array of brands",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Brand" },
                      },
                    },
                    required: ["data"],
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Brands"],
          summary: "Create brand",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BrandInput" },
              },
            },
          },
          responses: {
            201: {
              description: "Created brand",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Brand" },
                    },
                    required: ["data"],
                  },
                },
              },
            },
            400: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/brands/by-station": {
        get: {
          tags: ["Brands"],
          summary: "Get brands by station with availability",
          description:
            "Retrieve all brands with vehicle availability information for a specific station",
          parameters: [
            {
              name: "stationId",
              in: "query",
              required: true,
              description: "Station identifier to filter brands",
              schema: { type: "string" },
              example: "station-hcm-01",
            },
          ],
          responses: {
            200: {
              description: "Brands with availability information",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            _id: { type: "string" },
                            name: { type: "string" },
                            description: { type: "string" },
                            baseDailyRate: { type: "number" },
                            depositAmount: { type: "number" },
                            imageUrl: { type: "string" },
                            availability: {
                              type: "object",
                              properties: {
                                status: {
                                  type: "string",
                                  enum: [
                                    "available",
                                    "out_of_stock",
                                    "no_vehicles",
                                  ],
                                  description:
                                    "Availability status: available (có xe sẵn), out_of_stock (hết xe), no_vehicles (không có xe tại station)",
                                },
                                totalVehicles: {
                                  type: "number",
                                  description:
                                    "Total number of vehicles of this brand at the station",
                                },
                                availableVehicles: {
                                  type: "number",
                                  description: "Number of available vehicles",
                                },
                                rentedVehicles: {
                                  type: "number",
                                  description: "Number of rented vehicles",
                                },
                                maintenanceVehicles: {
                                  type: "number",
                                  description:
                                    "Number of vehicles in maintenance",
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                    required: ["data"],
                  },
                  example: {
                    data: [
                      {
                        _id: "brand123",
                        name: "Tesla",
                        description: "Premium electric vehicles",
                        baseDailyRate: 2000000,
                        depositAmount: 10000000,
                        imageUrl: "https://example.com/tesla.jpg",
                        availability: {
                          status: "available",
                          totalVehicles: 5,
                          availableVehicles: 3,
                          rentedVehicles: 1,
                          maintenanceVehicles: 1,
                        },
                      },
                    ],
                  },
                },
              },
            },
            400: {
              description: "stationId query parameter is required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/brands/{id}": {
        get: {
          tags: ["Brands"],
          summary: "Get brand",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Brand identifier",
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "Brand payload",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Brand" },
                    },
                    required: ["data"],
                  },
                },
              },
            },
            404: {
              description: "Brand not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        put: {
          tags: ["Brands"],
          summary: "Update brand",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Brand identifier",
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BrandInput" },
              },
            },
          },
          responses: {
            200: {
              description: "Updated brand",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Brand" },
                    },
                    required: ["data"],
                  },
                },
              },
            },
            404: {
              description: "Brand not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        delete: {
          tags: ["Brands"],
          summary: "Delete brand",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Brand identifier",
              schema: { type: "string" },
            },
          ],
          responses: {
            204: {
              description: "Brand removed",
            },
            404: {
              description: "Brand not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/brands/{id}/vehicles/count": {
        get: {
          tags: ["Brands"],
          summary: "Get brand with vehicle count",
          description:
            "Get brand information along with total count of vehicles for this brand",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Brand identifier",
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "Brand with vehicle count",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          brand: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              name: { type: "string" },
                              description: { type: "string" },
                              baseDailyRate: { type: "number" },
                              depositAmount: { type: "number" },
                              imageUrl: { type: "string" },
                            },
                          },
                          totalVehicles: {
                            type: "number",
                            description:
                              "Total number of vehicles for this brand",
                          },
                        },
                      },
                    },
                    required: ["data"],
                  },
                  example: {
                    data: {
                      brand: {
                        id: "brand123",
                        name: "Tesla",
                        description: "Premium electric vehicles",
                        baseDailyRate: 2000000,
                        depositAmount: 10000000,
                        imageUrl: "https://example.com/tesla.jpg",
                      },
                      totalVehicles: 12,
                    },
                  },
                },
              },
            },
            404: {
              description: "Brand not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/vehicles": {
        get: {
          tags: ["Vehicles"],
          summary: "List vehicles",
          responses: {
            200: {
              description: "Array of vehicles",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Vehicle" },
                      },
                    },
                    required: ["data"],
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Vehicles"],
          summary: "Create vehicle",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/VehicleInput" },
              },
            },
          },
          responses: {
            201: {
              description: "Created vehicle",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Vehicle" },
                    },
                    required: ["data"],
                  },
                },
              },
            },
            400: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/vehicles/{id}": {
        get: {
          tags: ["Vehicles"],
          summary: "Get vehicle",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Vehicle identifier",
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "Vehicle payload",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Vehicle" },
                    },
                    required: ["data"],
                  },
                },
              },
            },
            404: {
              description: "Vehicle not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        put: {
          tags: ["Vehicles"],
          summary: "Update vehicle",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Vehicle identifier",
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/VehicleInput" },
              },
            },
          },
          responses: {
            200: {
              description: "Updated vehicle",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Vehicle" },
                    },
                    required: ["data"],
                  },
                },
              },
            },
            404: {
              description: "Vehicle not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        delete: {
          tags: ["Vehicles"],
          summary: "Delete vehicle",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Vehicle identifier",
              schema: { type: "string" },
            },
          ],
          responses: {
            204: {
              description: "Vehicle removed",
            },
            404: {
              description: "Vehicle not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/bookings": {
        get: {
          tags: ["Bookings"],
          summary: "List bookings",
          responses: {
            200: {
              description: "Array of bookings",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Booking" },
                      },
                    },
                    required: ["data"],
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Bookings"],
          summary: "Create booking",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BookingInput" },
              },
            },
          },
          responses: {
            201: {
              description: "Created booking",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Booking" },
                    },
                    required: ["data"],
                  },
                },
              },
            },
            400: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/bookings/{id}": {
        get: {
          tags: ["Bookings"],
          summary: "Get booking",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Booking identifier",
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "Booking payload",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Booking" },
                    },
                    required: ["data"],
                  },
                },
              },
            },
            404: {
              description: "Booking not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        put: {
          tags: ["Bookings"],
          summary: "Update booking",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Booking identifier",
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BookingInput" },
              },
            },
          },
          responses: {
            200: {
              description: "Updated booking",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Booking" },
                    },
                    required: ["data"],
                  },
                },
              },
            },
            404: {
              description: "Booking not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        delete: {
          tags: ["Bookings"],
          summary: "Delete booking",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Booking identifier",
              schema: { type: "string" },
            },
          ],
          responses: {
            204: {
              description: "Booking removed",
            },
            404: {
              description: "Booking not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/rentals": {
        get: {
          tags: ["Rentals"],
          summary: "List rentals",
          responses: {
            200: {
              description: "Array of rentals",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Rental" },
                      },
                    },
                    required: ["data"],
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Rentals"],
          summary: "Create rental",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RentalInput" },
              },
            },
          },
          responses: {
            201: {
              description: "Created rental",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Rental" },
                    },
                    required: ["data"],
                  },
                },
              },
            },
            400: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/rentals/{id}": {
        get: {
          tags: ["Rentals"],
          summary: "Get rental",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Rental identifier",
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "Rental payload",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Rental" },
                    },
                    required: ["data"],
                  },
                },
              },
            },
            404: {
              description: "Rental not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        put: {
          tags: ["Rentals"],
          summary: "Update rental",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Rental identifier",
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RentalInput" },
              },
            },
          },
          responses: {
            200: {
              description: "Updated rental",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Rental" },
                    },
                    required: ["data"],
                  },
                },
              },
            },
            404: {
              description: "Rental not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        delete: {
          tags: ["Rentals"],
          summary: "Delete rental",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Rental identifier",
              schema: { type: "string" },
            },
          ],
          responses: {
            204: {
              description: "Rental removed",
            },
            404: {
              description: "Rental not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/handovers": {
        get: {
          tags: ["Handovers"],
          summary: "List handovers",
          responses: {
            200: {
              description: "Array of handovers",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Handover" },
                      },
                    },
                    required: ["data"],
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Handovers"],
          summary: "Create handover",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HandoverInput" },
              },
            },
          },
          responses: {
            201: {
              description: "Created handover",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Handover" },
                    },
                    required: ["data"],
                  },
                },
              },
            },
            400: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/handovers/{id}": {
        get: {
          tags: ["Handovers"],
          summary: "Get handover",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Handover identifier",
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "Handover payload",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Handover" },
                    },
                    required: ["data"],
                  },
                },
              },
            },
            404: {
              description: "Handover not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        put: {
          tags: ["Handovers"],
          summary: "Update handover",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Handover identifier",
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HandoverInput" },
              },
            },
          },
          responses: {
            200: {
              description: "Updated handover",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Handover" },
                    },
                    required: ["data"],
                  },
                },
              },
            },
            404: {
              description: "Handover not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        delete: {
          tags: ["Handovers"],
          summary: "Delete handover",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Handover identifier",
              schema: { type: "string" },
            },
          ],
          responses: {
            204: {
              description: "Handover removed",
            },
            404: {
              description: "Handover not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/payments": {
        get: {
          tags: ["Payments"],
          summary: "List payments",
          responses: {
            200: {
              description: "Array of payments",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Payment" },
                      },
                    },
                    required: ["data"],
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Payments"],
          summary: "Create payment",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PaymentInput" },
              },
            },
          },
          responses: {
            201: {
              description: "Created payment",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Payment" },
                    },
                    required: ["data"],
                  },
                },
              },
            },
            400: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/payments/{id}": {
        get: {
          tags: ["Payments"],
          summary: "Get payment",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Payment identifier",
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "Payment payload",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Payment" },
                    },
                    required: ["data"],
                  },
                },
              },
            },
            404: {
              description: "Payment not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        put: {
          tags: ["Payments"],
          summary: "Update payment",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Payment identifier",
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PaymentInput" },
              },
            },
          },
          responses: {
            200: {
              description: "Updated payment",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Payment" },
                    },
                    required: ["data"],
                  },
                },
              },
            },
            404: {
              description: "Payment not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        delete: {
          tags: ["Payments"],
          summary: "Delete payment",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Payment identifier",
              schema: { type: "string" },
            },
          ],
          responses: {
            204: {
              description: "Payment removed",
            },
            404: {
              description: "Payment not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
    },
  };
};

export const createSwaggerUiHtml = (
  specUrl = "/swagger.json",
  { title = "EV Rental System API" } = {}
) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />
    <style>
      body {
        margin: 0;
        background: #f5f7fa;
      }
      #swagger-ui {
        margin: 0 auto;
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: '${specUrl}',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [SwaggerUIBundle.presets.apis],
          layout: 'BaseLayout',
        });
      };
    </script>
  </body>
</html>`;

export default createSwaggerSpec;
