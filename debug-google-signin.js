// Google Sign-In Debug Tool
// Run this in the browser console on your public URL to diagnose issues

(function() {
  console.log('🔍 Google Sign-In Debug Tool');
  
  // 1. Check if Google SDK is loaded
  console.log('📦 Google SDK Status:');
  console.log('  - window.google:', !!window.google);
  console.log('  - window.google.accounts:', !!window.google?.accounts);
  console.log('  - window.google.accounts.id:', !!window.google?.accounts?.id);
  
  // 2. Check if auth.js is loaded
  console.log('📚 Auth.js Status:');
  console.log('  - window.handleGoogleSignIn:', typeof window.handleGoogleSignIn);
  console.log('  - window.bootGoogle:', typeof window.bootGoogle);
  console.log('  - window.renderGoogleSignInButton:', typeof window.renderGoogleSignInButton);
  console.log('  - window.bookingcartGoogleSignInAvailable:', window.bookingcartGoogleSignInAvailable);
  
  // 3. Check config endpoint
  console.log('⚙️  Config Endpoint Check:');
  fetch('/api/config')
    .then(response => response.json())
    .then(config => {
      console.log('  - Config response:', config);
      console.log('  - Google Client ID present:', !!config.googleClientId);
      console.log('  - Google Client ID length:', config.googleClientId?.length || 0);
    })
    .catch(error => {
      console.error('  - Config endpoint error:', error);
    });
  
  // 4. Check if button container exists
  console.log('🎯 Button Container Check:');
  const container = document.querySelector('.g_id_signin');
  console.log('  - Container found:', !!container);
  if (container) {
    console.log('  - Container dimensions:', {
      width: container.offsetWidth,
      height: container.offsetHeight,
      display: getComputedStyle(container).display,
      visibility: getComputedStyle(container).visibility
    });
    console.log('  - Container content:', container.innerHTML.length > 0 ? 'Has content' : 'Empty');
  }
  
  // 5. Try to manually render button
  console.log('🚀 Manual Button Render Attempt:');
  if (typeof window.bootGoogle === 'function') {
    console.log('  - Calling bootGoogle()...');
    window.bootGoogle().then(() => {
      console.log('  - bootGoogle() completed');
    }).catch(err => {
      console.error('  - bootGoogle() failed:', err);
    });
  } else {
    console.log('  - bootGoogle() not available');
  }
  
  // 6. Check for console errors
  console.log('🐛 Recent Console Errors:');
  const originalError = console.error;
  const errors = [];
  console.error = function(...args) {
    errors.push(args);
    originalError.apply(console, args);
  };
  
  setTimeout(() => {
    if (errors.length > 0) {
      console.log('  - Recent errors:', errors);
    } else {
      console.log('  - No recent errors detected');
    }
    console.error = originalError; // Restore
  }, 2000);
  
  console.log('✅ Debug check complete. Review the output above.');
})();
