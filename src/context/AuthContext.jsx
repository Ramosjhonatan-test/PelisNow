import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, signInAnonymously, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, onSnapshot, collection, addDoc, getDoc } from 'firebase/firestore';
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';

const AuthContext = createContext();

export function AuthContextProvider({ children }) {
  const [user, setUser] = useState({});
  const [userDoc, setUserDoc] = useState(null);

  async function signUp(email, password, avatarUrl, fullName, phone) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Set avatar and name on Firebase Auth profile
      if (avatarUrl || fullName) {
        await updateProfile(userCredential.user, { 
          photoURL: avatarUrl || '',
          displayName: fullName || ''
        });
      }
      // Calculate 15 days trial expiry
      const trialExpiry = new Date();
      trialExpiry.setDate(trialExpiry.getDate() + 15);

      // Forced Device Capture Logic
      let deviceInfo = {
        deviceId: 'pending',
        deviceModel: 'pending',
        deviceManufacturer: 'pending',
        deviceBindDate: new Date().toISOString()
      };

      try {
        if (Capacitor.isNativePlatform()) {
          const idInfo = await Device.getId();
          const moreInfo = await Device.getInfo();
          deviceInfo = {
            deviceId: idInfo.identifier || 'Unknown-Device-ID',
            deviceModel: moreInfo.model || 'Generic Android',
            deviceManufacturer: moreInfo.manufacturer || 'Unknown',
            deviceBindDate: new Date().toISOString()
          };
        } else {
          // Robust Web/PC Fallback
          let webId = localStorage.getItem('zenplus_web_id');
          if (!webId) {
            webId = 'web-' + Math.random().toString(36).substring(2, 12);
            localStorage.setItem('zenplus_web_id', webId);
          }
          deviceInfo = {
            deviceId: webId,
            deviceModel: (window.navigator && window.navigator.platform) ? window.navigator.platform : 'Web Browser',
            deviceManufacturer: (window.navigator && window.navigator.vendor) ? window.navigator.vendor : 'PC',
            deviceBindDate: new Date().toISOString()
          };
        }
      } catch (e) {
        console.error("Error capturing device info during signup:", e);
        deviceInfo = {
          deviceId: 'error-' + Date.now(),
          deviceModel: 'Error: ' + (e.message ? e.message.substring(0, 40) : 'Desconocido'),
          deviceManufacturer: 'System-Error',
          deviceBindDate: new Date().toISOString()
        };
      }

      // Create a user document to store their data
      await setDoc(doc(db, 'users', userCredential.user.email), {
        savedMovies: [],
        photoURL: avatarUrl || '',
        displayName: fullName || '',
        phone: phone || '',
        createdAt: new Date().toISOString(),
        accountExpiry: trialExpiry.toISOString(),
        status: 'active',
        ...deviceInfo
      });

      // Dispatch Welcome Notification
      try {
        await addDoc(collection(db, 'users', userCredential.user.email, 'notifications'), {
          title: '🎉 ¡Bienvenido a tu prueba gratis!',
          message: 'Tu cuenta ha sido creada con 15 días de prueba. Si deseas comprar más días o acceso ilimitado, escríbeme a mi número de contacto de WhatsApp +591 73225724.',
          type: 'success',
          read: false,
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Could not dispatch welcome notification:', err);
      }

      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  async function logIn(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    let currentDeviceId = 'pending';
    try {
      if (Capacitor.isNativePlatform()) {
        const idInfo = await Device.getId();
        currentDeviceId = idInfo.identifier || 'Unknown-Device-ID';
      } else {
        let webId = localStorage.getItem('zenplus_web_id');
        if (!webId) {
          webId = 'web-' + Math.random().toString(36).substring(2, 12);
          localStorage.setItem('zenplus_web_id', webId);
        }
        currentDeviceId = webId;
      }
    } catch (e) {
      console.error("Device verification error:", e);
    }

    const userDocRef = doc(db, 'users', userCredential.user.email);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      // Si la cuenta ya tiene un dispositivo y es diferente al actual, no dejar loguear
      if (data.deviceId && data.deviceId !== 'pending' && data.deviceId !== currentDeviceId) {
        await signOut(auth);
        throw new Error("device-mismatch");
      }
    }

    return userCredential;
  }

  function logOut() {
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  useEffect(() => {
    let unsubDoc = null;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      // Cleanup previous doc listener
      if (unsubDoc) unsubDoc();

      if (currentUser) {
        unsubDoc = onSnapshot(doc(db, 'users', currentUser.email), (snap) => {
          if (snap.exists()) {
            setUserDoc(snap.data());
          }
        });
      } else {
        setUserDoc(null);
      }
    });

    return () => {
      unsubscribe();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ signUp, logIn, logOut, resetPassword, user, userDoc }}>
      {children}
    </AuthContext.Provider>
  );
}

export function UserAuth() {
  return useContext(AuthContext);
}
