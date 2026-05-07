import { useState, useEffect } from 'react';
import { auth, googleProvider, db, handleFirestoreError } from '../firebase';
import { OperationType } from '../types';
import { signInWithPopup, signOut, onAuthStateChanged, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { authApi } from '../services/api';
import axios from 'axios';

/**
 * SOVEREIGN AUTHENTICATION HOOK - v11.0
 * Engineered for Luxe Attire Sanctuary.
 * This hook ensures 100% synchronization between Firebase and Master Backend.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  // --- MASTER BACKEND NOTIFIER ---
  // This function forces the Node.js server to send Luxury Emails
  const reportActivityToBackend = async (firebaseUser: User, isNew: boolean, method: string) => {
    try {
      console.log(`📡 [SOVEREIGN LOG]: Dispatching sync for ${firebaseUser.email} via ${method}. Action: ${isNew ? 'SIGNUP' : 'LOGIN'}`);
      
      const response = await authApi.syncUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || 'Patron',
        photoURL: firebaseUser.photoURL || '',
        isNewUser: isNew,
        authMethod: method,
        actionType: isNew ? 'SIGNUP' : 'LOGIN'
      });
      console.log(`✅ [SOVEREIGN SYNC SUCCESS]: Backend responded with status: ${response.data.status}`);
      return response;
    } catch (err: any) {
      console.error(`❌ [BACKEND SYNC FAILURE]: The API bridge (/api) is unavailable.`, err.message);
      throw err;
    }
  };

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    // Persist Hardcoded Admin session for immediate access
    const hardcodedAdmin = sessionStorage.getItem('hardcodedAdmin');
    if (hardcodedAdmin === 'true') {
      setUser({ email: 'admin@rumi.com', uid: 'admin-hardcoded' } as User);
      setIsAdmin(true);
      setIsSuperAdmin(true);
      setLoading(false);
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Identity Identification for Admin Redirection
        const isMasterAuthority = (firebaseUser.email === 'admin@rumi.com');
        if (isMasterAuthority) {
          setIsAdmin(true);
          setIsSuperAdmin(true);
        }

        const userDocRef = doc(db, 'users', firebaseUser.uid);

        // Real-time Firestore Mirroring
        if (unsubProfile) unsubProfile();
        unsubProfile = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setProfileData(data);
            setIsAdmin(data.role === 'admin' || data.role === 'SUPER_ADMIN' || isMasterAuthority);
            setIsSuperAdmin(data.role === 'SUPER_ADMIN' || isMasterAuthority);
          }
          setLoading(false); // Only set loading false AFTER first snapshot
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          setLoading(false);
        });

        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          // --- NEW IDENTITY ESTABLISHED (Signup) ---
          const initialData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
            photoURL: firebaseUser.photoURL,
            role: isMasterAuthority ? 'admin' : 'user',
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp()
          };
          await setDoc(userDocRef, initialData);
          
          // Notify Backend for Automatic Welcome Email
          await reportActivityToBackend(firebaseUser, true, "Google/Email Signup");
        } else {
          // --- RETURNING PATRON (Login) ---
          await reportActivityToBackend(firebaseUser, false, "Secure Login");
        }
      } else {
        if (unsubProfile) {
          unsubProfile();
          unsubProfile = null;
        }
        
        // Check if we have a hardcoded admin session before clearing
        const hardcodedAdmin = sessionStorage.getItem('hardcodedAdmin');
        if (hardcodedAdmin === 'true') {
          setUser({ email: 'admin@rumi.com', uid: 'admin-hardcoded' } as User);
          setIsAdmin(true);
          setIsSuperAdmin(true);
          setLoading(false);
        } else {
          setUser(null);
          setProfileData(null);
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setLoading(false);
        }
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const loginWithGoogle = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result;
    } catch (error: any) {
      console.error("Google Authority Error:", error.message);
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      // Special Rule for Sovereign Admin
      if (email === 'admin@rumi.com' && pass === 'admin516') {
        setIsAdmin(true);
        setIsSuperAdmin(true);
        sessionStorage.setItem('hardcodedAdmin', 'true');
        const adminUser = { email, uid: 'admin-hardcoded' } as User;
        setUser(adminUser);
        setLoading(false); // CRITICAL: Ensure loading is false for redirection
        return { user: adminUser };
      }
      return await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      throw error;
    }
  };

  const signupWithEmail = async (email: string, pass: string, name: string, phone: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(result.user, { displayName: name });
      
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email,
        displayName: name,
        phone,
        role: 'user',
        createdAt: serverTimestamp(),
      });
      return result;
    } catch (error: any) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      sessionStorage.removeItem('hardcodedAdmin');
      await signOut(auth);
    } catch (error) {
      console.error('Logout orchestration failed:', error);
    }
  };

  return {
    user,
    profileData,
    loading,
    isAdmin,
    isSuperAdmin,
    loginWithGoogle,
    loginWithEmail,
    signupWithEmail,
    logout,
    reportActivityToBackend
  };
}
