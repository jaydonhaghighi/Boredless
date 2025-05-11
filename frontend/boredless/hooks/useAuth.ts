import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../FirebaseConfig.Example'; // Adjust path as needed

export interface AuthState {
  user: User | null;
  userId: string | null; // Added for convenience
  loading: boolean;
  isAuthenticated: boolean;
}

export const useAuth = (): AuthState => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return { user, userId: user?.uid || null, loading, isAuthenticated: !!user };
}; 