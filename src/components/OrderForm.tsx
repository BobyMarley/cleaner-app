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
  IonDatetime,
  IonModal,
  IonSpinner,
  IonAlert,
  IonFooter,
  IonTabBar,
  IonTabButton,
  IonContent
} from '@ionic/react';
import { addOrder, auth } from '../services/firebase';
import { sendOrderToTelegram } from '../services/telegram';
import { getAvailableDates, reserveDate } from '../services/calendarService';
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
  chatbubbleOutline,
  notificationsOutline,
  closeOutline
} from 'ionicons/icons';
import { useNavigate, useLocation } from 'react-router-dom';

// Helper function for European date format
const formatDateToEuropean = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).replace(/,/, '');
};

const OrderForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [carpetArea, setCarpetArea] = useState<string>('');
  const [chairCount, setChairCount] = useState<number>(0);
  const [armchairCount, setArmchairCount] = useState<number>(0);
  const [sofaCount, setSofaCount] = useState<number>(0);
  const [mattressCount, setMattressCount] = useState<number>(0);
  const [withPillows, setWithPillows] = useState<boolean>(false);
  const [additionalInfo, setAdditionalInfo] = useState<string>('');
  const [images, setImages] = useState<File[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('furniture');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isDateModalOpen, setIsDateModalOpen] = useState<boolean>(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showAuthAlert, setShowAuthAlert] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  useEffect(() => {
    // Check authorization
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      setLoading(false);
      
      // Load available dates
      if (user) {
        fetchAvailableDates();
      }
    });

    // Set active tab from URL
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['furniture', 'carpet', 'mattress', 'additional'].includes(tab)) {
      setActiveTab(tab);
    }

    // Check dark mode preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    }

    return () => unsubscribe();
  }, [location]);

  const fetchAvailableDates = async () => {
    try {
      setLoading(true);
      const dates = await getAvailableDates();
      console.log('Available dates from Firebase:', dates);
      if (dates.length === 0) {
        const testDates = [
          '2025-05-15T12:30:00.000Z',
          '2025-05-16T14:00:00.000Z',
          '2025-05-17T09:30:00.000Z',
        ];
        setAvailableDates(testDates);
        console.log('Firebase empty, using test dates:', testDates);
      } else {
        setAvailableDates(dates);
      }
    } catch (error) {
      console.error('Error loading available dates:', error);
      const testDates = [
        '2025-05-15T12:30:00.000Z',
        '2025-05-16T14:00:00.000Z',
        '2025-05-17T09:30:00.000Z',
      ];
      setAvailableDates(testDates);
      console.log('Error occurred, using test dates:', testDates);
    } finally {
      setLoading(false);
    }
  };

  const goToHome = () => navigate('/');
  const goToLogin = () => navigate('/login');
  const goToProfile = () => navigate('/profile');

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

    const order = {
      userId: user.uid,
      carpetArea,
      chairCount,
      armchairCount,
      sofaCount,
      mattressCount,
      withPillows,
      additionalInfo,
      images: images.map(file => file.name),
      createdAt: new Date().toISOString(),
      scheduledDate,
      price: calculatePrice(),
    };

    try {
      await addOrder(order);
      if (scheduledDate) {
        await reserveDate(scheduledDate);
      }
      await sendOrderToTelegram(order);
      window.alert('Order successfully sent!');
      navigate('/');
    } catch (error) {
      console.error('Error sending order:', error);
      window.alert('An error occurred. Please try again.');
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
      return `${minutes} min`;
    } else if (minutes === 0) {
      return `${fullHours} h`;
    } else {
      return `${fullHours} h ${minutes} min`;
    }
  };

  const isDateEnabled = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // First, check if the date is in the future
    if (date < today) {
      return false;
    }
    
    // Then check if it's in our available dates
    return availableDates.some(availableDate => {
      const available = new Date(availableDate);
      return date.getFullYear() === available.getFullYear() && 
             date.getMonth() === available.getMonth() && 
             date.getDate() === available.getDate();
    });
  };

  const getFormattedAvailableDates = () => {
    // Group available times by date
    const dateGroups: {[key: string]: string[]} = {};
    
    availableDates.forEach(dateTime => {
      const date = new Date(dateTime);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = [];
      }
      
      dateGroups[dateKey].push(dateTime);
    });
    
    return Object.entries(dateGroups).map(([date, times]) => ({
      date,
      times,
      formattedDate: formatDateToEuropean(date)
    }));
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setShowDatePicker(false);
    setIsTimeModalOpen(true);
  };

  const getAvailableTimesForDate = (dateStr: string) => {
    const dateTimes = availableDates.filter(dateTime => {
      const date = new Date(dateTime);
      return date.toISOString().split('T')[0] === dateStr;
    });
    
    return dateTimes.map(dateTime => {
      const date = new Date(dateTime);
      return {
        value: dateTime,
        display: date.toLocaleTimeString('ru-RU', { 
          hour: '2-digit', 
          minute: '2-digit',
          hourCycle: 'h23'
        })
      };
    });
  };

  const handleTimeSelect = (time: string) => {
    setScheduledDate(time);
    setIsTimeModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-[#f1f5f9] to-[#ddd6fe] dark:from-[#1e293b] dark:to-[#312e81]">
        <IonSpinner name="crescent" className="text-[#6366f1] w-12 h-12" />
        <p className="mt-4 text-[#1e293b] dark:text-white font-montserrat">Loading...</p>
      </div>
    );
  }

  // If user is not authenticated, show notification with login suggestion
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#f1f5f9] to-[#ddd6fe] dark:from-[#1e293b] dark:to-[#312e81] px-6 py-8">
        <div className="w-24 h-24 mb-6 bg-[#6366f1] rounded-full flex items-center justify-center shadow-lg">
          <IonIcon icon={lockClosedOutline} className="text-white text-4xl" />
        </div>
        
        <h2 className="text-2xl font-montserrat font-bold text-[#1e293b] dark:text-white mb-4 text-center">
          Authentication Required
        </h2>
        
        <p className="text-center text-[#475569] dark:text-gray-300 font-montserrat mb-8 max-w-md">
          You need to log in or register to place an order
        </p>
        
        <div className="flex flex-col w-full max-w-xs space-y-4">
          <IonButton 
            onClick={goToLogin} 
            expand="block" 
            className="custom-button rounded-xl shadow-lg text-base font-montserrat h-14 w-full"
          >
            <IonIcon icon={personOutline} className="mr-2" />
            Log In
          </IonButton>
          
          <IonButton 
            onClick={goToHome} 
            fill="outline" 
            expand="block" 
            className="rounded-xl shadow-md text-base font-montserrat h-14 w-full"
          >
            <IonIcon icon={homeOutline} className="mr-2" />
            Home
          </IonButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <IonAlert
        isOpen={showAuthAlert}
        onDidDismiss={() => setShowAuthAlert(false)}
        header="Authentication Required"
        message="You need to log in or register to place an order"
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: 'Log In',
            handler: () => {
              navigate('/login');
            },
          },
        ]}
      />

      <IonHeader>
        <IonToolbar className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] shadow-lg">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <IonButton fill="clear" onClick={goToHome} className="text-white mr-2 p-0">
                <IonIcon icon={chevronBackOutline} className="text-xl" />
              </IonButton>
              <span className="text-white font-montserrat text-xl font-bold tracking-tight">New Order</span>
            </div>
            <div className="flex items-center space-x-3">
              <IonButton fill="clear" onClick={toggleDarkMode} className="text-white">
                <IonIcon icon={isDarkMode ? sunnyOutline : moonOutline} className="text-xl" />
              </IonButton>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonCard className="mx-4 my-4 rounded-xl overflow-hidden shadow-lg">
        <IonCardContent className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-montserrat font-semibold text-lg text-[#1e293b] dark:text-gray-200">
              Order Summary
            </h3>
            <IonChip className="font-montserrat bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              <IonIcon icon={checkmarkCircleOutline} className="mr-1" />
              Ready to Send
            </IonChip>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-2">
            <div className="flex items-center p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
              <IonIcon icon={timeOutline} className="text-[#6366f1] dark:text-[#818cf8] text-xl mr-2" />
              <div>
                <p className="text-xs text-[#475569] dark:text-gray-400 font-montserrat">Estimated Time</p>
                <p className="text-sm font-medium text-[#1e293b] dark:text-gray-200 font-montserrat">{calculateTime()}</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
              <IonIcon icon={cashOutline} className="text-[#6366f1] dark:text-[#818cf8] text-xl mr-2" />
              <div>
                <p className="text-xs text-[#475569] dark:text-gray-400 font-montserrat">Estimated Cost</p>
                <p className="text-sm font-medium text-[#1e293b] dark:text-gray-200 font-montserrat">{calculatePrice()}</p>
              </div>
            </div>
          </div>
        </IonCardContent>
      </IonCard>

      <div className="flex flex-wrap px-4 mb-4">
        <button
          onClick={() => setActiveTab('furniture')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full mr-1.5 mb-1.5 font-montserrat font-medium text-sm transition-colors ${
            activeTab === 'furniture'
              ? 'bg-[#6366f1] text-white'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          Furniture
        </button>
        <button
          onClick={() => setActiveTab('carpet')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full mr-1.5 mb-1.5 font-montserrat font-medium text-sm transition-colors ${
            activeTab === 'carpet'
              ? 'bg-[#6366f1] text-white'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          Carpets
        </button>
        <button
          onClick={() => setActiveTab('mattress')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full mr-1.5 mb-1.5 font-montserrat font-medium text-sm transition-colors ${
            activeTab === 'mattress'
              ? 'bg-[#6366f1] text-white'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          Mattresses
        </button>
        <button
          onClick={() => setActiveTab('additional')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full mr-1.5 mb-1.5 font-montserrat font-medium text-sm transition-colors ${
            activeTab === 'additional'
              ? 'bg-[#6366f1] text-white'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          Additional
        </button>
      </div>

      <form onSubmit={handleSubmit} className="px-4 pb-20">
        {activeTab === 'furniture' && (
          <div className="space-y-4">
            <IonCard className="m-0 rounded-xl overflow-hidden shadow-md">
              <IonCardContent className="p-0">
                <div className="flex items-center p-4">
                  <div className="bg-purple-100 dark:bg-purple-900 rounded-lg h-12 w-12 flex items-center justify-center mr-4">
                    <IonIcon icon={homeOutline} className="text-[#6366f1] dark:text-[#818cf8] text-xl" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-montserrat font-semibold text-[#1e293b] dark:text-gray-200 mb-1">
                      Sofas
                    </h3>
                    <p className="text-xs font-montserrat text-[#475569] dark:text-gray-400">
                      ~1.5 hours per sofa
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
                      With Pillows
                    </h3>
                    <p className="text-xs font-montserrat text-[#475569] dark:text-gray-400">
                      Cleaning pillows and removable elements
                    </p>
                  </div>
                  <IonCheckbox checked={withPillows} onIonChange={(e) => setWithPillows(e.detail.checked)} className="text-[#6366f1] dark:text-[#818cf8]" />
                </div>
              </IonCardContent>
            </IonCard>

            <IonCard className="m-0 rounded-xl overflow-hidden shadow-md">
              <IonCardContent className="p-0">
                <div className="flex items-center p-4">
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-lg h-12 w-12 flex items-center justify-center mr-4">
                    <IonIcon icon={cubeOutline} className="text-[#6366f1] dark:text-[#818cf8] text-xl" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-montserrat font-semibold text-[#1e293b] dark:text-gray-200 mb-1">
                      Armchairs
                    </h3>
                    <p className="text-xs font-montserrat text-[#475569] dark:text-gray-400">
                      ~45 minutes per armchair
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

            <IonCard className="m-0 rounded-xl overflow-hidden shadow-md">
              <IonCardContent className="p-0">
                <div className="flex items-center p-4">
                  <div className="bg-indigo-100 dark:bg-indigo-900 rounded-lg h-12 w-12 flex items-center justify-center mr-4">
                    <IonIcon icon={gridOutline} className="text-[#6366f1] dark:text-[#818cf8] text-xl" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-montserrat font-semibold text-[#1e293b] dark:text-gray-200 mb-1">
                      Chairs
                    </h3>
                    <p className="text-xs font-montserrat text-[#475569] dark:text-gray-400">
                      ~30 minutes per chair
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
                        Carpet Area
                      </h3>
                      <p className="text-xs font-montserrat text-[#475569] dark:text-gray-400">
                        Specify area in square meters
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
                        m² (600zł per m²)
                      </span>
                    </div>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          </div>
        )}

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
                      Mattresses
                    </h3>
                    <p className="text-xs font-montserrat text-[#475569] dark:text-gray-400">
                      ~1 hour per mattress
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

        {activeTab === 'additional' && (
          <div className="space-y-4">
            <IonCard className="m-0 rounded-xl overflow-hidden shadow-md">
              <IonCardContent className="p-0">
                <div className="p-4">
                  <div className="flex items-center mb-4">
                    <div className="bg-yellow-100 dark:bg-yellow-900 rounded-lg h-12 w-12 flex items-center justify-center mr-4">
                      <IonIcon icon={documentTextOutline} className="text-[#6366f1] dark:text-[#818cf8] text-xl" />
                    </div>
                    <div>
                      <h3 className="text-base font-montserrat font-semibold text-[#1e293b] dark:text-gray-200 mb-1">
                        Additional Information
                      </h3>
                      <p className="text-xs font-montserrat text-[#475569] dark:text-gray-400">
                        Describe order details
                      </p>
                    </div>
                  </div>

                  <IonTextarea
                    value={additionalInfo}
                    onIonChange={(e) => setAdditionalInfo(e.detail.value || '')}
                    placeholder="Describe your preferences, address, and contact information"
                    className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 h-32 text-[#1e293b] dark:text-gray-200 font-montserrat"
                    rows={4}
                  />
                </div>
              </IonCardContent>
            </IonCard>

            <IonCard className="m-0 rounded-xl overflow-hidden shadow-md">
              <IonCardContent className="p-0">
                <div className="p-4">
                  <div className="flex items-center mb-4">
                    <div className="bg-pink-100 dark:bg-pink-900 rounded-lg h-12 w-12 flex items-center justify-center mr-4">
                      <IonIcon icon={imageOutline} className="text-[#6366f1] dark:text-[#818cf8] text-xl" />
                    </div>
                    <div>
                      <h3 className="text-base font-montserrat font-semibold text-[#1e293b] dark:text-gray-200 mb-1">
                        Photos
                      </h3>
                      <p className="text-xs font-montserrat text-[#475569] dark:text-gray-400">
                        Attach photos of items to be cleaned
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
                      Choose Photos
                    </label>
                    {images.length > 0 && (
                      <p className="mt-2 text-xs font-montserrat text-[#475569] dark:text-gray-400">
                        Selected files: {images.length}
                      </p>
                    )}
                  </div>
                </div>
              </IonCardContent>
            </IonCard>

            {/* ИСПРАВЛЕННЫЙ Calendar Card */}
            <IonCard className="m-0 rounded-xl overflow-hidden shadow-md">
              <IonCardContent className="p-4">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-lg h-12 w-12 flex items-center justify-center mr-4">
                    <IonIcon icon={calendarOutline} className="text-[#6366f1] dark:text-[#818cf8] text-xl" />
                  </div>
                  <div>
                    <h3 className="text-base font-montserrat font-semibold text-[#1e293b] dark:text-gray-200 mb-1">
                      Date and Time
                    </h3>
                    <p className="text-xs font-montserrat text-[#475569] dark:text-gray-400">
                      Choose date and time for pre-order
                    </p>
                  </div>
                </div>
                
                <IonButton
                  expand="block"
                  onClick={() => setShowDatePicker(true)}
                  className="custom-button rounded-xl shadow-md text-base font-montserrat h-12 mb-4"
                >
                  <IonIcon icon={calendarOutline} slot="start" />
                  Select Date and Time
                </IonButton>
                
                {scheduledDate && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-3 flex items-center">
                    <IonIcon icon={timeOutline} className="text-[#6366f1] dark:text-[#818cf8] text-xl mr-3" />
                    <div>
                      <p className="text-xs text-[#475569] dark:text-gray-400 font-montserrat">Selected Date</p>
                      <p className="text-sm font-medium text-[#1e293b] dark:text-gray-200 font-montserrat">
                        {formatDateToEuropean(scheduledDate)} at {new Date(scheduledDate).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}
                      </p>
                    </div>
                  </div>
                )}
              </IonCardContent>
            </IonCard>
            
            {/* ИСПРАВЛЕННЫЙ Custom Date Picker Modal */}
            <IonModal 
              isOpen={showDatePicker} 
              onDidDismiss={() => setShowDatePicker(false)}
              className="date-picker-modal"
            >
              <div className="bg-white dark:bg-gray-800 min-h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <h3 className="text-xl font-montserrat font-bold text-[#1e293b] dark:text-gray-200">
                    Select Date
                  </h3>
                  <IonButton fill="clear" onClick={() => setShowDatePicker(false)} className="p-2">
                    <IonIcon icon={closeOutline} className="text-[#1e293b] dark:text-gray-200 text-2xl" />
                  </IonButton>
                </div>
                
                {/* Content with proper padding */}
                <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
                  <div className="mb-8">
                    <p className="text-lg font-montserrat font-semibold text-[#1e293b] dark:text-gray-200 mb-4">
                      Available dates:
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {getFormattedAvailableDates().map((dateGroup, index) => (
                        <div 
                          key={index}
                          onClick={() => handleDateSelect(dateGroup.date)}
                          className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                            selectedDate === dateGroup.date
                              ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg transform scale-105'
                              : 'bg-white dark:bg-gray-800 text-[#1e293b] dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 shadow-sm hover:shadow-md'
                          }`}
                        >
                          <p className="text-center font-montserrat font-semibold text-base">
                            {new Date(dateGroup.date).toLocaleDateString('en-GB', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                            })}
                          </p>
                          <p className="text-center text-sm font-montserrat mt-2 opacity-75">
                            {dateGroup.times.length} time slot{dateGroup.times.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                    
                    {getFormattedAvailableDates().length === 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-sm">
                        <IonIcon icon={calendarOutline} className="text-4xl text-gray-400 dark:text-gray-600 mb-4" />
                        <p className="text-center text-[#475569] dark:text-gray-400 font-montserrat text-lg">
                          No available dates
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </IonModal>
            
            {/* ИСПРАВЛЕННЫЙ Time Picker Modal */}
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
                            {formatDateToEuropean(selectedDate)}
                          </p>
                        </div>
                      </div>

                      <p className="text-lg font-montserrat font-semibold text-[#1e293b] dark:text-gray-200 mb-4">
                        Available times:
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {getAvailableTimesForDate(selectedDate).map((time, index) => (
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
                      
                      {getAvailableTimesForDate(selectedDate).length === 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-sm">
                          <IonIcon icon={timeOutline} className="text-4xl text-gray-400 dark:text-gray-600 mb-4" />
                          <p className="text-center text-[#475569] dark:text-gray-400 font-montserrat text-lg">
                            No available times
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </IonModal>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 shadow-lg z-10">
          <IonButton
            type="submit"
            expand="block"
            className="custom-button rounded-xl shadow-md text-base font-montserrat h-12"
          >
            Send Order
          </IonButton>
        </div>
      </form>

      <IonFooter>
        <IonTabBar slot="bottom" className="bg-white dark:bg-gray-800 shadow-md">
          <IonTabButton tab="home" onClick={goToHome} className="text-[#6366f1] dark:text-[#818cf8]">
            <IonIcon icon={homeOutline} className="text-2xl" />
            <IonLabel className="text-xs font-montserrat">Home</IonLabel>
          </IonTabButton>
          <IonTabButton tab="bookings" className="text-[#6366f1] dark:text-[#818cf8]">
            <IonIcon icon={calendarOutline} className="text-2xl" />
            <IonLabel className="text-xs font-montserrat">Bookings</IonLabel>
          </IonTabButton>
          <IonTabButton tab="chat" className="text-[#6366f1] dark:text-[#818cf8]">
            <IonIcon icon={chatbubbleOutline} className="text-2xl" />
            <IonLabel className="text-xs font-montserrat">Chat</IonLabel>
          </IonTabButton>
          <IonTabButton tab="profile" onClick={goToProfile} className="text-[#6366f1] dark:text-[#818cf8]">
            <IonIcon icon={personOutline} className="text-2xl" />
            <IonLabel className="text-xs font-montserrat">Profile</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonFooter>
    </div>
  );
};

export default OrderForm;