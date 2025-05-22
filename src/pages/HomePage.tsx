import React, { useState, useEffect } from 'react';
import { 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonToolbar, 
  IonButton, 
  IonIcon, 
  IonFooter, 
  IonTabBar, 
  IonTabButton, 
  IonLabel,
  IonSearchbar,
  IonCard,
  IonCardContent
} from '@ionic/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  homeOutline, 
  personOutline, 
  calendarOutline, 
  moonOutline, 
  sunnyOutline,
  cubeOutline,
  appsOutline, 
  layersOutline, 
  chatbubbleOutline, 
  notificationsOutline 
} from 'ionicons/icons';
import { auth } from '../services/firebase';
import newLogo from '../assets/new-logo.png';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Проверяем авторизацию
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
    });

    return () => unsubscribe();
  }, []);

  const goToOrder = (tab: string) => {
    // Сохраняем маршрут для перенаправления после авторизации
    if (!isAuthenticated) {
      sessionStorage.setItem('redirectAfterLogin', `/order?tab=${tab}`);
      navigate('/login');
    } else {
      navigate(`/order?tab=${tab}`);
    }
  };
  
  const goToLogin = () => {
    // Сохраняем текущий путь для перенаправления после авторизации
    sessionStorage.setItem('redirectAfterLogin', location.pathname);
    navigate('/login');
  };
  
  const goToProfile = () => {
    if (!isAuthenticated) {
      sessionStorage.setItem('redirectAfterLogin', '/profile');
      navigate('/login');
    } else {
      navigate('/profile');
    }
  };
  
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const services = [
    { name: 'Мебель', icon: cubeOutline, color: 'bg-indigo-100 dark:bg-indigo-900', tab: 'furniture' },
    { name: 'Ковры', icon: appsOutline, color: 'bg-purple-100 dark:bg-purple-900', tab: 'carpet' },
    { name: 'Матрасы', icon: layersOutline, color: 'bg-blue-100 dark:bg-blue-900', tab: 'mattress' }
  ];

  const popularServices = [
    { 
      name: 'Чистка дивана', 
      price: 'от 2900zł', 
      time: '~1.5 часа',
      color: 'bg-purple-100 dark:bg-purple-900',
      icon: cubeOutline
    },
    { 
      name: 'Чистка ковра', 
      price: 'от 1800zł', 
      time: '~1 час',
      color: 'bg-blue-100 dark:bg-blue-900',
      icon: appsOutline
    }
  ];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <img src={newLogo} alt="BrightWaw Logo" className="h-8 mr-2" />
              <span className="text-indigo-600 dark:text-indigo-400 font-montserrat text-xl font-bold tracking-tight">BrightWaw</span>
            </div>
            <div className="flex items-center space-x-2">
              <IonButton fill="clear" onClick={toggleDarkMode} className="text-indigo-600 dark:text-indigo-400">
                <IonIcon icon={isDarkMode ? sunnyOutline : moonOutline} className="text-xl" />
              </IonButton>
              <IonButton onClick={goToProfile} fill="clear" className="text-indigo-600 dark:text-indigo-400">
                <IonIcon icon={personOutline} className="text-xl" />
              </IonButton>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col px-4 py-6">
          {/* Welcome Section */}
          <div className="mb-6">
            <h1 className="text-2xl font-montserrat font-bold text-gray-800 dark:text-gray-100 mb-1">
              Привет, {isAuthenticated ? 'Клиент' : 'Гость'}! 👋
            </h1>
            <p className="text-sm font-montserrat text-gray-500 dark:text-gray-400">
              Что нужно почистить сегодня?
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <IonSearchbar 
              placeholder="Найти услугу" 
              className="rounded-xl shadow-sm bg-white dark:bg-gray-800 ion-searchbar-custom"
              animated={true}
            />
          </div>

          {/* Services Cards */}
          <div className="mb-8">
            <h2 className="text-lg font-montserrat font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Услуги
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {services.map((service, index) => (
                <div key={index} onClick={() => goToOrder(service.tab)} className="cursor-pointer">
                  <div className={`${service.color} rounded-xl shadow-sm p-4 flex flex-col items-center justify-center h-24 transition-all duration-300 hover:shadow-md`}>
                    <IonIcon icon={service.icon} className="text-indigo-600 dark:text-indigo-400 text-2xl mb-2" />
                    <span className="text-xs font-montserrat font-medium text-gray-700 dark:text-gray-200 text-center">
                      {service.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Services */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-montserrat font-semibold text-gray-800 dark:text-gray-200">
                Популярные услуги
              </h2>
              <span className="text-xs font-montserrat text-indigo-600 dark:text-indigo-400 font-medium">
                Все услуги
              </span>
            </div>
            
            <div className="space-y-3">
              {popularServices.map((service, index) => (
                <IonCard key={index} onClick={() => goToOrder('furniture')} className="m-0 rounded-xl overflow-hidden shadow-sm cursor-pointer">
                  <IonCardContent className="p-0">
                    <div className="flex items-center p-4">
                      <div className={`${service.color} rounded-lg h-16 w-16 flex items-center justify-center mr-4`}>
                        <IonIcon icon={service.icon} className="text-indigo-600 dark:text-indigo-400 text-2xl" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-montserrat font-semibold text-gray-800 dark:text-gray-200 mb-1">
                          {service.name}
                        </h3>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-montserrat text-gray-500 dark:text-gray-400">
                            {service.time}
                          </span>
                          <span className="text-sm font-montserrat font-medium text-indigo-600 dark:text-indigo-400">
                            {service.price}
                          </span>
                        </div>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              ))}
            </div>
          </div>

          {/* Book Now Button */}
          <div className="text-center mb-8">
            <IonButton onClick={() => goToOrder('furniture')} expand="block" className="custom-button rounded-xl shadow-md text-base font-montserrat h-12">
              Заказать сейчас
            </IonButton>
          </div>

          {/* Login Prompt (only for guests) */}
          {!isAuthenticated && (
            <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-4 mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-montserrat font-semibold text-gray-800 dark:text-gray-200 mb-1">
                    Еще не с нами?
                  </h3>
                  <p className="text-xs font-montserrat text-gray-500 dark:text-gray-400">
                    Создайте аккаунт для скидок и бонусов
                  </p>
                </div>
                <IonButton onClick={goToLogin} fill="solid" size="small" className="custom-button rounded-lg text-xs font-montserrat">
                  Войти
                </IonButton>
              </div>
            </div>
          )}
        </div>
      </IonContent>

      {/* Bottom Navigation */}
      <IonFooter>
        <IonTabBar slot="bottom" className="bg-white dark:bg-gray-800 shadow-lg">
          <IonTabButton tab="home" className="text-indigo-600 dark:text-indigo-400">
            <IonIcon icon={homeOutline} className="text-xl" />
            <IonLabel className="text-xs font-montserrat">Главная</IonLabel>
          </IonTabButton>
          <IonTabButton tab="bookings" onClick={() => goToOrder('furniture')} className="text-gray-500 dark:text-gray-400">
            <IonIcon icon={calendarOutline} className="text-xl" />
            <IonLabel className="text-xs font-montserrat">Заказы</IonLabel>
          </IonTabButton>
          <IonTabButton tab="chat" className="text-gray-500 dark:text-gray-400">
            <IonIcon icon={chatbubbleOutline} className="text-xl" />
            <IonLabel className="text-xs font-montserrat">Чат</IonLabel>
          </IonTabButton>
          <IonTabButton tab="notifications" className="text-gray-500 dark:text-gray-400">
            <IonIcon icon={notificationsOutline} className="text-xl" />
            <IonLabel className="text-xs font-montserrat">Уведомления</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonFooter>
    </IonPage>
  );
};

export default HomePage;