// OrderForm.tsx - ОБНОВЛЕННАЯ ВЕРСИЯ С ПРОДАКШН КАЛЕНДАРЕМ
import React, { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { 
  IonButton, 
  IonInput, 
  IonItem, 
  IonLabel, 
  IonTextarea, 
  IonCheckbox, 
  IonIcon,
  IonCard,
  IonCardContent,
  IonChip,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonSpinner,
  IonAlert,
  IonFooter,
  IonTabBar,
  IonTabButton,
  IonContent
} from '@ionic/react';
import { addOrder, auth } from '../services/firebase';
import { sendOrderToTelegram } from '../services/telegram';
import { reserveDate } from '../services/calendarService';
import UserCalendar from '../components/UserCalendar'; // Новый компонент
import { 
  addCircleOutline, 
  removeCircleOutline, 
  bedOutline, 
  chevronBackOutline,
  documentTextOutline, 
  imageOutline, 
  sunnyOutline, 
  moonOutline,
  checkmarkCircleOutline,
  timeOutline,
  cashOutline,
  homeOutline,
  cubeOutline,
  gridOutline,
  personOutline,
  lockClosedOutline,
  calendarOutline,
  chatbubbleOutline
} from 'ionicons/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const OrderForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Основные состояния формы
  const [carpetArea, setCarpetArea] = useState<string>('');
  const [chairCount, setChairCount] = useState<number>(0);
  const [armchairCount, setArmchairCount] = useState<number>(0);
  const [sofaCount, setSofaCount] = useState<number>(0);
  const [mattressCount, setMattressCount] = useState<number>(0);
  const [withPillows, setWithPillows] = useState<boolean>(false);
  const [additionalInfo, setAdditionalInfo] = useState<string>('');
  const [images, setImages] = useState<File[]>([]);
  const [scheduledDate, setScheduledDate] = useState<string>('');
  
  // UI состояния
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('furniture');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showAuthAlert, setShowAuthAlert] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    // Проверка авторизации
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      setLoading(false);
    });

    // Установка активной вкладки из URL
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['furniture', 'carpet', 'mattress', 'additional'].includes(tab)) {
      setActiveTab(tab);
    }

    // Проверка темной темы
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    }

    return () => unsubscribe();
  }, [location]);

  const goToHome = () => navigate('/');
  const goToLogin = () => navigate('/login');
  const goToProfile = () => navigate('/profile');

  // Обработка отправки формы
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setShowAuthAlert(true);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setShowAuthAlert(true);
      return;
    }

    // Проверяем что выбран хотя бы один элемент для чистки
    const hasItems = carpetArea || chairCount > 0 || armchairCount > 0 || sofaCount > 0 || mattressCount > 0;
    if (!hasItems) {
      window.alert('Пожалуйста, выберите хотя бы один элемент для чистки');
      return;
    }

    setSubmitting(true);

    try {
      // Создаем объект заказа
      const order: any = {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || 'Не указано',
        carpetArea: carpetArea || '',
        chairCount: chairCount || 0,
        armchairCount: armchairCount || 0,
        sofaCount: sofaCount || 0,
        mattressCount: mattressCount || 0,
        withPillows: withPillows || false,
        additionalInfo: additionalInfo || '',
        images: images ? images.map(file => file.name) : [],
        price: calculatePrice(),
        estimatedTime: calculateTime(),
        status: 'pending'
      };

      // Добавляем дату если выбрана
      if (scheduledDate) {
        order.scheduledDate = scheduledDate;
      }

      console.log('Создаем заказ:', order);
      
      // Сохраняем заказ в Firebase
      const orderId = await addOrder(order);
      console.log('Заказ создан с ID:', orderId);
      
      // Резервируем дату если выбрана
      if (scheduledDate) {
        try {
          await reserveDate(scheduledDate, user.uid);
          console.log('Дата зарезервирована:', scheduledDate);
        } catch (dateError) {
          console.error('Ошибка при резервировании даты:', dateError);
          // Продолжаем выполнение, показываем предупреждение
          window.alert('Заказ создан, но возникла проблема с резервированием даты. Мы свяжемся с вами для подтверждения времени.');
        }
      }
      
      // Отправляем в Telegram
      try {
        const orderWithId = { ...order, id: orderId };
        await sendOrderToTelegram(orderWithId);
        console.log('Заказ отправлен в Telegram');
      } catch (telegramError) {
        console.error('Ошибка при отправке в Telegram:', telegramError);
        // Продолжаем выполнение
      }
      
      // Показываем успешное сообщение
      const successMessage = scheduledDate 
        ? `Заказ успешно создан! ${scheduledDate ? `Дата и время: ${new Date(scheduledDate).toLocaleString('ru-RU')}` : ''}`
        : 'Заказ успешно создан! Мы свяжемся с вами для согласования времени.';
      
      window.alert(successMessage);
      navigate('/profile'); // Перенаправляем в профиль для просмотра заказов
      
    } catch (error) {
      console.error('Ошибка при создании заказа:', error);
      window.alert('Произошла ошибка при создании заказа. Пожалуйста, попробуйте еще раз.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages([...e.target.files]);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const calculatePrice = () => {
    let total = 0;
    total += sofaCount * 2900;
    total += sofaCount * (withPillows ? 500 : 0);
    total += armchairCount * 1200;
    total += chairCount * 700;
    total += mattressCount * 1500;
    total += parseFloat(carpetArea || '0') * 600;
    return total === 0 ? '---' : `${total}zł`;
  };

  const calculateTime = () => {
    let hours = 0;
    hours += sofaCount * 1.5;
    hours += armchairCount * 0.75;
    hours += chairCount * 0.5;
    hours += mattressCount * 1.0;
    hours += parseFloat(carpetArea || '0') * 0.3;

    if (hours === 0) return '---';

    const fullHours = Math.floor(hours);
    const minutes = Math.round((hours - fullHours) * 60);

    if (fullHours === 0) {
      return `${minutes} мин`;
    } else if (minutes === 0) {
      return `${fullHours} ч`;
    } else {
      return `${fullHours} ч ${minutes} мин`;
    }
  };

  const handleDateSelect = (dateTime: string) => {
    setScheduledDate(dateTime);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-[#f1f5f9] to-[#ddd6fe] dark:from-[#1e293b] dark:to-[#312e81]">
        <IonSpinner name="crescent" className="text-[#6366f1] w-12 h-12" />
        <p className="mt-4 text-[#1e293b] dark:text-white font-montserrat">Загрузка...</p>
      </div>
    );
  }

  // Экран для неавторизованных пользователей
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#f1f5f9] to-[#ddd6fe] dark:from-[#1e293b] dark:to-[#312e81] px-6 py-8">
        <div className="w-24 h-24 mb-6 bg-[#6366f1] rounded-full flex items-center justify-center shadow-lg">
          <IonIcon icon={lockClosedOutline} className="text-white text-4xl" />
        </div>
        
        <h2 className="text-2xl font-montserrat font-bold text-[#1e293b] dark:text-white mb-4 text-center">
          Требуется авторизация
        </h2>
        
        <p className="text-center text-[#475569] dark:text-gray-300 font-montserrat mb-8 max-w-md">
          Для создания заказа необходимо войти в систему или зарегистрироваться
        </p>
        
        <div className="flex flex-col w-full max-w-xs space-y-4">
          <IonButton 
            onClick={goToLogin} 
            expand="block" 
            className="custom-button rounded-xl shadow-lg text-base font-montserrat h-14 w-full"
          >
            <IonIcon icon={personOutline} className="mr-2" />
            Войти
          </IonButton>
          
          <IonButton 
            onClick={goToHome} 
            fill="outline" 
            expand="block" 
            className="rounded-xl shadow-md text-base font-montserrat h-14 w-full"
          >
            <IonIcon icon={homeOutline} className="mr-2" />
            На главную
          </IonButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Alert для неавторизованных */}
      <IonAlert
        isOpen={showAuthAlert}
        onDidDismiss={() => setShowAuthAlert(false)}
        header="Требуется авторизация"
        message="Для создания заказа необходимо войти в систему"
        buttons={[
          {
            text: 'Отмена',
            role: 'cancel',
          },
          {
            text: 'Войти',
            handler: () => {
              navigate('/login');
            },
          },
        ]}
      />

      {/* Header */}
      <IonHeader>
        <IonToolbar className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] shadow-lg">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <IonButton fill="clear" onClick={goToHome} className="text-white mr-2 p-0">
                <IonIcon icon={chevronBackOutline} className="text-xl" />
              </IonButton>
              <span className="text-white font-montserrat text-xl font-bold tracking-tight">Новый заказ</span>
            </div>
            <div className="flex items-center space-x-3">
              <IonButton fill="clear" onClick={toggleDarkMode} className="text-white">
                <IonIcon icon={isDarkMode ? sunnyOutline : moonOutline} className="text-xl" />
              </IonButton>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      {/* Сводка заказа */}
      <IonCard className="mx-4 my-4 rounded-xl overflow-hidden shadow-lg">
        <IonCardContent className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-montserrat font-semibold text-lg text-[#1e293b] dark:text-gray-200">
              Сводка заказа
            </h3>
            <IonChip className="font-montserrat bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              <IonIcon icon={checkmarkCircleOutline} className="mr-1" />
              Готов к отправке
            </IonChip>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-2">
            <div className="flex items-center p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
              <IonIcon icon={timeOutline} className="text-[#6366f1] dark:text-[#818cf8] text-xl mr-2" />
              <div>
                <p className="text-xs text-[#475569] dark:text-gray-400 font-montserrat">Время</p>
                <p className="text-sm font-medium text-[#1e293b] dark:text-gray-200 font-montserrat">{calculateTime()}</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
              <IonIcon icon={cashOutline} className="text-[#6366f1] dark:text-[#818cf8] text-xl mr-2" />
              <div>
                <p className="text-xs text-[#475569] dark:text-gray-400 font-montserrat">Стоимость</p>
                <p className="text-sm font-medium text-[#1e293b] dark:text-gray-200 font-montserrat">{calculatePrice()}</p>
              </div>
            </div>
          </div>
        </IonCardContent>
      </IonCard>

      {/* Навигация по вкладкам */}
      <div className="flex flex-wrap px-4 mb-4">
        {[
          { key: 'furniture', label: 'Мебель' },
          { key: 'carpet', label: 'Ковры' },
          { key: 'mattress', label: 'Матрасы' },
          { key: 'additional', label: 'Дополнительно' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full mr-1.5 mb-1.5 font-montserrat font-medium text-sm transition-colors ${
              activeTab === tab.key
                ? 'bg-[#6366f1] text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Содержимое формы */}
      <form onSubmit={handleSubmit} className="px-4 pb-20">
        {/* Вкладка "Мебель" */}
        {activeTab === 'furniture' && (
          <div className="space-y-4">
            {/* Диваны */}
            <IonCard className="m-0 rounded-xl overflow-hidden shadow-md">
              <IonCardContent className="p-0">
                <div className="flex items-center p-4">
                  <div className="bg-purple-100 dark:bg-purple-900 rounded-lg h-12 w-12 flex items-center justify-center mr-4">
                    <IonIcon icon={homeOutline} className="text-[#6366f1] dark:text-[#818cf8] text-xl" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-montserrat font-semibold text-[#1e293b] dark:text-gray-200 mb-1">
                      Диваны
                    </h3>
                    <p className="text-xs font-montserrat text-[#475569] dark:text-gray-400">
                      ~1.5 часа на диван (2900zł)
                    </p>
                  </div>
                  <div className="flex items-center">
                    <IonButton fill="clear" onClick={() => setSofaCount(Math.max(0, sofaCount - 1))} className="counter-button bg-[#6366f1] dark:bg-[#818cf8] h-10 w-10 mx-0 rounded-full">
                      <IonIcon icon={removeCircleOutline} className="custom-icon text-white dark:text-gray-900" />
                    </IonButton>
                    <span className="w-8 text-center text-lg font-montserrat font-medium text-[#1e293b] dark:text-gray-200">
                      {sofaCount}
                    </span>
                    <IonButton fill="clear" onClick={() => setSofaCount(sofaCount + 1)} className="counter-button bg-[#6366f1] dark:bg-[#818cf8] h-10 w-10 mx-0 rounded-full">
                      <IonIcon icon={addCircleOutline} className="custom-icon text-white dark:text-gray-900" />
                    </IonButton>
                  </div>
                </div>
                <div className="flex items-center p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="bg-green-100 dark:bg-green-900 rounded-lg h-12 w-12 flex items-center justify-center mr-4">
                    <IonIcon icon={bedOutline} className="text-[#6366f1] dark:text-[#818cf8] text-xl" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-montserrat font-semibold text-[#1e293b] dark:text-gray-200 mb-1">
                      С подушками
                    </h3>
                    <p className="text-xs font-montserrat text-[#475569] dark:text-gray-400">
                      Чистка подушек и съемных элементов (+500zł)
                    </p>
                  </div>
                  <IonCheckbox checked={withPillows} onIonChange={(e) => setWithPillows(e.detail.checked)} className="text-[#6366f1] dark:text-[#818cf8]" />
                </div>
              </IonCardContent>
            </IonCard>

            {/* Кресла */}
            <IonCard className="m-0 rounded-xl overflow-hidden shadow-md">
              <IonCardContent className="p-0">
                <div className="flex items-center p-4">
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-lg h-12 w-12 flex items-center justify-center mr-4">
                    <IonIcon icon={cubeOutline} className="text-[#6366f1] dark:text-[#818cf8] text-xl" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-montserrat font-semibold text-[#1e293b] dark:text-gray-200 mb-1">
                      Кресла
                    </h3>
                    <p className="text-xs font-montserrat text-[#475569] dark:text-gray-400">
                      ~45 минут на кресло (1200zł)
                    </p>
                  </div>
                  <div className="flex items-center">
                    <IonButton fill="clear" onClick={() => setArmchairCount(Math.max(0, armchairCount - 1))} className="counter-button bg-[#6366f1] dark:bg-[#818cf8] h-10 w-10 mx-0 rounded-full">
                      <IonIcon icon={removeCircleOutline} className="custom-icon text-white dark:text-gray-900" />
                    </IonButton>
                    <span className="w-8 text-center text-lg font-montserrat font-medium text-[#1e293b] dark:text-gray-200">
                      {armchairCount}
                    </span>
                    <IonButton fill="clear" onClick={() => setArmchairCount(armchairCount + 1)} className="counter-button bg-[#6366f1] dark:bg-[#818cf8] h-10 w-10 mx-0 rounded-full">
                      <IonIcon icon={addCircleOutline} className="custom-icon text-white dark:text-gray-900" />
                    </IonButton>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>

            {/* Стулья */}
            <IonCard className="m-0 rounded-xl overflow-hidden shadow-md">
              <IonCardContent className="p-0">
                <div className="flex items-center p-4">
                  <div className="bg-indigo-100 dark:bg-indigo-900 rounded-lg h-12 w-12 flex items-center justify-center mr-4">
                    <IonIcon icon={gridOutline} className="text-[#6366f1] dark:text-[#818cf8] text-xl" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-montserrat font-semibold text-[#1e293b] dark:text-gray-200 mb-1">
                      Стулья
                    </h3>
                    <p className="text-xs font-montserrat text-[#475569] dark:text-gray-400">
                      ~30 минут на стул (700zł)
                    </p>
                  </div>
                  <div className="flex items-center">
                    <IonButton fill="clear" onClick={() => setChairCount(Math.max(0, chairCount - 1))} className="counter-button bg-[#6366f1] dark:bg-[#818cf8] h-10 w-10 mx-0 rounded-full">
                      <IonIcon icon={removeCircleOutline} className="custom-icon text-white dark:text-gray-900" />
                    </IonButton>
                    <span className="w-8 text-center text-lg font-montserrat font-medium text-[#1e293b] dark:text-gray-200">
                      {chairCount}
                    </span>
                    <IonButton fill="clear" onClick={() => setChairCount(chairCount + 1)} className="counter-button bg-[#6366f1] dark:bg-[#818cf8] h-10 w-10 mx-0 rounded-full">
                      <IonIcon icon={addCircleOutline} className="custom-icon text-white dark:text-gray-900" />
                    </IonButton>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          </div>
        )}

        {/* Вкладка "Ковры" */}
        {activeTab === 'carpet' && (
          <div className="space-y-4">
            <IonCard className="m-0 rounded-xl overflow-hidden shadow-md">
              <IonCardContent className="p-0">
                <div className="p-4">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 dark:bg-blue-900 rounded-lg h-12 w-12 flex items-center justify-center mr-4">
                      <IonIcon icon={bedOutline} className="text-[#6366f1] dark:text-[#818cf8] text-xl" />
                    </div>
                    <div>
                      <h3 className="text-base font-montserrat font-semibold text-[#1e293b] dark:text-gray-200 mb-1">
                        Площадь ковра
                      </h3>
                      <p className="text-xs font-montserrat text-[#475569] dark:text-gray-400">
                        Укажите площадь в квадратных метрах (600zł за м²)
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <IonInput
                      type="number"
                      value={carpetArea}
                      onIonChange={(e) => setCarpetArea(e.detail.value || '')}
                      placeholder="0"
                      className="text-center text-xl font-montserrat font-semibold text-[#1e293b] dark:text-gray-200"
                    />
                    <div className="flex justify-center mt-2">
                      <span className="text-xs font-montserrat text-[#475569] dark:text-gray-400">
                        м²
                      </span>
                    </div>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          </div>
        )}

        {/* Вкладка "Матрасы" */}
        {activeTab === 'mattress' && (
          <div className="space-y-4">
            <IonCard className="m-0 rounded-xl overflow-hidden shadow-md">
              <IonCardContent className="p-0">
                <div className="flex items-center p-4">
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-lg h-12 w-12 flex items-center justify-center mr-4">
                    <IonIcon icon={bedOutline} className="text-[#6366f1] dark:text-[#818cf8] text-xl" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-montserrat font-semibold text-[#1e293b] dark:text-gray-200 mb-1">
                      Матрасы
                    </h3>
                    <p className="text-xs font-montserrat text-[#475569] dark:text-gray-400">
                      ~1 час на матрас (1500zł)
                    </p>
                  </div>
                  <div className="flex items-center">
                    <IonButton fill="clear" onClick={() => setMattressCount(Math.max(0, mattressCount - 1))} className="counter-button bg-[#6366f1] dark:bg-[#818cf8] h-10 w-10 mx-0 rounded-full">
                      <IonIcon icon={removeCircleOutline} className="custom-icon text-white dark:text-gray-900" />
                    </IonButton>
                    <span className="w-8 text-center text-lg font-montserrat font-medium text-[#1e293b] dark:text-gray-200">
                      {mattressCount}
                    </span>
                    <IonButton fill="clear" onClick={() => setMattressCount(mattressCount + 1)} className="counter-button bg-[#6366f1] dark:bg-[#818cf8] h-10 w-10 mx-0 rounded-full">
                      <IonIcon icon={addCircleOutline} className="custom-icon text-white dark:text-gray-900" />
                    </IonButton>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          </div>
        )}

        {/* Вкладка "Дополнительно" */}
        {activeTab === 'additional' && (
          <div className="space-y-4">
            {/* Дополнительная информация */}
            <IonCard className="m-0 rounded-xl overflow-hidden shadow-md">
              <IonCardContent className="p-0">
                <div className="p-4">
                  <div className="flex items-center mb-4">
                    <div className="bg-yellow-100 dark:bg-yellow-900 rounded-lg h-12 w-12 flex items-center justify-center mr-4">
                      <IonIcon icon={documentTextOutline} className="text-[#6366f1] dark:text-[#818cf8] text-xl" />
                    </div>
                    <div>
                      <h3 className="text-base font-montserrat font-semibold text-[#1e293b] dark:text-gray-200 mb-1">
                        Дополнительная информация
                      </h3>
                      <p className="text-xs font-montserrat text-[#475569] dark:text-gray-400">
                        Опишите детали заказа
                      </p>
                    </div>
                  </div>

                  <IonTextarea
                    value={additionalInfo}
                    onIonChange={(e) => setAdditionalInfo(e.detail.value || '')}
                    placeholder="Опишите ваши пожелания, адрес и контактную информацию"
                    className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 h-32 text-[#1e293b] dark:text-gray-200 font-montserrat"
                    rows={4}
                  />
                </div>
              </IonCardContent>
            </IonCard>

            {/* Фотографии */}
            <IonCard className="m-0 rounded-xl overflow-hidden shadow-md">
              <IonCardContent className="p-0">
                <div className="p-4">
                  <div className="flex items-center mb-4">
                    <div className="bg-pink-100 dark:bg-pink-900 rounded-lg h-12 w-12 flex items-center justify-center mr-4">
                      <IonIcon icon={imageOutline} className="text-[#6366f1] dark:text-[#818cf8] text-xl" />
                    </div>
                    <div>
                      <h3 className="text-base font-montserrat font-semibold text-[#1e293b] dark:text-gray-200 mb-1">
                        Фотографии
                      </h3>
                      <p className="text-xs font-montserrat text-[#475569] dark:text-gray-400">
                        Прикрепите фото предметов для чистки
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-indigo-100 dark:bg-indigo-900/50 text-[#6366f1] dark:text-[#818cf8] rounded-lg font-montserrat text-sm font-medium"
                    >
                      <IonIcon icon={imageOutline} className="mr-2" />
                      Выбрать фото
                    </label>
                    {images.length > 0 && (
                      <p className="mt-2 text-xs font-montserrat text-[#475569] dark:text-gray-400">
                        Выбрано файлов: {images.length}
                      </p>
                    )}
                  </div>
                </div>
              </IonCardContent>
            </IonCard>

            {/* Календарь - НОВЫЙ КОМПОНЕНТ */}
            <IonCard className="m-0 rounded-xl overflow-hidden shadow-md">
              <IonCardContent className="p-4">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-lg h-12 w-12 flex items-center justify-center mr-4">
                    <IonIcon icon={calendarOutline} className="text-[#6366f1] dark:text-[#818cf8] text-xl" />
                  </div>
                  <div>
                    <h3 className="text-base font-montserrat font-semibold text-[#1e293b] dark:text-gray-200 mb-1">
                      Дата и время
                    </h3>
                    <p className="text-xs font-montserrat text-[#475569] dark:text-gray-400">
                      Выберите удобное время для предварительной записи
                    </p>
                  </div>
                </div>
                
                {/* Используем новый UserCalendar компонент */}
                <UserCalendar 
                  onDateSelect={handleDateSelect}
                  selectedDate={scheduledDate}
                />
              </IonCardContent>
            </IonCard>
          </div>
        )}

        {/* Кнопка отправки */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 shadow-lg z-10">
          <IonButton
            type="submit"
            expand="block"
            disabled={submitting}
            className="custom-button rounded-xl shadow-md text-base font-montserrat h-12"
          >
            {submitting ? (
              <>
                <IonSpinner className="mr-2" />
                Создание заказа...
              </>
            ) : (
              'Отправить заказ'
            )}
          </IonButton>
        </div>
      </form>

      {/* Footer навигация */}
      <IonFooter>
        <IonTabBar slot="bottom" className="bg-white dark:bg-gray-800 shadow-md">
          <IonTabButton tab="home" onClick={goToHome} className="text-[#6366f1] dark:text-[#818cf8]">
            <IonIcon icon={homeOutline} className="text-2xl" />
            <IonLabel className="text-xs font-montserrat">Главная</IonLabel>
          </IonTabButton>
          <IonTabButton tab="bookings" className="text-[#6366f1] dark:text-[#818cf8]">
            <IonIcon icon={calendarOutline} className="text-2xl" />
            <IonLabel className="text-xs font-montserrat">Заказы</IonLabel>
          </IonTabButton>
          <IonTabButton tab="chat" className="text-[#6366f1] dark:text-[#818cf8]">
            <IonIcon icon={chatbubbleOutline} className="text-2xl" />
            <IonLabel className="text-xs font-montserrat">Чат</IonLabel>
          </IonTabButton>
          <IonTabButton tab="profile" onClick={goToProfile} className="text-[#6366f1] dark:text-[#818cf8]">
            <IonIcon icon={personOutline} className="text-2xl" />
            <IonLabel className="text-xs font-montserrat">Профиль</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonFooter>
    </div>
  );
};

export default OrderForm;