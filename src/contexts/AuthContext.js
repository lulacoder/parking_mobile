import React, { createContext, useState, useEffect, useContext } from 'react';
import { Alert } from 'react-native';
import { auth, firestore } from '../config/firebase';
import { sanitizeRole, FALLBACK_ROLE } from '../utils/roleUtils';
import { handleNetworkError } from '../utils/errorHandlers';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(FALLBACK_ROLE);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;
    const timeoutRef = setTimeout(() => {
      if (mounted) {
        setLoading(false);
        setInitializing(false);
      }
    }, 8000);

    const unsubscribe = auth.onAuthStateChanged(
      async (currentUser) => {
        if (!mounted) return;
        setLoading(true);

        if (!currentUser) {
          setUser(null);
          setUserRole(FALLBACK_ROLE);
          setLoading(false);
          setInitializing(false);
          clearTimeout(timeoutRef);
          return;
        }

        setUser(currentUser);
        setUserRole(FALLBACK_ROLE);

        try {
          const snapshot = await Promise.race([
            firestore.collection('users').doc(currentUser.uid).get(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('PROFILE_TIMEOUT')), 5000)
            ),
          ]);

          const hasProfile = snapshot?.exists;
          let profile = hasProfile ? snapshot.data() : null;

          // Legacy compatibility
          if (!profile) {
            const legacySnapshot = await firestore
              .collection('Users')
              .doc(currentUser.uid)
              .get();
            profile = legacySnapshot?.exists ? legacySnapshot.data() : null;
          }

          if (!profile) {
            console.warn(`Profile missing for user ${currentUser.uid}, using fallback role: ${FALLBACK_ROLE}`);
          } else if (profile.status && profile.status !== 'active') {
            console.warn(`User ${currentUser.uid} has inactive status: ${profile.status}`);
            
            // Sign out user and show message
            try {
              await auth.signOut();
              Alert.alert(
                'Account Inactive',
                'Your account is not active. Please contact support for assistance.',
                [{ text: 'OK' }]
              );
            } catch (signOutError) {
              console.error('Error signing out inactive user:', signOutError);
            }
            return;
          } else {
            setUserRole(sanitizeRole(profile.role));
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          console.warn(`Using fallback role (${FALLBACK_ROLE}) due to profile fetch error`);
          
          // Only show alert for non-timeout errors that might need user attention
          if (error.message !== 'PROFILE_TIMEOUT') {
            const errorMessage = handleNetworkError(error);
            console.error('Profile fetch error details:', errorMessage);
          }
        } finally {
          if (mounted) {
            setLoading(false);
            setInitializing(false);
            clearTimeout(timeoutRef);
          }
        }
      },
      (error) => {
        console.error('Auth listener failed:', error);
        if (!mounted) return;
        setUser(null);
        setUserRole(FALLBACK_ROLE);
        setLoading(false);
        setInitializing(false);
        clearTimeout(timeoutRef);
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeoutRef);
      unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
      console.error('Sign in error:', error.code || error.message);
      throw error;
    }
  };

  const signUp = async (email, password, role) => {
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      await firestore.collection('users').doc(userCredential.user.uid).set({
        email,
        role: sanitizeRole(role),
        status: 'active',
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Sign up error:', error.code || error.message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error.code || error.message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        loading,
        initializing,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
