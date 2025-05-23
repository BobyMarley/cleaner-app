// services/firebase.ts - ПОЛНАЯ ВЕРСИЯ СО ВСЕМИ ФУНКЦИЯМИ
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc, getDocs, query, where, orderBy, updateDoc, getDoc, limit } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, onAuthStateChanged } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
export const storage = getStorage(app);

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export const registerWithEmail = async (email: string, password: string, name: string, phone?: string, role?: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await updateProfile(user, { displayName: name });
    
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

// РАБОТА С ЗАКАЗАМИ

export interface Order {
  id?: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  carpetArea: string;
  chairCount: number;
  armchairCount: number;
  sofaCount: number;
  mattressCount: number;
  withPillows: boolean;
  additionalInfo: string;
  images: string[];
  price: string;
  estimatedTime?: string;
  scheduledDate?: Date;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt?: Date;
}

export const addOrder = async (order: any) => {
  try {
    const cleanedOrder: any = {
      userId: order.userId,
      userEmail: order.userEmail || '',
      userName: order.userName || '',
      carpetArea: order.carpetArea || '',
      chairCount: order.chairCount || 0,
      armchairCount: order.armchairCount || 0,
      sofaCount: order.sofaCount || 0,
      mattressCount: order.mattressCount || 0,
      withPillows: order.withPillows || false,
      additionalInfo: order.additionalInfo || '',
      images: order.images || [],
      createdAt: new Date(),
      price: order.price || '---',
      estimatedTime: order.estimatedTime || '',
      status: order.status || 'pending'
    };

    if (order.scheduledDate) {
      cleanedOrder.scheduledDate = new Date(order.scheduledDate);
    }

    const docRef = await addDoc(collection(db, 'orders'), cleanedOrder);
    console.log('Заказ сохранен с ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Подробная ошибка при сохранении заказа:', error);
    throw error;
  }
};

export const getAllOrders = async () => {
  try {
    const ordersQuery = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );
    
    const ordersSnapshot = await getDocs(ordersQuery);
    return ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      scheduledDate: doc.data().scheduledDate?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as Order[];
  } catch (error) {
    console.error('Ошибка при получении заказов:', error);
    return [];
  }
};

export const getUserOrders = async (userId: string) => {
  try {
    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const ordersSnapshot = await getDocs(ordersQuery);
    return ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      scheduledDate: doc.data().scheduledDate?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as Order[];
  } catch (error) {
    console.error('Ошибка при получении заказов пользователя:', error);
    return [];
  }
};

export const updateOrderStatus = async (orderId: string, status: Order['status']) => {
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      status: status,
      updatedAt: new Date()
    });
    console.log('Статус заказа обновлен:', orderId, status);
  } catch (error) {
    console.error('Ошибка при обновлении статуса заказа:', error);
    throw error;
  }
};

export const getOrderById = async (orderId: string) => {
  try {
    const orderDoc = await getDoc(doc(db, 'orders', orderId));
    if (orderDoc.exists()) {
      const data = orderDoc.data();
      return {
        id: orderDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        scheduledDate: data.scheduledDate?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as Order;
    }
    return null;
  } catch (error) {
    console.error('Ошибка при получении заказа:', error);
    return null;
  }
};

export const getOrdersStats = async () => {
  try {
    const orders = await getAllOrders();
    
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      in_progress: orders.filter(o => o.status === 'in_progress').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length
    };
    
    return stats;
  } catch (error) {
    console.error('Ошибка при получении статистики заказов:', error);
    return {
      total: 0,
      pending: 0,
      confirmed: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0
    };
  }
};

// РАБОТА С ОТЗЫВАМИ

export interface Review {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  orderId?: string;
  rating: number;
  comment: string;
  photos?: string[];
  serviceType: string;
  createdAt: Date;
  isApproved: boolean;
  isPublished: boolean;
}

export const addReview = async (reviewData: Omit<Review, 'id' | 'createdAt' | 'isApproved' | 'isPublished'>) => {
  try {
    const cleanedData: any = {
      userId: reviewData.userId,
      userName: reviewData.userName,
      userEmail: reviewData.userEmail,
      rating: reviewData.rating,
      comment: reviewData.comment,
      serviceType: reviewData.serviceType,
      photos: reviewData.photos || [],
      createdAt: new Date(),
      isApproved: false,
      isPublished: false
    };

    if (reviewData.orderId) {
      cleanedData.orderId = reviewData.orderId;
    }
    
    const docRef = await addDoc(collection(db, 'reviews'), cleanedData);
    console.log('Отзыв добавлен с ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Ошибка при добавлении отзыва:', error);
    throw error;
  }
};

