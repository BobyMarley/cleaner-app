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
  IonLabel
} from '@ionic/react';
import { auth, onAuthStateChanged } from '../services/firebase';
import { addAvailableDate, getAvailableDatesWithIds, deleteAvailableDate } from '../services/calendarService';
import { 
  trashOutline, 
  chevronBackOutline, 
  addOutline, 
  calendarOutline, 
  timeOutline, 
  closeOutline,
  sunnyOutline,
  moonOutline,
  checkmarkOutline
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';

const adminEmails = ['plenkanet@gmail.com'];

// Date formatting helpers
const formatDateToEuropean = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).replace(/,/, '');
};

const formatShortDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [newDate, setNewDate] = useState<string>('');
  const [availableDates, setAvailableDates] = useState<Array<{id: string, date: string}>>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedTimeView, setSelectedTimeView] = useState('morning');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  // Generate calendar data
  const generateCalendarDays = (startDate = new Date()) => {
    const days = [];
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate()); // Start from today
    
    // Generate next 30 days
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

  // Generate time slots
  const generateTimeSlots = () => {
    const morningSlots = [];
    const afternoonSlots = [];
    const eveningSlots = [];
    
    // Morning: 8:00 - 11:30
    for (let hour = 8; hour < 12; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        morningSlots.push(time);
      }
    }
    
    // Afternoon: 12:00 - 16:30
    for (let hour = 12; hour < 17; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        afternoonSlots.push(time);
      }
    }
    
    // Evening: 17:00 - 20:30
    for (let hour = 17; hour < 21; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        eveningSlots.push(time);
      }
    }
    
    return { morningSlots, afternoonSlots, eveningSlots };
  };

  const calendarDays = generateCalendarDays();
  const { morningSlots, afternoonSlots, eveningSlots } = generateTimeSlots();

  useEffect(() => {
    // Check dark mode preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    }

    const unsub = onAuthStateChanged(auth, user => {
      if (!user || !adminEmails.includes(user.email || '')) {
        navigate('/');
      } else {
        loadDates();
      }
      setLoading(false);
    });
    return () => unsub();
  }, [navigate]);

  const loadDates = async () => {
    try {
      setLoading(true);
      const dates = await getAvailableDatesWithIds();
      setAvailableDates(dates);
    } catch (error) {
      setToastMessage('Error loading dates');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setIsDateModalOpen(false);
    setIsTimeModalOpen(true);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    
    // Combine date and time
    const dateObj = new Date(selectedDate);
    const [hours, minutes] = time.split(':').map(Number);
    dateObj.setHours(hours, minutes, 0, 0);
    
    setNewDate(dateObj.toISOString());
    setIsTimeModalOpen(false);
    
    // Automatically add the date after selection
    handleAdd(dateObj.toISOString());
  };

  const handleAdd = async (dateTimeString = newDate) => {
    if (!dateTimeString) {
      setToastMessage('Please select date and time');
      setShowToast(true);
      return;
    }
    
    try {
      await addAvailableDate(dateTimeString);
      await loadDates();
      setNewDate('');
      setSelectedDate('');
      setSelectedTime('');
      setToastMessage('Date added successfully');
      setShowToast(true);
    } catch (error) {
      setToastMessage('Error adding date');
      setShowToast(true);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAvailableDate(id);
      await loadDates();
      setToastMessage('Date deleted successfully');
      setShowToast(true);
    } catch (error) {
      setToastMessage('Error deleting date');
      setShowToast(true);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const goBack = () => navigate('/');

  const openAddDateModal = () => {
    setSelectedDate('');
    setSelectedTime('');
    setNewDate('');
    setIsDateModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-[#f1f5f9] to-[#ddd6fe] dark:from-[#1e293b] dark:to-[#312e81]">
        <IonSpinner name="crescent" className="text-[#6366f1] w-12 h-12" />
        <p className="mt-4 text-[#1e293b] dark:text-white font-montserrat">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <IonHeader>
        <IonToolbar className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] shadow-lg">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <IonButton fill="clear" onClick={goBack} className="text-white mr-2 p-0">
                <IonIcon icon={chevronBackOutline} className="text-xl" />
              </IonButton>
              <span className="text-white font-montserrat text-xl font-bold tracking-tight">Admin Panel</span>
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
        <div className="flex justify-end mb-4">
          <IonButton 
            onClick={openAddDateModal} 
            className="custom-button rounded-xl shadow-md text-base font-montserrat"
          >
            <IonIcon icon={addOutline} slot="start" />
            Add Available Date
          </IonButton>
        </div>

        <IonCard className="rounded-xl overflow-hidden shadow-lg">
          <IonCardContent className="p-4">
            <h3 className="font-montserrat font-semibold text-lg text-[#1e293b] dark:text-gray-200 mb-4">
              Available Dates
            </h3>
            
            {availableDates.length === 0 ? (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                  <IonIcon icon={calendarOutline} className="text-indigo-600 dark:text-indigo-400 text-2xl" />
                </div>
                <p className="text-[#475569] dark:text-gray-400 font-montserrat">
                  No available dates. Add some using the button above.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableDates.map((dateObj, idx) => (
                  <div 
                    key={idx} 
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
                        <div className="flex items-center text-sm text-[#475569] dark:text-gray-400 font-montserrat">
                          <IonIcon icon={timeOutline} className="mr-1 text-xs" />
                          <span>
                            {new Date(dateObj.date).toLocaleTimeString('ru-RU', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hourCycle: 'h23'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <IonButton 
                      fill="clear" 
                      onClick={() => handleDelete(dateObj.id)}
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

      {/* Date Picker Modal - ИСПРАВЛЕННЫЙ */}
      <IonModal 
        isOpen={isDateModalOpen} 
        onDidDismiss={() => setIsDateModalOpen(false)}
        className="date-picker-modal"
      >
        <div className="bg-white dark:bg-gray-800 min-h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h3 className="text-xl font-montserrat font-bold text-[#1e293b] dark:text-gray-200">
              Select Date
            </h3>
            <IonButton fill="clear" onClick={() => setIsDateModalOpen(false)} className="p-2">
              <IonIcon icon={closeOutline} className="text-[#1e293b] dark:text-gray-200 text-2xl" />
            </IonButton>
          </div>
          
          {/* Content with proper padding */}
          <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
            {/* Calendar Month View */}
            <div className="mb-8">
              <div className="mb-6 flex items-center justify-between">
                <h4 className="text-lg font-montserrat font-semibold text-[#1e293b] dark:text-gray-200">
                  {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                </h4>
              </div>
              
              {/* Days of Week Header */}
              <div className="grid grid-cols-7 mb-4 gap-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <div key={index} className="text-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 font-montserrat py-3">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Grid - Improved spacing */}
              <div className="grid grid-cols-7 gap-2">
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
            
            {/* Quick Date Selection */}
            <div className="mb-6">
              <h4 className="text-lg font-montserrat font-semibold text-[#1e293b] dark:text-gray-200 mb-4">
                Quick Select
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

      {/* Time Picker Modal - ИСПРАВЛЕННЫЙ */}
      <IonModal 
        isOpen={isTimeModalOpen} 
        onDidDismiss={() => setIsTimeModalOpen(false)}
        className="date-picker-modal"
      >
        <div className="bg-white dark:bg-gray-800 min-h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h3 className="text-xl font-montserrat font-bold text-[#1e293b] dark:text-gray-200">
              Select Time
            </h3>
            <IonButton fill="clear" onClick={() => setIsTimeModalOpen(false)} className="p-2">
              <IonIcon icon={closeOutline} className="text-[#1e293b] dark:text-gray-200 text-2xl" />
            </IonButton>
          </div>
          
          {/* Content with proper padding */}
          <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
            {selectedDate && (
              <div>
                {/* Selected Date Display */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 flex items-center shadow-sm">
                  <IonIcon icon={calendarOutline} className="text-indigo-600 dark:text-indigo-400 text-2xl mr-4" />
                  <div>
                    <p className="text-sm text-[#475569] dark:text-gray-400 font-montserrat mb-1">Selected Date</p>
                    <p className="text-lg font-semibold text-[#1e293b] dark:text-gray-200 font-montserrat">
                      {formatShortDate(selectedDate)}
                    </p>
                  </div>
                </div>

                {/* Time Period Selector */}
                <IonSegment 
                  value={selectedTimeView} 
                  onIonChange={e => setSelectedTimeView(e.detail.value as string)}
                  className="mb-8 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm"
                >
                  <IonSegmentButton value="morning" className="segment-button">
                    <IonLabel className="text-sm font-montserrat font-medium py-4">Morning</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="afternoon" className="segment-button">
                    <IonLabel className="text-sm font-montserrat font-medium py-4">Afternoon</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="evening" className="segment-button">
                    <IonLabel className="text-sm font-montserrat font-medium py-4">Evening</IonLabel>
                  </IonSegmentButton>
                </IonSegment>
                
                {/* Time Slots Grid */}
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

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="bottom"
        color={toastMessage.includes('Error') ? 'danger' : 'success'}
        className="font-montserrat"
      />
    </div>
  );
};

export default AdminPanel;