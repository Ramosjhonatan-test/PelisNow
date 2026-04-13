import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, signInAnonymously, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthContextProvider({ children }) {
  const [user, setUser] = useState({});

  async function signUp(email, password, avatarUrl) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Set avatar on Firebase Auth profile
      if (avatarUrl) {
        await updateProfile(userCredential.user, { photoURL: avatarUrl });
      }
      // Create a user document to store their favorites
      await setDoc(doc(db, 'users', userCredential.user.email), {
        savedMovies: [],
        photoURL: avatarUrl || ''
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ signUp, logIn, logOut, user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function UserAuth() {
  return useContext(AuthContext);
}
