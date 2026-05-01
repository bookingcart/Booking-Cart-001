// Test Google OAuth Configuration
// Run this to verify your Google OAuth setup

const GOOGLE_CLIENT_ID = '344110356663-foa7unsastgg0hp57qdaaj5qvmkgd8lg.apps.googleusercontent.com';

function testGoogleOAuth() {
  console.log('🔍 Testing Google OAuth Configuration');
  console.log('Client ID:', GOOGLE_CLIENT_ID);
  
  // Test 1: Check if Google SDK loads
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.onload = function() {
    console.log('✅ Google SDK loaded successfully');
    
    // Test 2: Try to initialize with client ID
    if (window.google && window.google.accounts) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: function(response) {
            console.log('✅ Google Sign-In callback works:', response.credential ? 'Success' : 'Failed');
          },
          context: 'use',
          ux_mode: 'popup',
          auto_prompt: false
        });
        console.log('✅ Google OAuth initialized successfully');
        
        // Test 3: Try to render button
        const testContainer = document.createElement('div');
        testContainer.style.cssText = 'position:fixed;top:10px;right:10px;z-index:9999;';
        document.body.appendChild(testContainer);
        
        window.google.accounts.id.renderButton(testContainer, {
          type: 'standard',
          shape: 'pill',
          theme: 'outline',
          text: 'signin_with',
          size: 'large',
          logo_alignment: 'left'
        });
        
        console.log('✅ Test button rendered (top-right corner)');
        
      } catch (error) {
        console.error('❌ Google OAuth initialization failed:', error);
      }
    } else {
      console.error('❌ Google accounts not available');
    }
  };
  
  script.onerror = function() {
    console.error('❌ Failed to load Google SDK');
  };
  
  document.head.appendChild(script);
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  testGoogleOAuth();
}