export const getApprovedReviews = async (limitCount: number = 10) => {
  try {
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('isApproved', '==', true),
      where('isPublished', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const reviewsSnapshot = await getDocs(reviewsQuery);
    return reviewsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as Review[];
  } catch (error) {
    console.error('Ошибка при получении отзывов:', error);
    return [];
  }
};

export const getUserReviews = async (userId: string) => {
  try {
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const reviewsSnapshot = await getDocs(reviewsQuery);
    return reviewsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as Review[];
  } catch (error) {
    console.error('Ошибка при получении отзывов пользователя:', error);
    return [];
  }
};

export const getAllReviews = async () => {
  try {
    const reviewsQuery = query(
      collection(db, 'reviews'),
      orderBy('createdAt', 'desc')
    );
    
    const reviewsSnapshot = await getDocs(reviewsQuery);
    return reviewsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as Review[];
  } catch (error) {
    console.error('Ошибка при получении всех отзывов:', error);
    return [];
  }
};

export const updateReview = async (reviewId: string, updateData: Partial<Review>) => {
  try {
    const cleanedData: any = {};
    Object.keys(updateData).forEach(key => {
      const value = (updateData as any)[key];
      if (value !== undefined) {
        cleanedData[key] = value;
      }
    });

    await updateDoc(doc(db, 'reviews', reviewId), {
      ...cleanedData,
      updatedAt: new Date()
    });
    console.log('Отзыв обновлен:', reviewId);
  } catch (error) {
    console.error('Ошибка при обновлении отзыва:', error);
    throw error;
  }
};

export const approveReview = async (reviewId: string) => {
  try {
    await updateDoc(doc(db, 'reviews', reviewId), {
      isApproved: true,
      isPublished: true,
      approvedAt: new Date()
    });
    console.log('Отзыв одобрен:', reviewId);
  } catch (error) {
    console.error('Ошибка при одобрении отзыва:', error);
    throw error;
  }
};

export const rejectReview = async (reviewId: string) => {
  try {
    await updateDoc(doc(db, 'reviews', reviewId), {
      isApproved: false,
      isPublished: false,
      rejectedAt: new Date()
    });
    console.log('Отзыв отклонен:', reviewId);
  } catch (error) {
    console.error('Ошибка при отклонении отзыва:', error);
    throw error;
  }
};

export const uploadReviewPhoto = async (file: File, reviewId: string): Promise<string> => {
  try {
    const storageRef = ref(storage, `reviews/${reviewId}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Ошибка при загрузке фото:', error);
    throw error;
  }
};

export const getAverageRating = async (serviceType?: string) => {
  try {
    let reviewsQuery;
    
    if (serviceType) {
      reviewsQuery = query(
        collection(db, 'reviews'),
        where('isApproved', '==', true),
        where('isPublished', '==', true),
        where('serviceType', '==', serviceType)
      );
    } else {
      reviewsQuery = query(
        collection(db, 'reviews'),
        where('isApproved', '==', true),
        where('isPublished', '==', true)
      );
    }
    
    const reviewsSnapshot = await getDocs(reviewsQuery);
    const reviews = reviewsSnapshot.docs.map(doc => doc.data());
    
    if (reviews.length === 0) return 0;
    
    const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    return totalRating / reviews.length;
  } catch (error) {
    console.error('Ошибка при подсчете среднего рейтинга:', error);
    return 0;
  }
};

export const getReviewsStats = async () => {
  try {
    const reviews = await getAllReviews();
    
    const stats = {
      total: reviews.length,
      pending: reviews.filter(r => !r.isApproved && !r.isPublished).length,
      approved: reviews.filter(r => r.isApproved && r.isPublished).length,
      rejected: reviews.filter(r => r.isApproved === false && r.isPublished === false).length
    };
    
    return stats;
  } catch (error) {
    console.error('Ошибка при получении статистики отзывов:', error);
    return {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    };
  }
};

// РАБОТА С ПОЛЬЗОВАТЕЛЯМИ

export interface User {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: 'client' | 'worker' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  isActive?: boolean;
  lastLogin?: Date;
}

export const getAllUsers = async () => {
  try {
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc')
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    return usersSnapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      lastLogin: doc.data().lastLogin?.toDate()
    })) as User[];
  } catch (error) {
    console.error('Ошибка при получении пользователей:', error);
    return [];
  }
};

export const getUserById = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastLogin: data.lastLogin?.toDate()
      } as User;
    }
    return null;
  } catch (error) {
    console.error('Ошибка при получении пользователя:', error);
    return null;
  }
};

export const updateUserRole = async (userId: string, role: User['role']) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      role: role,
      updatedAt: new Date()
    });
    console.log('Роль пользователя обновлена:', userId, role);
  } catch (error) {
    console.error('Ошибка при обновлении роли пользователя:', error);
    throw error;
  }
};

export const updateUserStatus = async (userId: string, isActive: boolean) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      isActive: isActive,
      updatedAt: new Date()
    });
    console.log('Статус пользователя обновлен:', userId, isActive);
  } catch (error) {
    console.error('Ошибка при обновлении статуса пользователя:', error);
    throw error;
  }
};

export const updateLastLogin = async (userId: string) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      lastLogin: new Date()
    });
  } catch (error) {
    console.error('Ошибка при обновлении последнего входа:', error);
  }
};

export const getUsersStats = async () => {
  try {
    const users = await getAllUsers();
    
    const stats = {
      total: users.length,
      clients: users.filter(u => u.role === 'client').length,
      workers: users.filter(u => u.role === 'worker').length,
      admins: users.filter(u => u.role === 'admin').length,
      active: users.filter(u => u.isActive !== false).length,
      inactive: users.filter(u => u.isActive === false).length
    };
    
    return stats;
  } catch (error) {
    console.error('Ошибка при получении статистики пользователей:', error);
    return {
      total: 0,
      clients: 0,
      workers: 0,
      admins: 0,
      active: 0,
      inactive: 0
    };
  }
};

export { onAuthStateChanged };