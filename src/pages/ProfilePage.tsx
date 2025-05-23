import React, { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonToolbar, IonButton, IonIcon, IonLabel, IonFooter, IonTabBar, IonTabButton, IonImg, IonInput, IonSpinner, IonModal, IonSegment, IonSegmentButton, IonLoading, IonAlert } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { homeOutline, personOutline, cartOutline, sunnyOutline, moonOutline, logOutOutline, cameraOutline, calendarOutline, chatbubbleOutline, notificationsOutline, arrowBackOutline, addOutline, star, chatbubblesOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import newLogo from '../assets/new-logo.png'; //
import { auth, getUserReviews, Review, Order } from '../services/firebase';
import { updatePassword, updateProfile } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore'; //
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import ReviewCard from '../components/ReviewCard';
import AddReviewForm from '../components/AddReviewForm';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [role, setRole] = useState<'client' | 'worker' | 'admin'>('client');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSegment, setSelectedSegment] = useState<string>('info');

  // Состояния для отзывов
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);
  const [showAddReviewModal, setShowAddReviewModal] = useState<boolean>(false);

  // Состояния для загрузки аватара
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>('');

  const user = auth.currentUser;
  const db = getFirestore();
  const storage = getStorage();

  useEffect(() => {
    // Проверяем авторизацию
    const checkAuth = () => {
      const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
        if (!currentUser) {
          navigate('/login');
        } else {
          // Получаем роль пользователя из Firestore
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef); //
          let userRole: 'client' | 'worker' | 'admin' = 'client';

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if (userData.role) {
              userRole = userData.role;
            }
          }

          // Дополнительная проверка на админа по email, если роль не установлена в Firestore
          if (currentUser.email?.includes('plenkanet') && userRole !== 'admin') {
              userRole = 'admin';
          }

          setRole(userRole);
          setLoading(false);
          fetchOrders(currentUser, userRole);
          fetchUserReviews(currentUser, userRole);
          setAvatar(currentUser.photoURL);
        }
      });

      return () => unsubscribe();
    };

    checkAuth();
  }, [navigate, db]);

  // Обновил fetchOrders, чтобы принимать пользователя и его роль
  const fetchOrders = async (currentUser: any, currentUserRole: 'client' | 'worker' | 'admin') => {
    if (currentUser && currentUserRole !== 'admin') {
      try {
        const ordersQuery = query(
          collection(db, 'orders'),
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        const ordersSnapshot = await getDocs(ordersQuery);

        const allOrders: Order[] = ordersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
            scheduledDate: data.scheduledDate?.toDate ? data.scheduledDate.toDate() : (data.scheduledDate ? new Date(data.scheduledDate) : undefined),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : undefined)
          } as Order;
        });

        const historyOrders: Order[] = [];
        let foundCurrentOrder: Order | null = null;
        let foundPendingOrder: Order | null = null;

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // Перебираем все заказы, чтобы найти текущий и запланированный
        allOrders.forEach(order => {
          const scheduledDate = order.scheduledDate;
          const createdAt = order.createdAt;

          // Если у заказа есть запланированная дата и она в будущем
          if (scheduledDate && scheduledDate.getTime() >= now.getTime()) {
              if (foundPendingOrder === null || (foundPendingOrder.scheduledDate && scheduledDate.getTime() < foundPendingOrder.scheduledDate.getTime())) {
                  foundPendingOrder = order;
              }
          }
          // Если у заказа нет запланированной даты, но он создан сегодня или в будущем
          else if (createdAt && createdAt.getTime() >= now.getTime()) {
              if (foundCurrentOrder === null || (foundCurrentOrder.createdAt && createdAt.getTime() < foundCurrentOrder.createdAt.getTime())) {
                  foundCurrentOrder = order;
              }
          }
        });

        // Теперь формируем историю заказов, исключая найденные текущий и запланированный
        allOrders.forEach(order => {
            if (order.id !== foundCurrentOrder?.id && order.id !== foundPendingOrder?.id) {
                historyOrders.push(order);
            }
        });

        // Устанавливаем состояния
        setCurrentOrder(foundCurrentOrder);
        setPendingOrder(foundPendingOrder);
        setOrders(historyOrders); // Это теперь массив истории заказов

      } catch (error) {
        console.error('Ошибка при получении заказов:', error);
      }
    }
  };

  // Обновил fetchUserReviews, чтобы принимать пользователя и его роль
  const fetchUserReviews = async (currentUser: any, currentUserRole: 'client' | 'worker' | 'admin') => {
    if (currentUser && currentUserRole !== 'admin') {
      try {
        setLoadingReviews(true);
        const reviews = await getUserReviews(currentUser.uid);
        setUserReviews(reviews);
      } catch (error) {
        console.error('Ошибка при получении отзывов пользователя:', error);
      } finally {
        setLoadingReviews(false);
      }
    }
  };


  // Функции навигации
  const goToHome = () => {
    navigate('/');
  };

  const goToOrder = () => {
    navigate('/order');
  };

  const goToChat = () => {
    // navigate('/chat');
  };

  const goToNotifications = () => {
    // navigate('/notifications');
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = () => {
    auth.signOut().then(() => {
      navigate('/login');
    });
  };

  // Улучшенная функция загрузки аватара с сохранением в Firebase Storage
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      setAlertMessage('Пожалуйста, выберите изображение');
      setShowAlert(true);
      return;
    }

    // Проверка размера файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAlertMessage('Размер файла не должен превышать 5MB');
      setShowAlert(true);
      return;
    }

    try {
      setUploadingAvatar(true);

      // Удаляем старый аватар, если есть
      if (user.photoURL && user.photoURL.includes('firebase')) {
        try {
          const oldAvatarRef = ref(storage, `avatars/${user.uid}/avatar`);
          await deleteObject(oldAvatarRef);
        } catch (error) {
          console.log('Старый аватар не найден или не удален:', error);
        }
      }

      // Загружаем новый аватар
      const avatarRef = ref(storage, `avatars/${user.uid}/avatar`);
      const uploadResult = await uploadBytes(avatarRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // Обновляем профиль пользователя в Firebase Auth
      await updateProfile(user, {
        photoURL: downloadURL
      });

      // Обновляем информацию в Firestore (если есть документ пользователя)
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          photoURL: downloadURL,
          updatedAt: new Date()
        });
      } catch (error) {
        console.log('Документ пользователя в Firestore не найден или не обновлен:', error);
      }

      // Обновляем локальное состояние
      setAvatar(downloadURL);

      setAlertMessage('Аватар успешно обновлен!');
      setShowAlert(true);

    } catch (error) {
      console.error('Ошибка при загрузке аватара:', error);
      setAlertMessage('Ошибка при загрузке аватара. Попробуйте еще раз.');
      setShowAlert(true);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePasswordChange = () => {
    if (user && newPassword) {
      updatePassword(user, newPassword)
        .then(() => {
          setAlertMessage('Пароль успешно изменен');
          setShowAlert(true);
          setNewPassword('');
        })
        .catch((error) => {
          setAlertMessage('Ошибка при изменении пароля: ' + error.message);
          setShowAlert(true);
        });
    }
  };

  const handleReviewAdded = () => {
    setShowAddReviewModal(false);
    fetchUserReviews(user, role);
  };

  // Подсчет статистики отзывов
  const reviewStats = {
    total: userReviews.length,
    approved: userReviews.filter(r => r.isApproved).length,
    pending: userReviews.filter(r => !r.isApproved).length,
    avgRating: userReviews.length > 0
      ? userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length
      : 0
  };

  if (loading) {
    return (
      <IonPage>
        <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-[#f1f5f9] to-[#ddd6fe] dark:from-[#1e293b] dark:to-[#312e81]">
          <IonSpinner name="crescent" className="text-[#6366f1] w-12 h-12" />
          <p className="mt-4 text-[#1e293b] dark:text-white font-montserrat">Загрузка профиля...</p>
        </div>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] shadow-lg">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <IonButton fill="clear" onClick={goToHome} className="text-white mr-2">
                <IonIcon icon={arrowBackOutline} className="text-xl" />
              </IonButton>
              <img src={newLogo} alt="BrightWaw Logo" className="h-12 mr-3" />              
            </div>
            <div className="flex items-center space-x-3">
              <IonButton fill="clear" onClick={toggleDarkMode} className="text-white">
                <IonIcon icon={isDarkMode ? sunnyOutline : moonOutline} className="text-xl" />
              </IonButton>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent className="bg-gradient-to-br from-[#f1f5f9] to-[#ddd6fe] dark:from-[#1e293b] dark:to-[#312e81]">
        <div className="flex flex-col items-center px-4 py-8">
          {/* Профиль пользователя */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-28 h-28">
              <div className="w-28 h-28 overflow-hidden rounded-full border-4 border-white dark:border-gray-700 shadow-lg">
                <img
                  src={avatar || user?.photoURL || 'https://via.placeholder.com/100'}
                  alt="Аватар профиля"
                  className="w-full h-full object-cover"
                />
              </div>
              <IonButton
                fill="clear"
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 bg-[#6366f1] rounded-full p-0 w-10 h-10 flex items-center justify-center shadow-md"
              >
                <IonIcon
                  icon={uploadingAvatar ? undefined : cameraOutline}
                  className="text-white"
                />
                {uploadingAvatar && <IonSpinner name="crescent" className="w-5 h-5 text-white" />}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </IonButton>
            </div>
            <h2 className="text-2xl font-montserrat font-bold text-[#1e293b] dark:text-white mt-4">
              {user?.displayName || 'Пользователь'}
            </h2>
            <p className="text-sm font-montserrat text-[#475569] dark:text-gray-300 mt-1">
              {user?.email || 'example@email.com'}
            </p>
            {uploadingAvatar && (
              <p className="text-xs font-montserrat text-[#6366f1] dark:text-[#818cf8] mt-2">
                Загрузка аватара...
              </p>
            )}
          </div>

          {/* Быстрая навигация */}
          <div className="w-full max-w-md mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4">
              <h3 className="text-lg font-montserrat font-bold text-[#1e293b] dark:text-white mb-4">
                Быстрая навигация
              </h3>
              <div className="flex space-x-3">
                <IonButton
                  onClick={goToHome}
                  expand="block"
                  fill="outline"
                  className="flex-1 rounded-xl text-sm font-montserrat h-12"
                >
                  <IonIcon icon={homeOutline} className="mr-2" />
                  Главная
                </IonButton>
                {role !== 'admin' && ( // Показываем Заказать только если не админ
                  <IonButton
                    onClick={goToOrder}
                    expand="block"
                    className="flex-1 custom-button rounded-xl text-sm font-montserrat h-12"
                  >
                    <IonIcon icon={cartOutline} className="mr-2" />
                    Заказать
                  </IonButton>
                )}
              </div>
            </div>
          </div>

          {/* Сегментированное управление */}
          <div className="w-full max-w-md mb-6">
            <IonSegment
              value={selectedSegment}
              onIonChange={(e) => setSelectedSegment(e.detail.value as string)}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl"
            >
              <IonSegmentButton value="info" className="font-montserrat">
                <IonLabel>Профиль</IonLabel>
              </IonSegmentButton>
              {role !== 'admin' && ( // Показываем вкладки Заказы и Отзывы только если не админ
                <>
                  <IonSegmentButton value="orders" className="font-montserrat">
                    <IonLabel>Заказы</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="reviews" className="font-montserrat">
                    <IonLabel>Отзывы ({userReviews.length})</IonLabel>
                  </IonSegmentButton>
                </>
              )}
            </IonSegment>
          </div>

          <div className="w-full max-w-md space-y-4">
            {/* Информация профиля */}
            {selectedSegment === 'info' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full">
                <h3 className="text-lg font-montserrat font-bold text-[#1e293b] dark:text-white mb-4">
                  Информация профиля
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-sm text-[#475569] dark:text-gray-400 font-montserrat">Роль</span>
                    <span className="text-[#1e293b] dark:text-white font-montserrat font-medium">
                      {role === 'client' ? 'Клиент' : (role === 'worker' ? 'Работник' : 'Администратор')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-sm text-[#475569] dark:text-gray-400 font-montserrat">Дата регистрации</span>
                    <span className="text-[#1e293b] dark:text-white font-montserrat font-medium">
                      {user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : '01.05.2025'}
                    </span>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <span className="text-sm text-[#475569] dark:text-gray-400 font-montserrat">Изменить пароль</span>
                    <div className="flex items-center">
                      <IonInput
                        value={newPassword}
                        onIonChange={(e) => setNewPassword(e.detail.value!)}
                        type="password"
                        placeholder="Новый пароль"
                        className="flex-1 bg-[#f8fafc] dark:bg-gray-700 rounded-xl py-2 px-4 text-[#1e293b] dark:text-white font-montserrat mr-2"
                      />
                      <IonButton
                        onClick={handlePasswordChange}
                        disabled={!newPassword || newPassword.length < 6}
                        className="custom-button rounded-xl shadow-md text-sm font-montserrat h-10"
                      >
                        Сменить
                      </IonButton>
                    </div>
                  </div>
                </div>

                {role === 'admin' && ( // Показываем кнопку админ-панели только админам
                  <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-center">
                    <IonIcon icon={shieldCheckmarkOutline} className="text-indigo-600 dark:text-indigo-400 text-3xl mb-3" />
                    <p className="text-base font-montserrat font-semibold text-indigo-700 dark:text-indigo-300 mb-4">
                      Вы вошли как Администратор
                    </p>
                    <IonButton
                      onClick={() => navigate('/admin')}
                      expand="block"
                      className="custom-button rounded-xl text-sm font-montserrat h-12"
                    >
                      Перейти в Админ-панель
                    </IonButton>
                  </div>
                )}
              </div>
            )}

            {/* Заказы */}
            {selectedSegment === 'orders' && role !== 'admin' && ( // Показываем Заказы только если не админ
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full">
                <h3 className="text-lg font-montserrat font-bold text-[#1e293b] dark:text-white mb-4">
                  Заказы
                </h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-montserrat font-semibold text-[#475569] dark:text-gray-400 mb-2">Текущий заказ</h4>
                    {currentOrder ? (
                      <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-3">
                        <div className="flex justify-between">
                          <span className="text-[#1e293b] dark:text-white font-montserrat">
                            {currentOrder.createdAt?.toLocaleDateString()}
                          </span>
                          <span className="text-[#6366f1] dark:text-[#818cf8] font-montserrat font-medium">
                            {currentOrder.price || '---'}
                          </span>
                        </div>
                        <div className="mt-1">
                          <span className="text-xs text-[#475569] dark:text-gray-400 font-montserrat">В процессе</span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
                        <span className="text-sm text-[#475569] dark:text-gray-400 font-montserrat">Нет текущих заказов</span>
                        <div className="mt-2">
                          <IonButton onClick={goToOrder} size="small" className="custom-button rounded-lg text-xs font-montserrat">
                            Сделать заказ
                          </IonButton>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-montserrat font-semibold text-[#475569] dark:text-gray-400 mb-2">Запланированный заказ</h4>
                    {pendingOrder ? (
                      <div className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-3">
                        <div className="flex justify-between">
                          <span className="text-[#1e293b] dark:text-white font-montserrat">
                            {pendingOrder.scheduledDate?.toLocaleDateString()}
                          </span>
                          <span className="text-[#6366f1] dark:text-[#818cf8] font-montserrat font-medium">
                            {pendingOrder.price || '---'}
                          </span>
                        </div>
                        <div className="mt-1">
                          <span className="text-xs text-[#475569] dark:text-gray-400 font-montserrat">Запланирован</span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
                        <span className="text-sm text-[#475569] dark:text-gray-400 font-montserrat">Нет запланированных заказов</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-montserrat font-semibold text-[#475569] dark:text-gray-400 mb-2">История заказов</h4>
                    {orders.length > 0 ? (
                      <div className="space-y-2">
                        {orders.map(order => (
                          <div key={order.id} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                            <div className="flex justify-between">
                              <span className="text-[#1e293b] dark:text-white font-montserrat">
                                {order.createdAt?.toLocaleDateString()}
                              </span>
                              <span className="text-[#6366f1] dark:text-[#818cf8] font-montserrat font-medium">
                                {order.price || '---'}
                              </span>
                            </div>
                            <div className="mt-1">
                              <span className="text-xs text-[#475569] dark:text-gray-400 font-montserrat">Завершен</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
                        <span className="text-sm text-[#475569] dark:text-gray-400 font-montserrat">Нет истории заказов</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Отзывы */}
            {selectedSegment === 'reviews' && role !== 'admin' && ( // Показываем Отзывы только если не админ
              <div className="space-y-4">
                {/* Статистика отзывов */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-montserrat font-bold text-[#1e293b] dark:text-white">
                      Мои отзывы
                    </h3>
                    <IonButton
                      onClick={() => setShowAddReviewModal(true)}
                      size="small"
                      className="custom-button rounded-lg text-xs font-montserrat"
                    >
                      <IonIcon icon={addOutline} className="mr-1" />
                      Добавить
                    </IonButton>
                  </div>

                  {/* Статистика */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-3 text-center">
                      <div className="text-lg font-montserrat font-bold text-indigo-600 dark:text-indigo-400">
                        {reviewStats.total}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-montserrat">
                        Всего отзывов
                      </div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-3 text-center">
                      <div className="flex items-center justify-center mb-1">
                        <IonIcon icon={star} className="text-yellow-400 mr-1" />
                        <span className="text-lg font-montserrat font-bold text-green-600 dark:text-green-400">
                          {reviewStats.avgRating.toFixed(1)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-montserrat">
                        Средний рейтинг
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3 text-center">
                      <div className="text-lg font-montserrat font-bold text-blue-600 dark:text-blue-400">
                        {reviewStats.approved}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-montserrat">
                        Опубликовано
                      </div>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-xl p-3 text-center">
                      <div className="text-lg font-montserrat font-bold text-yellow-600 dark:text-yellow-400">
                        {reviewStats.pending}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-montserrat">
                        На модерации
                      </div>
                    </div>
                  </div>
                </div>

                {/* Список отзывов */}
                {loadingReviews ? (
                  <div className="flex justify-center py-8">
                    <IonSpinner name="crescent" className="text-indigo-600" />
                  </div>
                ) : userReviews.length > 0 ? (
                  <div className="space-y-3">
                    {userReviews.map((review) => (
                      <ReviewCard
                        key={review.id}
                        review={review}
                        compact={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 text-center">
                    <IonIcon icon={chatbubblesOutline} className="text-4xl text-gray-400 mb-3" />
                    <h4 className="text-lg font-montserrat font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      У вас пока нет отзывов
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-500 font-montserrat mb-4">
                      Поделитесь своим опытом с другими клиентами
                    </p>
                    <IonButton
                      onClick={() => setShowAddReviewModal(true)}
                      className="custom-button rounded-xl text-sm font-montserrat"
                    >
                      <IonIcon icon={addOutline} className="mr-2" />
                      Оставить первый отзыв
                    </IonButton>
                  </div>
                )}
              </div>
            )}

            {/* Кнопка выхода */}
            <IonButton
              onClick={handleLogout}
              expand="block"
              fill="outline"
              // Убраны классы, которые делали кнопку красной
              className="rounded-xl shadow-lg text-base font-montserrat h-14 w-full"
            >
              <IonIcon icon={logOutOutline} className="mr-2" /> Выйти
            </IonButton>
          </div>
        </div>
      </IonContent>

      {/* Индикатор загрузки аватара */}
      <IonLoading
        isOpen={uploadingAvatar}
        message="Загрузка аватара..."
      />

      {/* Alert для уведомлений */}
      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header="Уведомление"
        message={alertMessage}
        buttons={['OK']}
      />

      {/* Модальное окно добавления отзыва */}
      <IonModal isOpen={showAddReviewModal} onDidDismiss={() => setShowAddReviewModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonLabel slot="start" className="ml-4 font-montserrat font-bold">Новый отзыв</IonLabel>
            <IonButton
              slot="end"
              fill="clear"
              onClick={() => setShowAddReviewModal(false)}
              className="mr-2"
            >
              Закрыть
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent className="p-4">
          <AddReviewForm
            onReviewAdded={handleReviewAdded}
            onCancel={() => setShowAddReviewModal(false)}
          />
        </IonContent>
      </IonModal>

      <IonFooter>
        <IonTabBar slot="bottom" className="bg-white dark:bg-gray-800 shadow-md">
          <IonTabButton onClick={goToHome}>
            <IonIcon icon={homeOutline} className="text-2xl" />
            <IonLabel className="text-xs font-montserrat">Главная</IonLabel>
          </IonTabButton>
          {role !== 'admin' ? ( // Если не админ, показываем вкладку "Заказы"
            <IonTabButton onClick={goToOrder}>
              <IonIcon icon={calendarOutline} className="text-2xl" />
              <IonLabel className="text-xs font-montserrat">Заказы</IonLabel>
            </IonTabButton>
          ) : ( // Если админ, показываем вкладку "Админ"
            <IonTabButton onClick={() => navigate('/admin')}>
              <IonIcon icon={shieldCheckmarkOutline} className="text-2xl" />
              <IonLabel className="text-xs font-montserrat">Админ</IonLabel>
            </IonTabButton>
          )}
          <IonTabButton onClick={goToChat}>
            <IonIcon icon={chatbubbleOutline} className="text-2xl" />
            <IonLabel className="text-xs font-montserrat">Чат</IonLabel>
          </IonTabButton>
          <IonTabButton>
            <IonIcon icon={personOutline} className="text-2xl text-[#6366f1] dark:text-[#818cf8]" />
            <IonLabel className="text-xs font-montserrat text-[#6366f1] dark:text-[#818cf8]">Профиль</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonFooter>
    </IonPage>
  );
};

export default ProfilePage;