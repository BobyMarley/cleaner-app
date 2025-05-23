// pages/AdminSettingsPage.tsx - ИСПРАВЛЕННАЯ НАВИГАЦИЯ
import React, { useState, useEffect } from 'react';
import {
  IonButton,
  IonHeader,
  IonToolbar,
  IonIcon,
  IonCard,
  IonCardContent,
  IonContent,
  IonPage,
  IonSpinner,
  IonChip
} from '@ionic/react';
import { auth, onAuthStateChanged } from '../services/firebase';
import { 
  chevronBackOutline, 
  sunnyOutline,
  moonOutline,
  settingsOutline,
  constructOutline
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';

const adminEmails = ['plenkanet@gmail.com'];

const AdminSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

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
        setLoading(false);
      }
    });
    
    return () => unsub();
  }, [navigate]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-[#f1f5f9] to-[#ddd6fe] dark:from-[#1e293b] dark:to-[#312e81]">
        <IonSpinner name="crescent" className="text-[#6366f1] w-12 h-12" />
        <p className="mt-4 text-[#1e293b] dark:text-white font-montserrat">Загрузка...</p>
      </div>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] shadow-lg">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <IonButton fill="clear" onClick={() => navigate('/admin')} className="text-white mr-2 p-0">
                <IonIcon icon={chevronBackOutline} className="text-xl" />
              </IonButton>
              <span className="text-white font-montserrat text-xl font-bold tracking-tight">
                Настройки системы
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
        <IonCard className="rounded-xl overflow-hidden shadow-lg">
          <IonCardContent className="p-8 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <IonIcon icon={constructOutline} className="text-gray-600 dark:text-gray-400 text-4xl" />
            </div>
            
            <h2 className="text-2xl font-montserrat font-bold text-[#1e293b] dark:text-gray-200 mb-4">
              Раздел в разработке
            </h2>
            
            <p className="text-[#475569] dark:text-gray-400 font-montserrat mb-6">
              Настройки системы будут доступны в ближайшее время
            </p>
            
            <IonChip className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <IonIcon icon={settingsOutline} className="mr-2" />
              Скоро будет доступно
            </IonChip>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default AdminSettingsPage;