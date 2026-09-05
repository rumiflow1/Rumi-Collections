import { useState, useEffect } from 'react';
import { auth, googleProvider, db, handleFirestoreError } from '../firebase';
import { OperationType } from '../types';
import { signInWithPopup, signOut, onAuthStateChanged, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { authApi } from '../services/api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  const reportActivityToBackend = async (firebaseUser: User, isNew: boolean, method: string) => {
    try {
      return await authApi.syncUser({ uid: firebaseUser.uid, email: firebaseUser.email, displayName: firebaseUser.displayName || 'Patron', photoURL: firebaseUser.photoURL || '', isNewUser: isNew, authMethod: method, actionType: isNew ? 'SIGNUP' : 'LOGIN' });
    } catch (err: any) {
      console.warn('[backend-sync] unavailable; Firebase session remains active', err?.message || err);
      return null;
    }
  };

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    // Preserve the original owner/admin session: this path is intentionally independent of Firebase.
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
        const isMasterAuthority = firebaseUser.email?.trim().toLowerCase() === 'admin@rumi.com';
        if (isMasterAuthority) {
          setIsAdmin(true);
          setIsSuperAdmin(true);
        }

        const userDocRef = doc(db, 'users', firebaseUser.uid);
        if (unsubProfile) unsubProfile();
        unsubProfile = onSnapshot(userDocRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setProfileData(data);
            setIsAdmin(data.role === 'admin' || data.role === 'SUPER_ADMIN' || isMasterAuthority);
            setIsSuperAdmin(data.role === 'SUPER_ADMIN' || isMasterAuthority);
          } else if (isMasterAuthority) {
            setIsAdmin(true);
            setIsSuperAdmin(true);
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          if (isMasterAuthority) { setIsAdmin(true); setIsSuperAdmin(true); }
          setLoading(false);
        });

        try {
          const userDoc = await getDoc(userDocRef);
          const isNewUser = !userDoc.exists();
          if (isNewUser) {
            await setDoc(userDocRef, {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
              photoURL: firebaseUser.photoURL || '',
              role: isMasterAuthority ? 'admin' : 'user',
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp()
            });
          } else {
            await setDoc(userDocRef, { lastLogin: serverTimestamp() }, { merge: true });
          }
          await reportActivityToBackend(firebaseUser, isNewUser, isNewUser ? 'Email/Google Signup' : 'Secure Login');
        } catch (error) {
          console.warn('[auth-profile] profile sync failed; continuing session', error);
          setLoading(false);
        }
      } else {
        if (unsubProfile) { unsubProfile(); unsubProfile = null; }
        const currentHardcodedAdmin = sessionStorage.getItem('hardcodedAdmin');
        if (currentHardcodedAdmin === 'true') {
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

    return () => { unsubscribe(); if (unsubProfile) unsubProfile(); };
  }, []);

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const loginWithGoogle = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try { return await signInWithPopup(auth, googleProvider); }
    finally { setIsLoggingIn(false); }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    // Original owner login contract: do not send the owner credentials through Firebase.
    if (normalizedEmail === 'admin@rumi.com' && pass === 'admin516') {
      setIsAdmin(true);
      setIsSuperAdmin(true);
      sessionStorage.setItem('hardcodedAdmin', 'true');
      const adminUser = { email: normalizedEmail, uid: 'admin-hardcoded' } as User;
      setUser(adminUser);
      setProfileData({ uid: 'admin-hardcoded', email: normalizedEmail, role: 'admin', displayName: 'Owner' });
      setLoading(false);
      return { user: adminUser };
    }
    return signInWithEmailAndPassword(auth, normalizedEmail, pass);
  };

  const signupWithEmail = async (email: string, pass: string, name: string, phone: string) => {
    const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    await updateProfile(result.user, { displayName: name });
    await setDoc(doc(db, 'users', result.user.uid), { uid: result.user.uid, email: email.trim().toLowerCase(), displayName: name, phone, role: 'user', createdAt: serverTimestamp() });
    return result;
  };

  const logout = async () => {
    try {
      sessionStorage.removeItem('hardcodedAdmin');
      await signOut(auth);
    } catch (error) { console.error('Logout failed:', error); }
  };

  return { user, profileData, loading, isAdmin, isSuperAdmin, loginWithGoogle, loginWithEmail, signupWithEmail, logout, reportActivityToBackend };
}
