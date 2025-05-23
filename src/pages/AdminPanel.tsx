// pages/AdminPanel.tsx - ОБНОВЛЕННАЯ ГЛАВНАЯ АДМИН-ПАНЕЛЬ
import React, { useState, useEffect } from 'react';
import {
  IonButton,
  IonHeader,
  IonToolbar,
  IonIcon,
  IonCard,
  IonCardContent,
  IonContent,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonBadge
} from '@ionic/react';
import { auth, onAuthStateChanged } from '../services/firebase';
import { getCalendarStats } from '../services/calendarService';
import { 
  chevronBackOutline, 
  calendarOutline, 
  sunnyOutline,
  moonOutline,
  peopleOutline,
  chatbubbleOutline,
  statsChartOutline,
  settingsOutline,
  timeOutline,
  documentTextOutline,
  checkmarkCircleOutline,
  warningOutline,
  arrowForwardOutline
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';

const adminEmails = ['plenkanet@gmail.com'];

interface AdminStats {
  calendar: {
    totalDates: number;
    availableDates: number;
    reservedDates: number;
    expiredDates: number;
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
  reviews: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    calendar: {
      totalDates: 0,
      availableDates: 0,
      reservedDates: 0,
      expiredDates: 0
    },
    orders: {
      total: 0,
      pending: 0,
      completed: 0,
      cancelled: 0
    },
    reviews: {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    }
  });

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    }

    const unsub = onAuthStateChanged(auth, user => {
      if (!user || !adminEmails.includes(user.email || '')) {
        navigate('/');
      } else {
        loadStats();
      }
      setLoading(false);
    });
    
    return () => unsub();
  }, [navigate]);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Загружаем статистику календаря
      const calendarStats = await getCalendarStats();
      
      // TODO: Добавить загрузку статистики заказов и отзывов
      // const ordersStats = await getOrdersStats();
      // const reviewsStats = await getReviewsStats();
      
      setStats(prev => ({
        ...prev,
        calendar: calendarStats,
        // orders: ordersStats,
        // reviews: reviewsStats
      }));
      
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const goBack = () => navigate('/');

  const adminMenuItems = [
  {
    title: 'Управление календарем',
    description: 'Добавление и удаление доступных дат',
    icon: calendarOutline,
    path: '/admin/calendar',
    color: 'bg-blue-500',
    stats: `${stats.calendar.availableDates} доступно`
  },
  {
    title: 'Заказы',
    description: 'Просмотр и управление заказами',
    icon: documentTextOutline,
    path: '/admin/orders',
    color: 'bg-green-500',
    stats: `${stats.orders.pending} ожидают`
  },
  {
    title: 'Отзывы',
    description: 'Модерация отзывов клиентов',
    icon: chatbubbleOutline,
    path: '/admin/reviews',
    color: 'bg-purple-500',
    stats: `${stats.reviews.pending} на модерации`
  },
  {
    title: 'Пользователи',
    description: 'Управление пользователями',
    icon: peopleOutline,
    path: '/admin/users',
    color: 'bg-orange-500',
    stats: 'Скоро'
  },
  {
    title: 'Статистика',
    description: 'Аналитика и отчеты',
    icon: statsChartOutline,
    path: '/admin/stats',
    color: 'bg-pink-500',
    stats: 'Скоро'
  },
  {
    title: 'Настройки',
    description: 'Конфигурация системы',
    icon: settingsOutline,
    path: '/admin/settings',
    color: 'bg-gray-500',
    stats: 'Скоро'
  }
];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-[#f1f5f9] to-[#ddd6fe] dark:from-[#1e293b] dark:to-[#312e81]">
        <IonSpinner name="crescent" className="text-[#6366f1] w-12 h-12" />
        <p className="mt-4 text-[#1e293b] dark:text-white font-montserrat">Загрузка панели администратора...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <IonHeader>
        <IonToolbar className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] shadow-lg">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <IonButton fill="clear" onClick={goBack} className="text-white mr-2 p-0">
                <IonIcon icon={chevronBackOutline} className="text-xl" />
              </IonButton>
              <span className="text-white font-montserrat text-xl font-bold tracking-tight">
                Панель администратора
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <IonButton fill="clear" onClick={toggleDarkMode} className="text-white">
                <IonIcon icon={isDarkMode ? sunnyOutline : moonOutline} className="text-xl" />
              </IonButton>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Панель статистики */}
        <IonCard className="rounded-xl overflow-hidden shadow-lg mb-6">
          <IonCardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-montserrat font-bold text-[#1e293b] dark:text-gray-200">
                Обзор системы
              </h2>
              <IonButton 
                fill="outline" 
                size="small"
                onClick={loadStats}
                className="rounded-lg"
              >
                Обновить
              </IonButton>
            </div>
            
            <IonGrid>
              <IonRow>
                <IonCol size="6">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-xl">
                    <div className="flex items-center justify-center mb-2">
                      <IonIcon icon={checkmarkCircleOutline} className="text-green-600 dark:text-green-400 text-2xl mr-2" />
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {stats.calendar.availableDates}
                      </span>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300 font-montserrat">
                      Доступные даты
                    </p>
                  </div>
                </IonCol>
                <IonCol size="6">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                    <div className="flex items-center justify-center mb-2">
                      <IonIcon icon={timeOutline} className="text-blue-600 dark:text-blue-400 text-2xl mr-2" />
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {stats.calendar.reservedDates}
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-montserrat">
                      Забронировано
                    </p>
                  </div>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol size="6">
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                    <div className="flex items-center justify-center mb-2">
                      <IonIcon icon={documentTextOutline} className="text-purple-600 dark:text-purple-400 text-2xl mr-2" />
                      <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {stats.orders.pending}
                      </span>
                    </div>
                    <p className="text-sm text-purple-700 dark:text-purple-300 font-montserrat">
                      Новые заказы
                    </p>
                  </div>
                </IonCol>
                <IonCol size="6">
                  <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
                    <div className="flex items-center justify-center mb-2">
                      <IonIcon icon={warningOutline} className="text-orange-600 dark:text-orange-400 text-2xl mr-2" />
                      <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {stats.calendar.expiredDates}
                      </span>
                    </div>
                    <p className="text-sm text-orange-700 dark:text-orange-300 font-montserrat">
                      Просроченных дат
                    </p>
                  </div>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>

        {/* Меню администратора */}
        <div className="space-y-4">
          <h3 className="text-xl font-montserrat font-bold text-[#1e293b] dark:text-gray-200 mb-4">
            Управление
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            {adminMenuItems.map((item, index) => (
              <IonCard 
                key={index}
                button
                onClick={() => navigate(item.path)}
                className="rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              >
                <IonCardContent className="p-0">
                  <div className="flex items-center p-4">
                    <div className={`${item.color} rounded-xl h-14 w-14 flex items-center justify-center mr-4 shadow-md`}>
                      <IonIcon icon={item.icon} className="text-white text-2xl" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-montserrat font-semibold text-[#1e293b] dark:text-gray-200 mb-1">
                        {item.title}
                      </h4>
                      <p className="text-sm text-[#475569] dark:text-gray-400 font-montserrat mb-2">
                        {item.description}
                      </p>
                      {item.stats && (
                        <IonChip className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                          {item.stats}
                        </IonChip>
                      )}
                    </div>
                    <IonIcon icon={arrowForwardOutline} className="text-[#6366f1] dark:text-[#818cf8] text-xl" />
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        </div>

        {/* Быстрые действия */}
        <IonCard className="rounded-xl overflow-hidden shadow-lg mt-6">
          <IonCardContent className="p-6">
            <h3 className="text-xl font-montserrat font-bold text-[#1e293b] dark:text-gray-200 mb-4">
              Быстрые действия
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <IonButton 
                onClick={() => navigate('/admin/calendar')}
                expand="block"
                fill="outline"
                className="rounded-xl font-montserrat h-12"
              >
                <IonIcon icon={calendarOutline} slot="start" />
                Календарь
              </IonButton>
              
              <IonButton 
                onClick={() => navigate('/admin/reviews')}
                expand="block"
                fill="outline"
                className="rounded-xl font-montserrat h-12"
              >
                <IonIcon icon={chatbubbleOutline} slot="start" />
                Отзывы
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Информационная панель */}
        <IonCard className="rounded-xl overflow-hidden shadow-lg mt-6">
          <IonCardContent className="p-6">
            <h3 className="text-xl font-montserrat font-bold text-[#1e293b] dark:text-gray-200 mb-4">
              Системная информация
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-sm font-montserrat text-[#475569] dark:text-gray-400">
                  Версия системы
                </span>
                <IonBadge color="primary">v2.0.0</IonBadge>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-sm font-montserrat text-[#475569] dark:text-gray-400">
                  Последнее обновление
                </span>
                <span className="text-sm font-montserrat text-[#1e293b] dark:text-gray-200">
                  {new Date().toLocaleDateString('ru-RU')}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-sm font-montserrat text-[#475569] dark:text-gray-400">
                  Статус
                </span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm font-montserrat text-green-600 dark:text-green-400">
                    Работает
                  </span>
                </div>
              </div>
            </div>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </div>
  );
};

export default AdminPanel;