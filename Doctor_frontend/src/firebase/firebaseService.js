import { auth, db } from './firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';

// Collection references
export const doctorsCollection = collection(db, 'doctors');
export const patientsCollection = collection(db, 'patients');
export const analysesCollection = collection(db, 'analyses');

// Helper functions
export const getCurrentUser = () => auth.currentUser;

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUserProfile = async (uid) => {
  try {
    const docRef = doc(db, 'doctors', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const savePatientAnalysis = async (patientData, results) => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    await addDoc(analysesCollection, {
      doctorId: user.uid,
      patientId: patientData.patientId,
      patientData,
      results,
      timestamp: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error saving analysis:', error);
    return { success: false, error: error.message };
  }
};

export const getPatientAnalyses = async () => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const q = query(
      analysesCollection,
      where('doctorId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching analyses:', error);
    return [];
  }
};

// Export auth object and collection helpers for direct use
export { auth };