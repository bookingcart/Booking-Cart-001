async function runTest() {
  const email = `test-${Date.now()}@example.com`;
  const password = "Password123!";
  
  console.log("1. Registering user:", email);
  
  const regResp = await fetch("http://localhost:3002/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name: "Test User" })
  });
  
  if (!regResp.ok) {
     const txt = await regResp.text();
     throw new Error("Registration failed: " + txt);
  }
  
  const regData = await regResp.json();
  console.log("Registration successful. Token:", regData.token.substring(0, 20) + "...");
  
  const token = regData.token;
  
  console.log("2. Updating profile via POST /api/user");
  const updateResp = await fetch("http://localhost:3002/api/user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({
      email,
      state: {
        profile: {
          firstName: "Updated",
          lastName: "User",
          email: email
        }
      }
    })
  });
  
  if (!updateResp.ok) {
     const txt = await updateResp.text();
     throw new Error("Profile update failed: " + updateResp.status + " " + txt);
  }
  console.log("Profile update successful!");
  
  console.log("3. Fetching profile via GET /api/user");
  const getResp = await fetch(`http://localhost:3002/api/user?email=${encodeURIComponent(email)}`, {
    headers: {
      "Authorization": "Bearer " + token
    }
  });
  
  if (!getResp.ok) {
     const txt = await getResp.text();
     throw new Error("Profile fetch failed: " + getResp.status + " " + txt);
  }
  const getData = await getResp.json();
  console.log("Profile fetched successfully:", JSON.stringify(getData.state));
  
  if (getData.state?.profile?.firstName === "Updated") {
    console.log("✅ TEST PASSED");
  } else {
    console.log("❌ TEST FAILED: State not updated correctly");
  }
}

runTest().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
