import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { HeaderProfileDropdown } from './HeaderProfileDropdown.jsx';

/**
 * Unified Auth Cluster: Handles Google Sign-In button rendering and Profile dropdown.
 */
export function HeaderAuthCluster({ className = '' }) {
  const { user } = useAuth();

  useEffect(() => {
    if (user) return;

    // Wait for DOM to be ready and Google SDK to be available
    const timer = setTimeout(() => {
      // Check if Google SDK is loaded
      if (window.google && window.google.accounts && window.google.accounts.id) {
        // Directly render the button if SDK is ready
        if (typeof window.renderGoogleSignInButton === 'function') {
          window.renderGoogleSignInButton();
        }
      } else if (typeof window.bootGoogle === 'function') {
        // Initialize Google SDK first
        window.bootGoogle();
      } else {
        // Fallback: try again after a short delay
        setTimeout(() => {
          if (typeof window.bootGoogle === 'function') {
            window.bootGoogle();
          }
        }, 500);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [user]);

  return (
    <div className={`bc-header-auth flex items-center gap-3 flex-shrink-0 ${className}`.trim()}>
      {!user && (
        <div 
          className="g_id_signin" 
          style={{ minWidth: '200px', minHeight: '40px' }}
        ></div>
      )}
      {user && <HeaderProfileDropdown />}
    </div>
  );
}
