const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (error) {
    throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT JSON");
  }
} else {
  const serviceAccountPath = path.join(__dirname, "../serviceAccountKey.json");
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(
      "Firebase credentials not found. Set FIREBASE_SERVICE_ACCOUNT env var in production, or add backend/serviceAccountKey.json for local development."
    );
  }
  serviceAccount = require(serviceAccountPath);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
