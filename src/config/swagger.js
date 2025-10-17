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
              description: "Reference to the owning user. Responses may include a populated user document.",
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
              description: "Staff member that verified the document. Responses may include a populated user document.",
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
          required: [
            "_id",
            "code",
            "name",
            "status",
            "createdAt",
            "updatedAt",
          ],
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
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: [
            "_id",
            "model",
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
          },
          required: ["model"],
        },
        Booking: {
          type: "object",
          properties: {
            _id: { type: "string" },
            renter: {
              description: "Renter reference. Responses populate the full user object.",
              oneOf: [
                { type: "string" },
                { $ref: "#/components/schemas/User" },
              ],
            },
            pickupStation: {
              description: "Pickup station reference. Responses populate the full station object.",
              oneOf: [
                { type: "string" },
                { $ref: "#/components/schemas/Station" },
              ],
            },
            vehicle: {
              description: "Assigned vehicle reference (optional). Responses populate the full vehicle object when available.",
              oneOf: [
                { type: "string", nullable: true },
                { $ref: "#/components/schemas/Vehicle" },
              ],
            },
            pickupTimeExpected: { type: "string", format: "date-time" },
            rentalDays: { type: "integer", minimum: 1 },
            status: {
              type: "string",
              enum: ["pending", "confirmed", "cancelled", "expired"],
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: [
            "_id",
            "renter",
            "pickupStation",
            "pickupTimeExpected",
            "status",
            "createdAt",
            "updatedAt",
          ],
        },
        BookingInput: {
          type: "object",
          properties: {
            renter: { type: "string" },
            pickupStation: { type: "string" },
            vehicle: { type: "string" },
            pickupTimeExpected: { type: "string", format: "date-time" },
            rentalDays: { type: "integer", minimum: 1 },
            status: {
              type: "string",
              enum: ["pending", "confirmed", "cancelled", "expired"],
            },
          },
          required: ["renter", "pickupStation", "pickupTimeExpected"],
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
            rental: {
              oneOf: [
                { type: "string" },
                { $ref: "#/components/schemas/Rental" },
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
            surchargeAmount: { type: "number" },
            totalAmount: { type: "number" },
            txnRef: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: [
            "_id",
            "rental",
            "method",
            "status",
            "baseAmount",
            "surchargeAmount",
            "totalAmount",
            "createdAt",
            "updatedAt",
          ],
        },
        PaymentInput: {
          type: "object",
          properties: {
            rental: { type: "string" },
            method: {
              type: "string",
              enum: ["cash", "card", "wallet", "transfer"],
            },
            status: {
              type: "string",
              enum: ["pending", "paid", "failed", "refunded"],
            },
            baseAmount: { type: "number", minimum: 0 },
            surchargeAmount: { type: "number", minimum: 0 },
            totalAmount: { type: "number", minimum: 0 },
            txnRef: { type: "string" },
          },
          required: ["rental", "method", "baseAmount", "totalAmount"],
        },
      },
    },
    paths: {
      "/": {
        get: {
          tags: ["Health"],
          summary: "API root",
          description: "Returns a simple message so uptime checks can verify the API is reachable.",
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
      "/api/booking": {
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
      "/api/booking/{id}": {
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
