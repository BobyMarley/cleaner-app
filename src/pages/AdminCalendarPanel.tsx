// pages/AdminCalendarPanel.tsx - ПРОДАКШН АДМИН-ПАНЕЛЬ
import React, { useState, useEffect } from 'react';
import {
  IonButton,
  IonHeader,
  IonToolbar,
  IonIcon,
  IonCard,
  IonCardContent,
  IonToast,
  IonContent,
  IonModal,
  IonSpinner,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonInput,
  IonItem,
  IonCheckbox,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonBadge,
  IonAlert,
  IonProgressBar
} from '@ionic/react';
import { auth, onAuthStateChanged } from '../services/firebase';
import { 
  addAvailableDate,
  addMultipleDates, 
  getAvailableDatesWithIds, 
  deleteAvailableDate,
  cleanupExpiredDates,
  getCalendarStats,
  DEFAULT_TIME_SLOTS,
  getAllTimeSlots
} from '../services/calendarService';
import { 
  trashOutline, 
  chevronBackOutline, 
  addOutline, 
  calendarOutline, 
  timeOutline, 
  closeOutline,
  sunnyOutline,
  moonOutline,
  statsChartOutline,
  refreshOutline,
  copyOutline,
  checkmarkOutline,
  warningOutline,
  informationCircleOutline
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';

const morningSlots = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
const afternoonSlots = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
const eveningSlots = ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'];

// Типы
interface CalendarStats {
  totalDates: number;
  availableDates: number;
  reservedDates: number;
  expiredDates: number;
}

interface DateWithId {
  id: string;
  date: string;
  isReserved: boolean;
}

const adminEmails = ['plenkanet@gmail.com'];

const AdminCalendarPanel: React.FC = () => {
  const navigate = useNavigate();
  
  // Состояния данных
  const [availableDates, setAvailableDates] = useState<DateWithId[]>([]);
  const [stats, setStats] = useState<CalendarStats>({
    totalDates: 0,
    availableDates: 0,
    reservedDates: 0,
    expiredDates: 0
  });
  
  // Состояния UI
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning'>('success');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Модальные окна
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string>('');
  
  // Выбор даты/времени
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedTimeView, setSelectedTimeView] = useState('morning');
  
  // Массовое добавление
  const [batchStartDate, setBatchStartDate] = useState('');
  const [batchEndDate, setBatchEndDate] = useState('');
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [excludeWeekends, setExcludeWeekends] = useState(true);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);

  // Генерация календарных дней
  const generateCalendarDays = (startDate = new Date()) => {
    const days = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 30; i++) {
      const dateString = currentDate.toISOString().split('T')[0];
      days.push({
        date: dateString,
        displayDate: currentDate.getDate(),
        displayDay: currentDate.toLocaleDateString('en-GB', { weekday: 'short' }),
        displayMonth: currentDate.toLocaleDateString('en-GB', { month: 'short' }),
        isToday: i === 0,
        fullDate: new Date(currentDate)
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return days;
  };

  const calendarDays = generateCalendarDays();

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
        loadData();
      }
      setLoading(false);
    });
    
    return () => unsub();
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dates, statistics] = await Promise.all([
        getAvailableDatesWithIds(),
        getCalendarStats()
      ]);
      
      setAvailableDates(dates);
      setStats(statistics);
    } catch (error) {
      showToastMessage('Ошибка загрузки данных', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const showToastMessage = (message: string, color: 'success' | 'danger' | 'warning' = 'success') => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setIsDateModalOpen(false);
    setIsTimeModalOpen(true);
  };

  const handleTimeSelect = async (time: string) => {
    setSelectedTime(time);
    
    const dateObj = new Date(selectedDate);
    const [hours, minutes] = time.split(':').map(Number);
    dateObj.setHours(hours, minutes, 0, 0);
    
    try {
      await addAvailableDate(dateObj.toISOString());
      await loadData();
      setIsTimeModalOpen(false);
      resetSelection();
      showToastMessage('Дата успешно добавлена');
    } catch (error) {
      showToastMessage(error instanceof Error ? error.message : 'Ошибка добавления даты', 'danger');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAvailableDate(id);
      await loadData();
      showToastMessage('Дата успешно удалена');
    } catch (error) {
      showToastMessage('Ошибка при удалении даты', 'danger');
    }
  };

  const handleBatchAdd = async () => {
    if (!batchStartDate || !batchEndDate || selectedTimeSlots.length === 0) {
      showToastMessage('Заполните все поля для массового добавления', 'warning');
      return;
    }

    setBatchLoading(true);
    setBatchProgress(0);
    
    try {
      // Симуляция прогресса
      const progressInterval = setInterval(() => {
        setBatchProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const addedCount = await addMultipleDates(
        batchStartDate,
        batchEndDate,
        selectedTimeSlots,
        excludeWeekends
      );

      clearInterval(progressInterval);
      setBatchProgress(100);
      
      setTimeout(async () => {
        await loadData();
        setIsBatchModalOpen(false);
        resetBatchForm();
        setBatchLoading(false);
        setBatchProgress(0);
        showToastMessage(`Добавлено ${addedCount} дат`);
      }, 500);
      
    } catch (error) {
      setBatchLoading(false);
      setBatchProgress(0);
      showToastMessage(error instanceof Error ? error.message : 'Ошибка массового добавления', 'danger');
    }
  };

  const handleCleanup = async () => {
    try {
      const cleanedCount = await cleanupExpiredDates();
      await loadData();
      showToastMessage(`Удалено ${cleanedCount} просроченных дат`);
    } catch (error) {
      showToastMessage('Ошибка при очистке', 'danger');
    }
  };

  const resetSelection = () => {
    setSelectedDate('');
    setSelectedTime('');
  };

  const resetBatchForm = () => {
    setBatchStartDate('');
    setBatchEndDate('');
    setSelectedTimeSlots([]);
    setExcludeWeekends(true);
  };

  const toggleTimeSlot = (time: string) => {
    setSelectedTimeSlots(prev => 
      prev.includes(time) 
        ? prev.filter(t => t !== time)
        : [...prev, time]
    );
  };

  const selectAllTimeSlots = (period: keyof typeof DEFAULT_TIME_SLOTS) => {
    const slots = DEFAULT_TIME_SLOTS[period];
    setSelectedTimeSlots(prev => {
      const newSlots = [...prev];
      slots.forEach(slot => {
        if (!newSlots.includes(slot)) {
          newSlots.push(slot);
        }
      });
      return newSlots;
    });
  };

  const formatDateToEuropean = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-[#f1f5f9] to-[#ddd6fe] dark:from-[#1e293b] dark:to-[#312e81]">
        <IonSpinner name="crescent" className="text-[#6366f1] w-12 h-12" />
        <p className="mt-4 text-[#1e293b] dark:text-white font-montserrat">Загрузка календаря...</p>
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
              <IonButton fill="clear" onClick={() => navigate('/')} className="text-white mr-2 p-0">
                <IonIcon icon={chevronBackOutline} className="text-xl" />
              </IonButton>
              <span className="text-white font-montserrat text-xl font-bold tracking-tight">
                Управление календарем
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
        {/* Статистика */}
        <IonCard className="rounded-xl overflow-hidden shadow-lg mb-4">
          <IonCardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-montserrat font-semibold text-lg text-[#1e293b] dark:text-gray-200">
                Статистика календаря
              </h3>
              <IonButton 
                fill="clear" 
                onClick={loadData}
                className="text-[#6366f1] dark:text-[#818cf8]"
              >
                <IonIcon icon={refreshOutline} />
              </IonButton>
            </div>
            
            <IonGrid>
              <IonRow>
                <IonCol size="6">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {stats.availableDates}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300 font-montserrat">
                      Доступно
                    </p>
                  </div>
                </IonCol>
                <IonCol size="6">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {stats.reservedDates}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 font-montserrat">
                      Забронировано
                    </p>
                  </div>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol size="6">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                      {stats.totalDates}
                    </p>
                    <p className="text-xs text-gray-700 dark:text-gray-300 font-montserrat">
                      Всего
                    </p>
                  </div>
                </IonCol>
                <IonCol size="6">
                  <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {stats.expiredDates}
                    </p>
                    <p className="text-xs text-orange-700 dark:text-orange-300 font-montserrat">
                      Просрочено
                    </p>
                  </div>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>

        {/* Кнопки управления */}
        <div className="flex flex-wrap gap-2 mb-4">
          <IonButton 
            onClick={() => setIsDateModalOpen(true)} 
            className="custom-button rounded-xl shadow-md text-sm font-montserrat flex-1"
          >
            <IonIcon icon={addOutline} slot="start" />
            Добавить дату
          </IonButton>
          
          <IonButton 
            onClick={() => setIsBatchModalOpen(true)} 
            fill="outline"
            className="rounded-xl shadow-md text-sm font-montserrat flex-1"
          >
            <IonIcon icon={copyOutline} slot="start" />
            Массовое добавление
          </IonButton>
          
          <IonButton 
            onClick={handleCleanup} 
            fill="outline"
            color="warning"
            className="rounded-xl shadow-md text-sm font-montserrat"
          >
            <IonIcon icon={trashOutline} slot="start" />
            Очистить
          </IonButton>
        </div>

        {/* Список дат */}
        <IonCard className="rounded-xl overflow-hidden shadow-lg">
          <IonCardContent className="p-4">
            <h3 className="font-montserrat font-semibold text-lg text-[#1e293b] dark:text-gray-200 mb-4">
              Доступные даты ({availableDates.length})
            </h3>
            
            {availableDates.length === 0 ? (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                  <IonIcon icon={calendarOutline} className="text-indigo-600 dark:text-indigo-400 text-2xl" />
                </div>
                <p className="text-[#475569] dark:text-gray-400 font-montserrat">
                  Нет доступных дат. Добавьте их с помощью кнопок выше.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {availableDates.map((dateObj) => (
                  <div 
                    key={dateObj.id} 
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl p-4"
                  >
                    <div className="flex items-center">
                      <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-lg h-10 w-10 flex items-center justify-center mr-3">
                        <IonIcon icon={calendarOutline} className="text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-montserrat font-medium text-[#1e293b] dark:text-gray-200">
                          {formatDateToEuropean(dateObj.date)}
                        </p>
                        <div className="flex items-center space-x-2">
                          {dateObj.isReserved ? (
                            <IonChip className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                              <IonIcon icon={warningOutline} className="mr-1" />
                              Зарезервировано
                            </IonChip>
                          ) : (
                            <IonChip className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                              <IonIcon icon={checkmarkOutline} className="mr-1" />
                              Доступно
                            </IonChip>
                          )}
                        </div>
                      </div>
                    </div>
                    <IonButton 
                      fill="clear" 
                      onClick={() => {
                        setDeleteItemId(dateObj.id);
                        setShowDeleteAlert(true);
                      }}
                      className="text-red-500 dark:text-red-400"
                    >
                      <IonIcon icon={trashOutline} />
                    </IonButton>
                  </div>
                ))}
              </div>
            )}
          </IonCardContent>
        </IonCard>
      </IonContent>

      {/* Модальные окна и другие компоненты из предыдущей версии... */}
      {/* (Добавлю их в следующем артефакте, так как этот уже большой) */}

      {/* Toast уведомления */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position="bottom"
        color={toastColor}
        className="font-montserrat"
      />

      {/* Alert для подтверждения удаления */}
      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Подтверждение удаления"
        message="Вы уверены, что хотите удалить эту дату?"
        buttons={[
          {
            text: 'Отмена',
            role: 'cancel',
          },
          {
            text: 'Удалить',
            handler: () => {
              handleDelete(deleteItemId);
            },
          },
        ]}
      />
	  
	  // Модальные окна для AdminCalendarPanel.tsx
// Добавьте эти компоненты в конец файла AdminCalendarPanel.tsx, перед закрывающим div

{/* Модальное окно выбора даты для одинарного добавления */}
<IonModal 
  isOpen={isDateModalOpen} 
  onDidDismiss={() => setIsDateModalOpen(false)}
  className="date-picker-modal"
>
  <div className="bg-white dark:bg-gray-800 min-h-full flex flex-col">
    {/* Header */}
    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <h3 className="text-xl font-montserrat font-bold text-[#1e293b] dark:text-gray-200">
        Выберите дату
      </h3>
      <IonButton fill="clear" onClick={() => setIsDateModalOpen(false)} className="p-2">
        <IonIcon icon={closeOutline} className="text-[#1e293b] dark:text-gray-200 text-2xl" />
      </IonButton>
    </div>
    
    {/* Content */}
    <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      {/* Календарная сетка */}
      <div className="mb-8">
        <div className="mb-6 flex items-center justify-between">
          <h4 className="text-lg font-montserrat font-semibold text-[#1e293b] dark:text-gray-200">
            {new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
          </h4>
        </div>
        
        {/* Заголовки дней недели */}
        <div className="grid grid-cols-7 mb-4 gap-2">
          {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map((day, index) => (
            <div key={index} className="text-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 font-montserrat py-3">
              {day}
            </div>
          ))}
        </div>
        
        {/* Календарная сетка */}
        <div className="grid grid-cols-7 gap-2">
          {/* Пустые ячейки в начале месяца */}
          {Array.from({ length: new Date(calendarDays[0].fullDate).getDay() }).map((_, index) => (
            <div key={`empty-${index}`} className="h-14 rounded-lg"></div>
          ))}
          
          {calendarDays.map((day, index) => (
            <div 
              key={index}
              onClick={() => handleDateSelect(day.date)}
              className={`h-14 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-200 ${
                day.date === selectedDate
                  ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg transform scale-105'
                  : day.isToday
                    ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-300 dark:border-indigo-600'
                    : 'bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-[#1e293b] dark:text-gray-200 shadow-sm hover:shadow-md'
              }`}
            >
              <span className="text-base font-montserrat font-medium">{day.displayDate}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Быстрый выбор */}
      <div className="mb-6">
        <h4 className="text-lg font-montserrat font-semibold text-[#1e293b] dark:text-gray-200 mb-4">
          Быстрый выбор
        </h4>
        
        <div className="flex overflow-x-auto pb-3 space-x-4 scrollbar-hide">
          {calendarDays.slice(0, 14).map((day, index) => (
            <div 
              key={index}
              onClick={() => handleDateSelect(day.date)}
              className={`flex-shrink-0 p-4 rounded-xl cursor-pointer transition-all duration-200 min-w-max ${
                day.date === selectedDate
                  ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg transform scale-105'
                  : 'bg-white dark:bg-gray-800 text-[#1e293b] dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 shadow-sm hover:shadow-md'
              }`}
            >
              <p className="text-center font-montserrat font-medium whitespace-nowrap text-sm">
                {day.displayDay}
              </p>
              <p className="text-center font-montserrat font-bold whitespace-nowrap">
                {day.displayDate} {day.displayMonth}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
</IonModal>

{/* Модальное окно выбора времени */}
<IonModal 
  isOpen={isTimeModalOpen} 
  onDidDismiss={() => setIsTimeModalOpen(false)}
  className="date-picker-modal"
>
  <div className="bg-white dark:bg-gray-800 min-h-full flex flex-col">
    {/* Header */}
    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <h3 className="text-xl font-montserrat font-bold text-[#1e293b] dark:text-gray-200">
        Выберите время
      </h3>
      <IonButton fill="clear" onClick={() => setIsTimeModalOpen(false)} className="p-2">
        <IonIcon icon={closeOutline} className="text-[#1e293b] dark:text-gray-200 text-2xl" />
      </IonButton>
    </div>
    
    {/* Content */}
    <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      {selectedDate && (
        <div>
          {/* Информация о выбранной дате */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 flex items-center shadow-sm">
            <IonIcon icon={calendarOutline} className="text-indigo-600 dark:text-indigo-400 text-2xl mr-4" />
            <div>
              <p className="text-sm text-[#475569] dark:text-gray-400 font-montserrat mb-1">Выбранная дата</p>
              <p className="text-lg font-semibold text-[#1e293b] dark:text-gray-200 font-montserrat">
                {selectedDate && new Date(selectedDate).toLocaleDateString('ru-RU', {
                  weekday: 'long',
                  day: 'numeric', 
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Выбор периода времени */}
          <IonSegment 
            value={selectedTimeView} 
            onIonChange={e => setSelectedTimeView(e.detail.value as string)}
            className="mb-8 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm"
          >
            <IonSegmentButton value="morning" className="segment-button">
              <IonLabel className="text-sm font-montserrat font-medium py-4">Утро</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="afternoon" className="segment-button">
              <IonLabel className="text-sm font-montserrat font-medium py-4">День</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="evening" className="segment-button">
              <IonLabel className="text-sm font-montserrat font-medium py-4">Вечер</IonLabel>
            </IonSegmentButton>
          </IonSegment>
          
          {/* Сетка временных слотов */}
          <div className="grid grid-cols-3 gap-3">
            {(selectedTimeView === 'morning' ? morningSlots : 
              selectedTimeView === 'afternoon' ? afternoonSlots : 
              eveningSlots).map((time, index) => (
              <div 
                key={index}
                onClick={() => handleTimeSelect(time)}
                className={`p-4 rounded-xl cursor-pointer transition-all duration-200 text-center ${
                  time === selectedTime
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg transform scale-105'
                    : 'bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-[#1e293b] dark:text-gray-200 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-center">
                  <IonIcon icon={timeOutline} className={`mr-2 text-lg ${
                    time === selectedTime ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'
                  }`} />
                  <p className={`font-montserrat font-semibold ${
                    time === selectedTime ? 'text-white' : 'text-[#1e293b] dark:text-gray-200'
                  }`}>
                    {time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
</IonModal>

{/* Модальное окно массового добавления дат */}
<IonModal 
  isOpen={isBatchModalOpen} 
  onDidDismiss={() => setIsBatchModalOpen(false)}
  className="date-picker-modal"
>
  <div className="bg-white dark:bg-gray-800 min-h-full flex flex-col">
    {/* Header */}
    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <h3 className="text-xl font-montserrat font-bold text-[#1e293b] dark:text-gray-200">
        Массовое добавление дат
      </h3>
      <IonButton fill="clear" onClick={() => setIsBatchModalOpen(false)} className="p-2">
        <IonIcon icon={closeOutline} className="text-[#1e293b] dark:text-gray-200 text-2xl" />
      </IonButton>
    </div>
    
    {/* Content */}
    <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      {/* Выбор диапазона дат */}
      <div className="mb-6">
        <h4 className="text-lg font-montserrat font-semibold text-[#1e293b] dark:text-gray-200 mb-4">
          Диапазон дат
        </h4>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <IonLabel className="text-sm font-montserrat text-[#475569] dark:text-gray-400">
              Начальная дата
            </IonLabel>
            <IonInput
              type="date"
              value={batchStartDate}
              onIonChange={e => setBatchStartDate(e.detail.value || '')}
              className="bg-white dark:bg-gray-800 rounded-lg mt-2"
            />
          </div>
          <div>
            <IonLabel className="text-sm font-montserrat text-[#475569] dark:text-gray-400">
              Конечная дата
            </IonLabel>
            <IonInput
              type="date"
              value={batchEndDate}
              onIonChange={e => setBatchEndDate(e.detail.value || '')}
              className="bg-white dark:bg-gray-800 rounded-lg mt-2"
            />
          </div>
        </div>
        
        {/* Исключить выходные */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl">
          <div>
            <h5 className="font-montserrat font-medium text-[#1e293b] dark:text-gray-200">
              Исключить выходные
            </h5>
            <p className="text-xs text-[#475569] dark:text-gray-400 font-montserrat">
              Не добавлять субботу и воскресенье
            </p>
          </div>
          <IonCheckbox 
            checked={excludeWeekends} 
            onIonChange={e => setExcludeWeekends(e.detail.checked)}
            className="text-[#6366f1] dark:text-[#818cf8]"
          />
        </div>
      </div>

      {/* Выбор временных слотов */}
      <div className="mb-6">
        <h4 className="text-lg font-montserrat font-semibold text-[#1e293b] dark:text-gray-200 mb-4">
          Временные слоты
        </h4>
        
        {/* Кнопки быстрого выбора */}
        <div className="flex flex-wrap gap-2 mb-4">
          <IonButton 
            size="small" 
            fill="outline"
            onClick={() => selectAllTimeSlots('morning')}
            className="rounded-lg font-montserrat"
          >
            Все утренние
          </IonButton>
          <IonButton 
            size="small" 
            fill="outline"
            onClick={() => selectAllTimeSlots('afternoon')}
            className="rounded-lg font-montserrat"
          >
            Все дневные
          </IonButton>
          <IonButton 
            size="small" 
            fill="outline"
            onClick={() => selectAllTimeSlots('evening')}
            className="rounded-lg font-montserrat"
          >
            Все вечерние
          </IonButton>
          <IonButton 
            size="small" 
            fill="outline"
            onClick={() => setSelectedTimeSlots([])}
            className="rounded-lg font-montserrat"
          >
            Очистить
          </IonButton>
        </div>
        
        {/* Сетка временных слотов */}
        <div className="space-y-4">
          {/* Утренние слоты */}
          <div>
            <h5 className="text-md font-montserrat font-medium text-[#1e293b] dark:text-gray-200 mb-3">
              Утренние слоты (8:00 - 11:30)
            </h5>
            <div className="grid grid-cols-4 gap-2">
              {DEFAULT_TIME_SLOTS.morning.map((time, index) => (
                <div
                  key={index}
                  onClick={() => toggleTimeSlot(time)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 text-center text-sm font-montserrat ${
                    selectedTimeSlots.includes(time)
                      ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md'
                      : 'bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-[#1e293b] dark:text-gray-200 shadow-sm'
                  }`}
                >
                  {time}
                </div>
              ))}
            </div>
          </div>
          
          {/* Дневные слоты */}
          <div>
            <h5 className="text-md font-montserrat font-medium text-[#1e293b] dark:text-gray-200 mb-3">
              Дневные слоты (12:00 - 16:30)
            </h5>
            <div className="grid grid-cols-4 gap-2">
              {DEFAULT_TIME_SLOTS.afternoon.map((time, index) => (
                <div
                  key={index}
                  onClick={() => toggleTimeSlot(time)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 text-center text-sm font-montserrat ${
                    selectedTimeSlots.includes(time)
                      ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md'
                      : 'bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-[#1e293b] dark:text-gray-200 shadow-sm'
                  }`}
                >
                  {time}
                </div>
              ))}
            </div>
          </div>
          
          {/* Вечерние слоты */}
          <div>
            <h5 className="text-md font-montserrat font-medium text-[#1e293b] dark:text-gray-200 mb-3">
              Вечерние слоты (17:00 - 20:30)
            </h5>
            <div className="grid grid-cols-4 gap-2">
              {DEFAULT_TIME_SLOTS.evening.map((time, index) => (
                <div
                  key={index}
                  onClick={() => toggleTimeSlot(time)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 text-center text-sm font-montserrat ${
                    selectedTimeSlots.includes(time)
                      ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md'
                      : 'bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-[#1e293b] dark:text-gray-200 shadow-sm'
                  }`}
                >
                  {time}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Выбранные слоты */}
        {selectedTimeSlots.length > 0 && (
          <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
            <p className="text-sm font-montserrat text-indigo-700 dark:text-indigo-300 mb-2">
              Выбрано слотов: {selectedTimeSlots.length}
            </p>
            <div className="flex flex-wrap gap-1">
              {selectedTimeSlots.slice(0, 10).map((time, index) => (
                <IonChip key={index} className="bg-indigo-100 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-300">
                  {time}
                </IonChip>
              ))}
              {selectedTimeSlots.length > 10 && (
                <IonChip className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  +{selectedTimeSlots.length - 10} еще
                </IonChip>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Прогресс бар при загрузке */}
      {batchLoading && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-montserrat text-[#1e293b] dark:text-gray-200">
              Добавление дат...
            </span>
            <span className="text-sm font-montserrat text-[#6366f1] dark:text-[#818cf8]">
              {batchProgress}%
            </span>
          </div>
          <IonProgressBar value={batchProgress / 100} className="rounded-full" />
        </div>
      )}

      {/* Кнопки действий */}
      <div className="flex space-x-3">
        <IonButton 
          onClick={handleBatchAdd}
          expand="block"
          disabled={batchLoading || !batchStartDate || !batchEndDate || selectedTimeSlots.length === 0}
          className="custom-button rounded-xl shadow-md text-base font-montserrat h-12 flex-1"
        >
          {batchLoading ? (
            <>
              <IonSpinner className="mr-2" />
              Добавление...
            </>
          ) : (
            <>
              <IonIcon icon={checkmarkOutline} slot="start" />
              Добавить даты
            </>
          )}
        </IonButton>
        
        <IonButton 
          onClick={resetBatchForm}
          fill="outline"
          className="rounded-xl shadow-md text-base font-montserrat h-12"
          disabled={batchLoading}
        >
          Сбросить
        </IonButton>
      </div>
    </div>
  </div>
</IonModal>
    </div>
  );
};

export default AdminCalendarPanel;