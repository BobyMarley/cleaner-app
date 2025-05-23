// OrderForm.tsx - УЛУЧШЕННАЯ ВЕРСИЯ С ЛОГИЧНОЙ СТРУКТУРОЙ
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
import UserCalendar from '../components/UserCalendar';
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
  closeCircleOutline,
  timeOutline,
  cashOutline,
  homeOutline,
  cubeOutline,
  gridOutline,
  personOutline,
  lockClosedOutline,
  calendarOutline,
  chatbubbleOutline,
  locationOutline,
  warningOutline,
  sparklesOutline,
  mapOutline
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
  const [address, setAddress] = useState<string>('');
  const [addressError, setAddressError] = useState<string>('');
  
  // UI состояния
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('services');
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
    if (tab && ['services', 'location', 'details'].includes(tab)) {
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

  // Валидация адреса
  const validateAddress = (value: string): string => {
    if (!value.trim()) {
      return 'Адрес обязателен для заполнения';
    }
    if (value.trim().length < 10) {
      return 'Адрес должен содержать минимум 10 символов';
    }
    return '';
  };

  // Обработка изменения адреса
  const handleAddressChange = (value: string) => {
    setAddress(value);
    const error = validateAddress(value);
    setAddressError(error);
  };

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
      setActiveTab('services');
      window.alert('Пожалуйста, выберите хотя бы один элемент для чистки');
      return;
    }

    // ВАЛИДАЦИЯ АДРЕСА
    const addressValidationError = validateAddress(address);
    if (addressValidationError) {
      setAddressError(addressValidationError);
      setActiveTab('location');
      window.alert('Пожалуйста, укажите корректный адрес заказа');
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
        status: 'pending',
        address: address.trim()
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
      }
      
      // Показываем успешное сообщение
      const successMessage = scheduledDate 
        ? `Заказ успешно создан! ${scheduledDate ? `Дата и время: ${new Date(scheduledDate).toLocaleString('ru-RU')}` : ''}`
        : 'Заказ успешно создан! Мы свяжемся с вами для согласования времени.';
      
      window.alert(successMessage);
      navigate('/profile');
      
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
    total += sofaCount * 180;
    total += sofaCount * (withPillows ? 50 : 0);
    total += armchairCount * 40;
    total += chairCount * 20;
    total += mattressCount * 90;
    total += parseFloat(carpetArea || '0') * 15;
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

  // Функция для форматирования выбранной даты
  const formatSelectedDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ru-RU', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Проверка готовности формы
  const isFormReady = () => {
    const hasItems = carpetArea || chairCount > 0 || armchairCount > 0 || sofaCount > 0 || mattressCount > 0;
    const hasValidAddress = address.trim().length >= 10;
    return hasItems && hasValidAddress;
  };

  // Подсчет количества услуг
  const getServicesCount = () => {
    let count = 0;
    if (sofaCount > 0) count++;
    if (armchairCount > 0) count++;
    if (chairCount > 0) count++;
    if (mattressCount > 0) count++;
    if (carpetArea && parseFloat(carpetArea) > 0) count++;
    return count;
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
              <span className="dark:text-white font-montserrat text-xl font-bold tracking-tight">
                Новый заказ {scheduledDate && '📅'}
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

      {/* Сводка заказа */}
      <IonCard className="mx-4 my-4 rounded-xl overflow-hidden shadow-lg">
        <IonCardContent className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-montserrat font-semibold text-lg text-[#1e293b] dark:text-gray-200">
              Сводка заказа
            </h3>
            <IonChip className={`font-montserrat ${isFormReady() ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'}`}>
              <IonIcon icon={isFormReady() ? checkmarkCircleOutline : warningOutline} className="mr-1" />
              {isFormReady() ? 'Готов к отправке' : 'Заполните форму'}
            </IonChip>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
              <IonIcon icon={sparklesOutline} className="text-[#6366f1] dark:text-[#818cf8] text-xl mr-2" />
              <div>
                <p className="text-xs text-[#475569] dark:text-gray-400 font-montserrat">Услуги</p>
                <p className="text-sm font-medium text-[#1e293b] dark:text-gray-200 font-montserrat">
                  {getServicesCount() ? `${getServicesCount()} выбрано` : 'Не выбрано'}
                </p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
              <IonIcon icon={locationOutline} className="text-[#6366f1] dark:text-[#818cf8] text-xl mr-2" />
              <div>
                <p className="text-xs text-[#475569] dark:text-gray-400 font-montserrat">Адрес</p>
                <p className="text-sm font-medium text-[#1e293b] dark:text-gray-200 font-montserrat">
                  {address ? 'Указан' : 'Не указан'}
                </p>
              </div>
            </div>
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
      <div className="flex px-4 mb-4 space-x-2">
        {[
          { 
            key: 'services', 
            label: '🧽 Услуги',
            hasAlert: getServicesCount() === 0
          },
          { 
            key: 'location', 
            label: '📍 Адрес и время',
            hasAlert: !address
          },
          { 
            key: 'details', 
            label: '📝 Детали'
          }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-3 rounded-xl font-montserrat font-medium text-sm transition-all duration-200 relative ${
              activeTab === tab.key
                ? 'bg-[#6366f1] text-white shadow-lg scale-105'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
            {tab.hasAlert && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            )}
          </button>
        ))}
      </div>

      {/* Содержимое формы */}
      <form onSubmit={handleSubmit} className="px-4 pb-20">
        {/* Вкладка "Услуги" - ВСЕ ВАРИАНТЫ ХИМЧИСТКИ */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            {/* Мебель */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
              <h3 className="text-lg font-montserrat font-bold text-[#1e293b] dark:text-gray-200 mb-4 flex items-center">
                <IonIcon icon={homeOutline} className="text-[#6366f1] mr-2" />
                Мебель
              </h3>
              
              {/* Диваны */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-montserrat font-semibold text-[#1e293b] dark:text-gray-200">
                      Диваны
                    </h4>
                    <p className="text-xs font-montserrat text-[#475569] dark:text-gray-400">
                      ~1.5 часа на диван (180zł)
                    </p>
                  </div>
                  <div className="flex items-center">
                    <IonButton fill="clear" onClick={() => setSofaCount(Math.max(0, sofaCount - 1))} className="counter-button bg-[#6366f1] h-10 w-10 mx-0 rounded-full">
                      <IonIcon icon={removeCircleOutline} className="text-white" />
                    </IonButton>
                    <span className="w-8 text-center text-lg font-montserrat font-medium text-[#1e293b] dark:text-gray-200">
                      {sofaCount}
                    </span>
                    <IonButton fill="clear" onClick={() => setSofaCount(sofaCount + 1)} className="counter-button bg-[#6366f1] h-10 w-10 mx-0 rounded-full">
                      <IonIcon icon={addCircleOutline} className="text-white" />
                    </IonButton>
                  </div>
                </div>
                
                {/* Подушки */}
                {sofaCount > 0 && (
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div>
                      <h5 className="font-montserrat font-medium text-[#1e293b] dark:text-gray-200">
                        С подушками
                      </h5>
                      <p className="text-xs font-montserrat text-[#475569] dark:text-gray-400">
                        Чистка подушек (+50zł)
                      </p>
                    </div>
                    <IonCheckbox checked={withPillows} onIonChange={(e) => setWithPillows(e.detail.checked)} />
                  </div>
                )}
              </div>

              {/* Кресла */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-montserrat font-semibold text-[#1e293b] dark:text-gray-200">
                      Кресла
                    </h4>
                    <p className="text-xs font-montserrat text-[#475569] dark:text-gray-400">
                      ~45 минут на кресло (40zł)
                    </p>
                  </div>
                  <div className="flex items-center">
                    <IonButton fill="clear" onClick={() => setArmchairCount(Math.max(0, armchairCount - 1))} className="counter-button bg-[#6366f1] h-10 w-10 mx-0 rounded-full">
                      <IonIcon icon={removeCircleOutline} className="text-white" />
                    </IonButton>
                    <span className="w-8 text-center text-lg font-montserrat font-medium text-[#1e293b] dark:text-gray-200">
                      {armchairCount}
                    </span>
                    <IonButton fill="clear" onClick={() => setArmchairCount(armchairCount + 1)} className="counter-button bg-[#6366f1] h-10 w-10 mx-0 rounded-full">
                      <IonIcon icon={addCircleOutline} className="text-white" />
                    </IonButton>
                  </div>
                </div>
              </div>

              {/* Стулья */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-montserrat font-semibold text-[#1e293b] dark:text-gray-200">
                      Стулья
                    </h4>
                    <p className="text-xs font-montserrat text-[#475569] dark:text-gray-400">
                      ~30 минут на стул (20zł)
                    </p>
                  </div>
                  <div className="flex items-center">
                    <IonButton fill="clear" onClick={() => setChairCount(Math.max(0, chairCount - 1))} className="counter-button bg-[#6366f1] h-10 w-10 mx-0 rounded-full">
                      <IonIcon icon={removeCircleOutline} className="text-white" />
                    </IonButton>
                    <span className="w-8 text-center text-lg font-montserrat font-medium text-[#1e293b] dark:text-gray-200">
                      {chairCount}
                    </span>
                    <IonButton fill="clear" onClick={() => setChairCount(chairCount + 1)} className="counter-button bg-[#6366f1] h-10 w-10 mx-0 rounded-full">
                      <IonIcon icon={addCircleOutline} className="text-white" />
                    </IonButton>
                  </div>
                </div>
              </div>
            </div>

            {/* Ковры */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
              <h3 className="text-lg font-montserrat font-bold text-[#1e293b] dark:text-gray-200 mb-4 flex items-center">
                <IonIcon icon={gridOutline} className="text-[#6366f1] mr-2" />
                Ковры
              </h3>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-montserrat font-semibold text-[#1e293b] dark:text-gray-200">
                      Площадь ковра
                    </h4>
                    <p className="text-xs font-montserrat text-[#475569] dark:text-gray-400">
                      Укажите площадь в м² (15zł за м²)
                    </p>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-600 rounded-lg p-3">
                  <IonInput
                    type="number"
                    value={carpetArea}
                    onIonChange={(e) => setCarpetArea(e.detail.value || '')}
                    placeholder="0"
                    className="text-center text-xl font-montserrat font-semibold text-[#1e293b] dark:text-gray-200"
                  />
                  <div className="flex justify-center mt-1">
                    <span className="text-xs font-montserrat text-[#475569] dark:text-gray-400">
                      м²
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Матрасы */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
              <h3 className="text-lg font-montserrat font-bold text-[#1e293b] dark:text-gray-200 mb-4 flex items-center">
                <IonIcon icon={bedOutline} className="text-[#6366f1] mr-2" />
                Матрасы
              </h3>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-montserrat font-semibold text-[#1e293b] dark:text-gray-200">
                      Матрасы
                    </h4>
                    <p className="text-xs font-montserrat text-[#475569] dark:text-gray-400">
                      ~1 час на матрас (90zł)
                    </p>
                  </div>
                  <div className="flex items-center">
                    <IonButton fill="clear" onClick={() => setMattressCount(Math.max(0, mattressCount - 1))} className="counter-button bg-[#6366f1] h-10 w-10 mx-0 rounded-full">
                      <IonIcon icon={removeCircleOutline} className="text-white" />
                    </IonButton>
                    <span className="w-8 text-center text-lg font-montserrat font-medium text-[#1e293b] dark:text-gray-200">
                      {mattressCount}
                    </span>
                    <IonButton fill="clear" onClick={() => setMattressCount(mattressCount + 1)} className="counter-button bg-[#6366f1] h-10 w-10 mx-0 rounded-full">
                      <IonIcon icon={addCircleOutline} className="text-white" />
                    </IonButton>
                  </div>
                </div>
              </div>
            </div>

            {/* Подсказка */}
            {getServicesCount() === 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                <div className="flex items-center">
                  <IonIcon icon={sparklesOutline} className="text-blue-500 text-xl mr-3" />
                  <div>
                    <p className="font-montserrat font-medium text-blue-700 dark:text-blue-300">
                      Выберите услуги для продолжения
                    </p>
                    <p className="text-sm font-montserrat text-blue-600 dark:text-blue-400">
                      Укажите что нужно почистить, чтобы продолжить оформление заказа
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Вкладка "Адрес и время" */}
        {activeTab === 'location' && (
          <div className="space-y-4">
            {/* АДРЕС - ОБЯЗАТЕЛЬНОЕ ПОЛЕ */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
              <h3 className="text-lg font-montserrat font-bold text-[#1e293b] dark:text-gray-200 mb-4 flex items-center">
                <IonIcon icon={locationOutline} className="text-[#6366f1] mr-2" />
                Адрес заказа
                <IonChip className="ml-2 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 text-xs">
                  Обязательно
                </IonChip>
              </h3>
              
              <div className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-4 ${addressError ? 'border-2 border-red-300 dark:border-red-700' : ''}`}>
                <IonTextarea
                  value={address}
                  onIonChange={(e) => handleAddressChange(e.detail.value || '')}
                  placeholder="Например: ул. Краковская 15, кв. 42, Варшава"
                  className={`text-[#1e293b] dark:text-gray-200 font-montserrat ${addressError ? 'text-red-600 dark:text-red-400' : ''}`}
                  rows={3}
                />
                
                {addressError && (
                  <p className="text-red-600 dark:text-red-400 text-sm font-montserrat mt-2">
                    {addressError}
                  </p>
                )}
                
                {address && !addressError && (
                  <div className="flex items-center mt-2 text-green-600 dark:text-green-400">
                    <IonIcon icon={checkmarkCircleOutline} className="mr-2" />
                    <span className="text-sm font-montserrat">Адрес указан корректно</span>
                  </div>
                )}
              </div>
            </div>

            {/* Календарь */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
              <h3 className="text-lg font-montserrat font-bold text-[#1e293b] dark:text-gray-200 mb-2 flex items-center">
                <IonIcon icon={calendarOutline} className="text-[#6366f1] mr-2" />
                Дата и время
              </h3>
              <p className="text-sm font-montserrat text-[#475569] dark:text-gray-400 mb-4">
                Выберите удобное время или мы сами свяжемся с вами
              </p>
              
              {scheduledDate && (
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <IonIcon icon={checkmarkCircleOutline} className="text-green-600 dark:text-green-400 mr-2" />
                      <div>
                        <p className="font-montserrat font-medium text-green-700 dark:text-green-300">
                          Время выбрано
                        </p>
                        <p className="text-sm font-montserrat text-green-600 dark:text-green-400">
                          {formatSelectedDate(scheduledDate)}
                        </p>
                      </div>
                    </div>
                    <IonButton 
                      fill="clear" 
                      onClick={() => setScheduledDate('')}
                      className="text-red-500"
                    >
                      <IonIcon icon={closeCircleOutline} />
                    </IonButton>
                  </div>
                </div>
              )}
              
              <UserCalendar 
                onDateSelect={handleDateSelect}
                selectedDate={scheduledDate}
              />
            </div>
          </div>
        )}

        {/* Вкладка "Детали" */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            {/* Дополнительная информация */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
              <h3 className="text-lg font-montserrat font-bold text-[#1e293b] dark:text-gray-200 mb-4 flex items-center">
                <IonIcon icon={documentTextOutline} className="text-[#6366f1] mr-2" />
                Дополнительная информация
              </h3>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <IonTextarea
                  value={additionalInfo}
                  onIonChange={(e) => setAdditionalInfo(e.detail.value || '')}
                  placeholder="Опишите ваши пожелания, особенности доступа к объектам, контактный телефон, специальные требования..."
                  className="text-[#1e293b] dark:text-gray-200 font-montserrat"
                  rows={4}
                />
              </div>
            </div>

            {/* Фотографии */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
              <h3 className="text-lg font-montserrat font-bold text-[#1e293b] dark:text-gray-200 mb-4 flex items-center">
                <IonIcon icon={imageOutline} className="text-[#6366f1] mr-2" />
                Фотографии
              </h3>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
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
                  className="cursor-pointer inline-flex items-center justify-center px-6 py-3 bg-indigo-100 dark:bg-indigo-900/50 text-[#6366f1] dark:text-[#818cf8] rounded-lg font-montserrat font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/70 transition-colors"
                >
                  <IonIcon icon={imageOutline} className="mr-2 text-xl" />
                  Выбрать фотографии
                </label>
                {images.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-montserrat text-[#475569] dark:text-gray-400">
                      Выбрано файлов: {images.length}
                    </p>
                    <div className="flex items-center justify-center mt-2">
                      <IonIcon icon={checkmarkCircleOutline} className="text-green-500 mr-1" />
                      <span className="text-sm font-montserrat text-green-600 dark:text-green-400">
                        Фотографии готовы к отправке
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Кнопка отправки */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 shadow-lg z-10">
          <IonButton
            type="submit"
            expand="block"
            disabled={submitting || !isFormReady()}
            className={`rounded-xl shadow-md text-base font-montserrat h-12 ${
              isFormReady() 
                ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white' 
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500'
            }`}
          >
            {submitting ? (
              <>
                <IonSpinner className="mr-2" />
                Создание заказа...
              </>
            ) : !getServicesCount() ? (
              <>
                <IonIcon icon={sparklesOutline} className="mr-2" />
                Выберите услуги
              </>
            ) : !address ? (
              <>
                <IonIcon icon={locationOutline} className="mr-2" />
                Укажите адрес
              </>
            ) : (
              <>
                <IonIcon icon={checkmarkCircleOutline} className="mr-2" />
                Отправить заказ
              </>
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