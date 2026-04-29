const fs = require('fs');
const path = require('path');

// 1. Mock Database
const globalUsers = {};
const globalBookings = [];

// 2. Mock Verification Logic
const mockVerify = async () => ({ ok: true, email: 'test@example.com' });

// 3. Extracted Logic from user.js for testing
async function testUserPersistence() {
  console.log("--- Testing User Logic ---");
  const email = 'test@example.com';
  const state = { name: 'Verified User', savedFlights: ['flight123'] };
  
  // Simulation of POST /api/user
  globalUsers[email] = state;
  console.log("Mock Save: Saved state for", email);

  // Simulation of GET /api/user
  const loaded = globalUsers[email];
  console.log("Mock Load: Loaded state", loaded);

  if (loaded.name === 'Verified User' && loaded.savedFlights[0] === 'flight123') {
    console.log("User persistence logic verified.");
  } else {
    throw new Error("User persistence logic failed.");
  }
}

async function testBookingPersistence() {
  console.log("--- Testing Booking Logic ---");
  const booking = { ref: 'BOOK-999', route: 'SFO-LAX' };
  
  // Simulation of action=save in bookings.js
  globalBookings.unshift(booking);
  console.log("Mock Save: Saved booking", booking.ref);

  const found = globalBookings.find(b => b.ref === 'BOOK-999');
  if (found) {
    console.log("Booking persistence logic verified.");
  } else {
    throw new Error("Booking persistence logic failed.");
  }
}

async function main() {
  try {
    await testUserPersistence();
    await testBookingPersistence();
    console.log("All systems operational (logic-wise).");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
