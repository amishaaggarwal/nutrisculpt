const crypto = require("crypto");

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/generate-admin-hash.js "your-password"');
  process.exit(1);
}
const iterations = 210000;
const salt = crypto.randomBytes(16).toString("base64");
const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("base64");
process.stdout.write(`pbkdf2$${iterations}$${salt}$${hash}\n`);
