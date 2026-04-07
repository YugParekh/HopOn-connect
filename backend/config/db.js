const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI, {
  ssl: true,
  tls: true,
  tlsAllowInvalidCertificates: false,
  serverSelectionTimeoutMS: 5000,
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));