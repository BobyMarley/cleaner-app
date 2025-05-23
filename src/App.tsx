// App.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ СО ВСЕМИ РОУТАМИ
import React, { useEffect } from "react";
import { IonApp } from '@ionic/react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { setupPushNotifications } from './pushNotifications';

// ТОЛЬКО существующие страницы
import HomePage from './pages/HomePage';
import AdminPanel from './pages/AdminPanel';
import OrderPage from './pages/OrderPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ReviewsPage from './pages/ReviewsPage';

// Админские страницы
import AdminReviewsPage from './pages/AdminReviewsPage';
import AdminCalendarPanel from './pages/AdminCalendarPanel';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminStatsPage from './pages/AdminStatsPage';

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
          {/* Обычные роуты */}
          <Route path="/" element={<HomePage />} />
          <Route path="/order" element={<OrderPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/worker" element={<RegisterPage isWorker={true} />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          
          {/* Админские роуты */}
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/calendar" element={<AdminCalendarPanel />} />
          <Route path="/admin/reviews" element={<AdminReviewsPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/admin/stats" element={<AdminStatsPage />} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </IonApp>
  );
};

export default App;