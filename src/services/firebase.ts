// services/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBC5Fx11DwQU3zo_Rol_x5USKC_Z7fScJA',
  authDomain: 'praniebrightwaw.firebaseapp.com',
  projectId: 'praniebrightwaw',
  storageBucket: 'praniebrightwaw.firebasestorage.app',
  messagingSenderId: '199792015841',
  appId: '1:199792015841:web:15c8d2bd325466f01f3aa0',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export const registerWithEmail = async (email: string, password: string, name: string, phone?: string, role?: string) => {
  try {
    // Создаем пользователя в Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Обновляем профиль пользователя
    await updateProfile(user, { displayName: name });
    
    // Сохраняем дополнительную информацию в Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      name: name,
      email: email,
      phone: phone || '',
      role: role || 'client',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('Пользователь успешно зарегистрирован и данные сохранены');
    return userCredential;
  } catch (error) {
    console.error('Ошибка при регистрации пользователя:', error);
    throw error;
  }
};

export const loginWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const addOrder = async (order: any) => {
  try {
    const docRef = await addDoc(collection(db, 'orders'), order);
    console.log('Заказ сохранен с ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Подробная ошибка при сохранении заказа:', error);
    throw error;
  }
};

export { onAuthStateChanged };