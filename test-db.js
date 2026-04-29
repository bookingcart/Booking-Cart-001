require('dotenv').config();
const { getCollections } = require('./lib/mongo');

async function test() {
  try {
    const collections = await getCollections();
    console.log("Connected to collections:", Object.keys(collections));
    
    // 1. Test saving a booking
    const bookingRes = await collections.bookings.updateOne(
      { ref: 'TEST-123' },
      { $set: { status: 'new', test: true } },
      { upsert: true }
    );
    console.log("Saved booking:", bookingRes.acknowledged);

    // 2. Test saving a profile edit
    const userRes = await collections.users.updateOne(
      { 'profile.email': 'test@example.com' },
      { $set: { 'profile.email': 'test@example.com', state: { savedFlights: ['flight1'] }, updatedAt: new Date() } },
      { upsert: true }
    );
    console.log("Saved profile & saved flights:", userRes.acknowledged);

    console.log("All DB saves successful!");
    process.exit(0);
  } catch (err) {
    console.error("DB Test failed:", err);
    process.exit(1);
  }
}
test();
