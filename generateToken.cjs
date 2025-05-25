// generateToken.cjs

// 1) Load .env into process.env
require('dotenv').config();

// 2) Import jsonwebtoken
const jwt = require('jsonwebtoken');

// 3) Pick a user ID that exists in your users collection
//    (replace with any valid ObjectId string)
const userId = '650000000000000000000001';

// 4) Grab the secret from .env
const secret = process.env.JWT_SECRET;

// 5) Fail fast if no secret
if (!secret) {
  console.error(' error: JWT_SECRET not defined in .env');
  process.exit(1);
}

// 6) Create a token payload and sign it
const token = jwt.sign(
  { id: userId },    // payload
  secret,            // secret key
  { expiresIn: '1h' }// options
);

// 7) Output the token
console.log('\n Your test JWT:\n');
console.log(token);
console.log('\nUse this in your Authorization header:\n');
console.log(`Authorization: Bearer ${token}\n`);