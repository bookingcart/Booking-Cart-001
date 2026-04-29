require('dotenv').config();
const { getCollections } = require('./lib/mongo');
const bookingsHandler = require('./api/bookings');
const userHandler = require('./api/user');

// Monkeypatch auth verification
const googleVerify = require('./lib/google-verify');
googleVerify.verifyRequestBearer = async () => ({ ok: true, email: 'test@example.com' });

const resMock = {
  status: function(s) { this.statusCode = s; return this; },
  setHeader: function() {},
  json: function(data) { this.data = data; return this; },
  end: function() { return this; }
};

async function test() {
  console.log("--- Testing Full Logic with Auth Bypass ---");
  
  // 1. Profile Save
  const reqProfile = {
    method: 'POST',
    body: { email: 'test@example.com', state: { name: 'Test User', savedFlights: ['flight_abc'] } }
  };
  await userHandler(reqProfile, resMock);
  console.log("Profile Save Result:", resMock.data);

  // 2. Profile Load
  const reqLoad = {
    method: 'GET',
    query: { email: 'test@example.com' }
  };
  await userHandler(reqLoad, resMock);
  console.log("Profile Load Result:", resMock.data);

  if (resMock.data.state && resMock.data.state.name === 'Test User') {
    console.log("Profile Persistence confirmed.");
  } else {
    console.log("Profile Persistence FAILED.");
  }
}

test();
