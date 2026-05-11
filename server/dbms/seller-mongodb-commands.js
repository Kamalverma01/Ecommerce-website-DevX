db.createCollection("sellers", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "businessName", "phone", "address", "status"],
      properties: {
        userId: {
          bsonType: "objectId"
        },
        businessName: {
          bsonType: "string"
        },
        phone: {
          bsonType: "string"
        },
        address: {
          bsonType: "string"
        },
        businessType: {
          bsonType: "string"
        },
        supportEmail: {
          bsonType: "string"
        },
        gstNumber: {
          bsonType: "string"
        },
        pickupPincode: {
          bsonType: "string"
        },
        productCategories: {
          bsonType: "array",
          items: {
            bsonType: "string"
          }
        },
        status: {
          enum: ["pending", "approved", "rejected"]
        },
        commissionOverride: {
          bsonType: ["double", "int", "decimal", "null"]
        },
        approvedAt: {
          bsonType: ["date", "null"]
        },
        rejectedAt: {
          bsonType: ["date", "null"]
        },
        notes: {
          bsonType: "string"
        }
      }
    }
  }
});

db.sellers.createIndex({ userId: 1 }, { unique: true });
db.sellers.createIndex({ status: 1 });
