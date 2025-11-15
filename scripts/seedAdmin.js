require("dotenv").config();
const connectDB = require("../config/db");
const User = require("../models/User");

const run = async () => {
  await connectDB();
  const exists = await User.findOne({ email: "admin@sol.com" });
  if (exists) {
    console.log("admin exists");
    return process.exit(0);
  }
  const u = new User({ name: "Admin", email: "admin@sol.com", password: "Admin@12345", role: "admin" });
  await u.save();
  console.log("admin created:", u.email);
  process.exit(0);
};

run().catch(err => { console.error(err); process.exit(1); });
