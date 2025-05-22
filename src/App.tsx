import React, { useEffect } from "react";
import { IonApp } from '@ionic/react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { setupPushNotifications } from './pushNotifications';
import { auth } from './services/firebase'; // Исправляем на firebase.ts
import HomePage from './pages/HomePage';
import AdminPanel from './pages/AdminPanel';
import OrderPage from './pages/OrderPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

const App: React.FC = () => {
  useEffect(() => {
    setupPushNotifications();
  }, []);

  return (
    <IonApp>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} exact />
		  <Route path="/admin" element={<AdminPanel />} />
          <Route path="/order" element={<OrderPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/worker" element={<RegisterPage isWorker={true} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </IonApp>
  );
};

export default App;