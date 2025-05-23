// components/UserCalendar.tsx - ПРОДАКШН ПОЛЬЗОВАТЕЛЬСКИЙ КАЛЕНДАРЬ
import React, { useState, useEffect } from 'react';
import {
  IonButton,
  IonIcon,
  IonModal,
  IonSpinner,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonChip,
  IonCard,
  IonCardContent
} from '@ionic/react';
import {
  calendarOutline,
  timeOutline,
  closeOutline,
  checkmarkCircleOutline,
  warningOutline
} from 'ionicons/icons';
import { getAvailableDates, isDateAvailable } from '../services/calendarService';

interface UserCalendarProps {
  onDateSelect: (dateTime: string) => void;
  selectedDate?: string;
  className?: string;
}

interface DateGroup {
  date: string;
  times: string[];
  formattedDate: string;
}

interface CalendarDay {
  date: string;
  displayDate: number;
  displayDay: string;
  displayMonth: string;
  isToday: boolean;
  isAvailable: boolean;
  fullDate: Date;
}

const UserCalendar: React.FC<UserCalendarProps> = ({ 
  onDateSelect, 
  selectedDate, 
  className = "" 
}) => {
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [selectedDateOnly, setSelectedDateOnly] = useState('');
  const [selectedTimeView, setSelectedTimeView] = useState('morning');

  // Генерация календарных дней
  const generateCalendarDays = (startDate = new Date()): CalendarDay[] => {
    const days: CalendarDay[] = [];
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate()); // Начинаем с сегодня
    
    // Генерируем следующие 30 дней
    for (let i = 0; i < 30; i++) {
      const dateString = currentDate.toISOString().split('T')[0];
      
      // Проверяем есть ли доступные времена на эту дату
      const hasAvailableTimes = availableDates.some(dateTime => {
        const availableDate = new Date(dateTime);
        return availableDate.toISOString().split('T')[0] === dateString;
      });
      
      days.push({
        date: dateString,
        displayDate: currentDate.getDate(),
        displayDay: currentDate.toLocaleDateString('en-GB', { weekday: 'short' }),
        displayMonth: currentDate.toLocaleDateString('en-GB', { month: 'short' }),
        isToday: i === 0,
        isAvailable: hasAvailableTimes,
        fullDate: new Date(currentDate)
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  useEffect(() => {
    fetchAvailableDates();
  }, []);

  const fetchAvailableDates = async () => {
    try {
      setLoading(true);
      setError('');
      
      const dates = await getAvailableDates();
      setAvailableDates(dates);
      
      if (dates.length === 0) {
        setError('В данный момент нет доступных дат для записи. Пожалуйста, свяжитесь с нами для уточнения расписания.');
      }
      
    } catch (err) {
      console.error('Error fetching available dates:', err);
      setError('Не удалось загрузить доступные даты. Попробуйте обновить страницу.');
    } finally {
      setLoading(false);
    }
  };

  // Группировка дат по дням
  const getFormattedAvailableDates = (): DateGroup[] => {
    const dateGroups: {[key: string]: string[]} = {};
    
    availableDates.forEach(dateTime => {
      const date = new Date(dateTime);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = [];
      }
      
      dateGroups[dateKey].push(dateTime);
    });
    
    return Object.entries(dateGroups)
      .map(([date, times]) => ({
        date,
        times,
        formattedDate: formatDateToEuropean(date)
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Получение доступных времен для конкретной даты
  const getAvailableTimesForDate = (dateStr: string) => {
    const dateTimes = availableDates.filter(dateTime => {
      const date = new Date(dateTime);
      return date.toISOString().split('T')[0] === dateStr;
    });
    
    return dateTimes.map(dateTime => {
      const date = new Date(dateTime);
      return {
        value: dateTime,
        display: date.toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false
        }),
        period: getTimePeriod(date.getHours())
      };
    }).sort((a, b) => a.value.localeCompare(b.value));
  };

  const getTimePeriod = (hour: number): 'morning' | 'afternoon' | 'evening' => {
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const formatDateToEuropean = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).replace(/,/, '');
  };

  const formatSelectedDateTime = (dateTime: string): string => {
    const date = new Date(dateTime);
    return `${formatDateToEuropean(dateTime.split('T')[0])} в ${date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    })}`;
  };

  const handleDateSelect = (date: string) => {
    setSelectedDateOnly(date);
    setShowDatePicker(false);
    setIsTimeModalOpen(true);
  };

  const handleTimeSelect = (dateTime: string) => {
    onDateSelect(dateTime);
    setIsTimeModalOpen(false);
  };

  const getFilteredTimes = () => {
    if (!selectedDateOnly) return [];
    
    const times = getAvailableTimesForDate(selectedDateOnly);
    
    if (selectedTimeView === 'all') {
      return times;
    }
    
    return times.filter(time => time.period === selectedTimeView);
  };

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 ${className}`}>
        <IonSpinner name="crescent" className="text-[#6366f1] w-8 h-8" />
        <p className="mt-2 text-sm text-[#475569] dark:text-gray-400 font-montserrat">
          Загрузка доступных дат...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <IonCard className={`rounded-xl overflow-hidden shadow-md ${className}`}>
        <IonCardContent className="p-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
              <IonIcon icon={warningOutline} className="text-orange-600 dark:text-orange-400 text-2xl" />
            </div>
            <p className="text-[#475569] dark:text-gray-400 font-montserrat text-sm leading-relaxed">
              {error}
            </p>
            <IonButton 
              onClick={fetchAvailableDates}
              fill="outline"
              size="small"
              className="mt-4 rounded-lg"
            >
              Попробовать снова
            </IonButton>
          </div>
        </IonCardContent>
      </IonCard>
    );
  }

  return (
    <div className={className}>
      {/* Кнопка выбора даты */}
      <IonButton
        expand="block"
        onClick={() => setShowDatePicker(true)}
        className="custom-button rounded-xl shadow-md text-base font-montserrat h-12 mb-4"
        disabled={availableDates.length === 0}
      >
        <IonIcon icon={calendarOutline} slot="start" />
        {availableDates.length === 0 ? 'Нет доступных дат' : 'Выбрать дату и время'}
      </IonButton>
      
      {/* Показываем выбранную дату */}
      {selectedDate && (
        <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-3 flex items-center mb-4">
          <IonIcon icon={checkmarkCircleOutline} className="text-[#6366f1] dark:text-[#818cf8] text-xl mr-3" />
          <div>
            <p className="text-xs text-[#475569] dark:text-gray-400 font-montserrat">Выбранное время</p>
            <p className="text-sm font-medium text-[#1e293b] dark:text-gray-200 font-montserrat">
              {formatSelectedDateTime(selectedDate)}
            </p>
          </div>
        </div>
      )}

      {/* Модальное окно выбора даты */}
      <IonModal 
        isOpen={showDatePicker} 
        onDidDismiss={() => setShowDatePicker(false)}
        className="date-picker-modal"
      >
        <div className="bg-white dark:bg-gray-800 min-h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h3 className="text-xl font-montserrat font-bold text-[#1e293b] dark:text-gray-200">
              Выберите дату
            </h3>
            <IonButton fill="clear" onClick={() => setShowDatePicker(false)} className="p-2">
              <IonIcon icon={closeOutline} className="text-[#1e293b] dark:text-gray-200 text-2xl" />
            </IonButton>
          </div>
          
          {/* Content */}
          <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
            {/* Календарная сетка */}
            <div className="mb-8">
              <h4 className="text-lg font-montserrat font-semibold text-[#1e293b] dark:text-gray-200 mb-4">
                {new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
              </h4>
              
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
                    onClick={() => day.isAvailable ? handleDateSelect(day.date) : null}
                    className={`h-14 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-200 relative ${
                      day.date === selectedDateOnly
                        ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg transform scale-105'
                        : day.isToday
                          ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-300 dark:border-indigo-600'
                          : day.isAvailable
                            ? 'bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-[#1e293b] dark:text-gray-200 shadow-sm hover:shadow-md'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-base font-montserrat font-medium">{day.displayDate}</span>
                    {day.isAvailable && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Быстрый выбор */}
            <div className="mb-6">
              <h4 className="text-lg font-montserrat font-semibold text-[#1e293b] dark:text-gray-200 mb-4">
                Ближайшие доступные даты
              </h4>
              
              <div className="flex overflow-x-auto pb-3 space-x-4 scrollbar-hide">
                {getFormattedAvailableDates().slice(0, 10).map((dateGroup, index) => (
                  <div 
                    key={index}
                    onClick={() => handleDateSelect(dateGroup.date)}
                    className={`flex-shrink-0 p-4 rounded-xl cursor-pointer transition-all duration-200 min-w-max ${
                      dateGroup.date === selectedDateOnly
                        ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg transform scale-105'
                        : 'bg-white dark:bg-gray-800 text-[#1e293b] dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <p className="text-center font-montserrat font-medium whitespace-nowrap text-sm">
                      {new Date(dateGroup.date).toLocaleDateString('ru-RU', { weekday: 'short' })}
                    </p>
                    <p className="text-center font-montserrat font-bold whitespace-nowrap">
                      {new Date(dateGroup.date).getDate()} {new Date(dateGroup.date).toLocaleDateString('ru-RU', { month: 'short' })}
                    </p>
                    <p className="text-center text-xs mt-1 opacity-75">
                      {dateGroup.times.length} слот{dateGroup.times.length !== 1 ? 'ов' : ''}
                    </p>
                  </div>
                ))}
              </div>
              
              {getFormattedAvailableDates().length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-sm">
                  <IonIcon icon={calendarOutline} className="text-4xl text-gray-400 dark:text-gray-600 mb-4" />
                  <p className="text-center text-[#475569] dark:text-gray-400 font-montserrat text-lg">
                    Нет доступных дат
                  </p>
                </div>
              )}
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
            {selectedDateOnly && (
              <div>
                {/* Информация о выбранной дате */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 flex items-center shadow-sm">
                  <IonIcon icon={calendarOutline} className="text-indigo-600 dark:text-indigo-400 text-2xl mr-4" />
                  <div>
                    <p className="text-sm text-[#475569] dark:text-gray-400 font-montserrat mb-1">Выбранная дата</p>
                    <p className="text-lg font-semibold text-[#1e293b] dark:text-gray-200 font-montserrat">
                      {formatDateToEuropean(selectedDateOnly)}
                    </p>
                  </div>
                </div>

                {/* Фильтр по времени */}
                <IonSegment 
                  value={selectedTimeView} 
                  onIonChange={e => setSelectedTimeView(e.detail.value as string)}
                  className="mb-8 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm"
                >
                  <IonSegmentButton value="morning" className="segment-button">
                    <IonLabel className="text-sm font-montserrat font-medium py-4">Утром</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="afternoon" className="segment-button">
                    <IonLabel className="text-sm font-montserrat font-medium py-4">Днем</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="evening" className="segment-button">
                    <IonLabel className="text-sm font-montserrat font-medium py-4">Вечером</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="all" className="segment-button">
                    <IonLabel className="text-sm font-montserrat font-medium py-4">Все</IonLabel>
                  </IonSegmentButton>
                </IonSegment>
                
                {/* Временные слоты */}
                <div className="grid grid-cols-2 gap-3">
                  {getFilteredTimes().map((time, index) => (
                    <div 
                      key={index}
                      onClick={() => handleTimeSelect(time.value)}
                      className="bg-white dark:bg-gray-800 p-4 rounded-xl cursor-pointer transition-all duration-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center justify-center">
                        <IonIcon icon={timeOutline} className="mr-3 text-indigo-600 dark:text-indigo-400 text-xl" />
                        <p className="text-center font-montserrat font-semibold text-[#1e293b] dark:text-gray-200 text-lg">
                          {time.display}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {getFilteredTimes().length === 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-sm">
                    <IonIcon icon={timeOutline} className="text-4xl text-gray-400 dark:text-gray-600 mb-4" />
                    <p className="text-center text-[#475569] dark:text-gray-400 font-montserrat text-lg">
                      Нет доступного времени в выбранном периоде
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </IonModal>
    </div>
  );
};

export default UserCalendar;