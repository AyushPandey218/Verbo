import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '@/utils/messageUtils';
import { LOGOUT_STORAGE_CLEANUP_ITEMS, THOROUGH_LOGOUT_CLEANUP } from '@/utils/config';
import { Button } from '@/components/ui/button';
import AppLoading from '@/components/AppLoading';

// Update the interface to be more precise
interface AuthContextType {
  setUser: (user: User | null) => void;
  user: User | null;
  loading: boolean;
  isAuthLoading: boolean; // New state for auth loading specifically
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Replace this with your actual Google OAuth Client ID
const GOOGLE_CLIENT_ID = '962065436296-udarokfj067go8681gdvpel605vnmfpq.apps.googleusercontent.com'; 

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false); // New state for auth loading
  const [error, setError] = useState<string | null>(null);
  const [googleInitialized, setGoogleInitialized] = useState<boolean>(false);

  // Clear user data on window close
  useEffect(() => {
    const handleBeforeUnload = () => {
      cleanupUserData();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Clear all user data from local storage and disconnect socket
  const cleanupUserData = () => {
    if (THOROUGH_LOGOUT_CLEANUP) {
      // Clear all specified items from localStorage
      LOGOUT_STORAGE_CLEANUP_ITEMS.forEach(item => {
        localStorage.removeItem(item);
      });
      
      // Always clear lastRoom data to ensure users start fresh
      localStorage.removeItem('lastRoom');
      
      // If we're using a real socket, disconnect
      if (window.socket) {
        window.socket.disconnect();
      }
      
      // Clear any other session storage or indexed DB data
      sessionStorage.clear();
      
      // Reset any Firebase persistence if applicable
      if (window.firebase && window.firebase.auth) {
        window.firebase.auth().setPersistence('none').catch(console.error);
      }
      
      console.log("User data cleaned up successfully");
    } else {
      // Minimal cleanup - just remove the user and room data
      localStorage.removeItem('chatUser');
      localStorage.removeItem('lastRoom');
    }
  };

  // Initialize Google Auth
  useEffect(() => {
    const initGoogleAuth = async () => {
      try {
        // Check if user was previously logged in
        const storedUser = localStorage.getItem('chatUser');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            // Only set Google users here (not guest users)
            if (parsedUser && parsedUser.id.startsWith('google-')) {
              // Always ensure online=true is set when restoring the user
              const updatedUser = {
                ...parsedUser,
                online: true,
                lastActive: Date.now()
              };
              setUser(updatedUser);
              localStorage.setItem('chatUser', JSON.stringify(updatedUser));
            }
          } catch (e) {
            console.error("Error parsing stored user:", e);
            localStorage.removeItem('chatUser');
          }
        }
        
        // Load Google authentication script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        script.onload = () => {
          if (window.google) {
            try {
              window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleCallback,
                auto_select: false
              });
              
              // Render the button immediately for fallback use
              setTimeout(() => {
                const buttonContainer = document.getElementById('google-signin-button');
                if (buttonContainer) {
                  window.google.accounts.id.renderButton(buttonContainer, {
                    type: 'standard',
                    theme: 'outline',
                    size: 'large',
                    text: 'signin_with',
                    shape: 'rectangular',
                    width: 250
                  });
                }
              }, 500);
              
              setGoogleInitialized(true);
            } catch (err) {
              console.error("Error initializing Google auth:", err);
              setError('Failed to initialize Google authentication');
            }
          }
          
          setLoading(false);
        };

        script.onerror = () => {
          setError('Failed to load Google authentication');
          setLoading(false);
        };
      } catch (err) {
        setError('Authentication initialization error');
        setLoading(false);
      }
    };

    initGoogleAuth();
  }, []);
  
  const handleGoogleCallback = (response: any) => {
    if (response && response.credential) {
      try {
        // Decode the JWT token to get user info
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const { sub, name, email, picture } = JSON.parse(jsonPayload);
        
        const newUser: User = {
          id: 'google-' + sub, // Prefix to distinguish from guest users
          name,
          email,
          photoURL: picture,
          online: true, // Explicitly set online to true
          lastActive: Date.now() // Add timestamp for when user was last active
          ,
          isGuest: false
        };
        
        // Make sure to clear any stored room data to force returning to greeting
        localStorage.removeItem('lastRoom');
        
        setUser(newUser);
        localStorage.setItem('chatUser', JSON.stringify(newUser));
        
        // We're done with authentication loading
        setIsAuthLoading(false);
        setLoading(false);
      } catch (err) {
        console.error("Error processing Google sign-in:", err);
        setError("Failed to process sign-in information");
        setIsAuthLoading(false);
        setLoading(false);
      }
    }
  };

  const signIn = async (): Promise<void> => {
    try {
      setIsAuthLoading(true); // Set auth loading state
      setLoading(true);
      
      if (!window.google || !googleInitialized) {
        // For development/testing, create a mock Google user when Google auth is not available
        createMockGoogleUser();
        return Promise.resolve();
      }
      
      // First try the One Tap prompt
      try {
        window.google.accounts.id.prompt();
        console.log("Google sign-in prompt requested");
      } catch (err) {
        console.error("Error with Google prompt:", err);
      }
      
      // As a fallback (or if the domain isn't allowed), directly click the fallback button
      setTimeout(() => {
        const button = document.querySelector<HTMLElement>('#google-signin-button div[role="button"]');
        if (button) {
          console.log("Clicking fallback Google sign-in button");
          button.click();
        } else {
          console.error("Fallback button not found");
          setError("Sign-in not available. Please try again later.");
          setIsAuthLoading(false);
          setLoading(false);
        }
      }, 1000);
      
      return Promise.resolve();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during sign in';
      setError(errorMessage);
      setIsAuthLoading(false);
      setLoading(false);
      throw new Error(errorMessage);
    }
  };

  // Create a mock Google user for testing when Google auth is unavailable
  const createMockGoogleUser = () => {
    const mockUser: User = {
      id: 'google-mock-123',
      name: 'Test User',
      email: 'test@example.com',
      photoURL: 'https://ui-avatars.com/api/?name=Test+User&background=random',
      online: true,
      lastActive: Date.now(),
      isGuest: false
    };
    
    // Make sure to clear any stored room data to force returning to greeting
    localStorage.removeItem('lastRoom');
    
    setUser(mockUser);
    localStorage.setItem('chatUser', JSON.stringify(mockUser));
    
    // After small delay to show loading screen
    setTimeout(() => {
      setIsAuthLoading(false);
      setLoading(false);
    }, 1000);
    
    console.log("Created mock Google user for testing");
  };
  
  const signOut = async (): Promise<void> => {
    try {
      setIsAuthLoading(true); // Set auth loading state for sign out too
      setLoading(true);
      
      if (window.google) {
        window.google.accounts.id.disableAutoSelect();
      }
      
      // Broadcast user is offline before clearing
      if (window.socket && user) {
        window.socket.emit('user_offline', { userId: user.id });
      }
      
      // Clean up user data including last room data
      cleanupUserData();
      
      // Small delay to show loading screen
      setTimeout(() => {
        setUser(null);
        setIsAuthLoading(false);
        setLoading(false);
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during sign out';
      setError(errorMessage);
      setIsAuthLoading(false);
      setLoading(false);
      throw new Error(errorMessage);
    }
  };

  // Show loading screen when auth operations are in progress
  if (isAuthLoading) {
    return <AppLoading />;
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, isAuthLoading, error, signIn, signOut }}>
      {children}
      {/* Hidden but styled fallback Google sign-in button */}
      <div 
        id="google-signin-button"
        style={{ 
          position: 'fixed', 
          bottom: '-100px', 
          visibility: 'hidden' 
        }} 
      />
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Extend the Window interface to include Google and socket
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, options: any) => void;
          disableAutoSelect: () => void;
        };
      };
    };
    socket?: any;
    firebase?: any;
  }
}

