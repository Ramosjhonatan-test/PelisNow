import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, signInAnonymously, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

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
      // Create a user document to store their data
      await setDoc(doc(db, 'users', userCredential.user.email), {
        savedMovies: [],
        photoURL: avatarUrl || '',
        displayName: fullName || '',
        phone: phone || '',
        createdAt: new Date().toISOString(),
        status: 'active'
      });
      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  function logIn(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
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
