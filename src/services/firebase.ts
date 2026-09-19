import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let firestoreInstance: Firestore | null = null;

export const getFirebaseDb = (): Firestore | null => {
  if (firestoreInstance) return firestoreInstance;
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    // Utilizar la base de datos provisionada o (default)
    const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId.trim() !== ''
      ? firebaseConfig.firestoreDatabaseId
      : '(default)';
    firestoreInstance = getFirestore(app, dbId);
    return firestoreInstance;
  } catch (error) {
    console.warn('Firebase Firestore initialization notice (running with local fallback):', error);
    return null;
  }
};
