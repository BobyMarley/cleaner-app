import React, { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonToolbar, IonButton, IonIcon, IonItem, IonLabel, IonFooter, IonTabBar, IonTabButton, IonImg, IonInput, IonSpinner } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { homeOutline, personOutline, cartOutline, sunnyOutline, moonOutline, logOutOutline, cameraOutline, calendarOutline, chatbubbleOutline, notificationsOutline } from 'ionicons/icons';
import newLogo from '../assets/new-logo.png';
import { auth } from '../services/firebase';
import { updatePassword } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, orderBy } from 'firebase/firestore';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [role, setRole] = useState<'client' | 'worker'>('client');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [orders, setOrders] = useState<any[]>([]);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const user = auth.currentUser;
  const db = getFirestore();

  useEffect(() => {
    // Проверяем авторизацию
    const checkAuth = () => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (!user) {
          navigate('/login');
        } else {
          setLoading(false);
          fetchOrders();
        }
      });

      return () => unsubscribe();
    };

    checkAuth();
  }, [navigate]);

  const fetchOrders = async () => {
    if (user) {
      try {
        const ordersQuery = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersList = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const history: any[] = [];
        let current: any = null;
        let pending: any = null;

        ordersList.forEach(order => {
          const orderDate = new Date(order.createdAt);
          const scheduledDate = order.scheduledDate ? new Date(order.scheduledDate) : null;
          const today = new Date();

          if (scheduledDate && scheduledDate > today) {
            pending = order;
          } else if (orderDate.toDateString() === today.toDateString()) {
            current = order;
          } else {
            history.push(order);
          }
        });

        setOrders(history);
        setCurrentOrder(current);
        setPendingOrder(pending);
        setRole(user.displayName?.includes('worker') ? 'worker' : 'client');
      } catch (error) {
        console.error('Ошибка при получении заказов:', error);
      }
    }
  };

  const goToHome = () => navigate('/');
  const goToOrder = () => navigate('/order');
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = () => {
    auth.signOut().then(() => navigate('/login'));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = () => {
    if (user && newPassword) {
      updatePassword(user, newPassword)
        .then(() => alert('Пароль успешно изменен'))
        .catch((error) => alert('Ошибка при изменении пароля: ' + error.message));
    }
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
              <img src={newLogo} alt="BrightWaw Logo" className="h-9 mr-3" />
              <span className="text-white font-montserrat text-xl font-bold tracking-tight">BrightWaw</span>
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
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-28 h-28">
              <div className="w-28 h-28 overflow-hidden rounded-full border-4 border-white dark:border-gray-700 shadow-lg">
                <img 
                  src={avatar || user?.photoURL || 'https://via.placeholder.com/100'} 
                  alt="Аватар профиля" 
                  className="w-full h-full object-cover"
                />
              </div>
              <IonButton fill="clear" className="absolute bottom-0 right-0 bg-[#6366f1] rounded-full p-0 w-10 h-10 flex items-center justify-center shadow-md">
                <IonIcon icon={cameraOutline} className="text-white" />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="absolute inset-0 opacity-0" />
              </IonButton>
            </div>
            <h2 className="text-2xl font-montserrat font-bold text-[#1e293b] dark:text-white mt-4">
              {user?.displayName || 'Пользователь'}
            </h2>
            <p className="text-sm font-montserrat text-[#475569] dark:text-gray-300 mt-1">
              {user?.email || 'example@email.com'}
            </p>
          </div>

          <div className="w-full max-w-md space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full">
              <h3 className="text-lg font-montserrat font-bold text-[#1e293b] dark:text-white mb-4">
                Информация профиля
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-[#475569] dark:text-gray-400 font-montserrat">Роль</span>
                  <span className="text-[#1e293b] dark:text-white font-montserrat font-medium">
                    {role === 'client' ? 'Клиент' : 'Работник'}
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
                      className="custom-button rounded-xl shadow-md text-sm font-montserrat h-10"
                    >
                      Сменить
                    </IonButton>
                  </div>
                </div>
              </div>
            </div>
            
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
                          {new Date(currentOrder.createdAt).toLocaleDateString()}
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
                    </div>
                  )}
                </div>
                
                <div>
                  <h4 className="text-sm font-montserrat font-semibold text-[#475569] dark:text-gray-400 mb-2">Запланированный заказ</h4>
                  {pendingOrder ? (
                    <div className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-3">
                      <div className="flex justify-between">
                        <span className="text-[#1e293b] dark:text-white font-montserrat">
                          {new Date(pendingOrder.scheduledDate).toLocaleDateString()}
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
                              {new Date(order.createdAt).toLocaleDateString()}
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
            
            <IonButton 
              onClick={handleLogout} 
              expand="block" 
              className="custom-button rounded-xl shadow-lg text-base font-montserrat h-14 w-full"
            >
              <IonIcon icon={logOutOutline} className="mr-2" /> Выйти
            </IonButton>
          </div>
        </div>
      </IonContent>
      <IonFooter>
        <IonTabBar slot="bottom" className="bg-white dark:bg-gray-800 shadow-md">
          <IonTabButton tab="home" onClick={goToHome} className="text-[#6366f1] dark:text-[#818cf8]">
            <IonIcon icon={homeOutline} className="text-2xl" />
            <IonLabel className="text-xs font-montserrat">Главная</IonLabel>
          </IonTabButton>
          <IonTabButton tab="bookings" onClick={goToOrder} className="text-[#6366f1] dark:text-[#818cf8]">
            <IonIcon icon={calendarOutline} className="text-2xl" />
            <IonLabel className="text-xs font-montserrat">Заказы</IonLabel>
          </IonTabButton>
          <IonTabButton tab="chat" className="text-[#6366f1] dark:text-[#818cf8]">
            <IonIcon icon={chatbubbleOutline} className="text-2xl" />
            <IonLabel className="text-xs font-montserrat">Чат</IonLabel>
          </IonTabButton>
          <IonTabButton tab="profile" className="text-[#6366f1] dark:text-[#818cf8]">
            <IonIcon icon={personOutline} className="text-2xl" />
            <IonLabel className="text-xs font-montserrat">Профиль</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonFooter>
    </IonPage>
  );
};

export default ProfilePage;