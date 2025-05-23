// components/ProtectedRoute.tsx - Защищенный роут для авторизованных пользователей
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { auth, onAuthStateChanged } from '../services/firebase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/login' 
}) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-[#f1f5f9] to-[#ddd6fe] dark:from-[#1e293b] dark:to-[#312e81]">
        <IonSpinner name="crescent" className="text-[#6366f1] w-12 h-12" />
        <p className="mt-4 text-[#1e293b] dark:text-white font-montserrat">
          Проверка авторизации...
        </p>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to={redirectTo} replace />;
};

// components/AdminRoute.tsx - Защищенный роут для администраторов
import { User } from 'firebase/auth';

interface AdminRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ 
  children, 
  redirectTo = '/' 
}) => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Список email'ов администраторов
  const adminEmails = ['plenkanet@gmail.com'];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user && adminEmails.includes(user.email || '')) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-[#f1f5f9] to-[#ddd6fe] dark:from-[#1e293b] dark:to-[#312e81]">
        <IonSpinner name="crescent" className="text-[#6366f1] w-12 h-12" />
        <p className="mt-4 text-[#1e293b] dark:text-white font-montserrat">
          Проверка прав доступа...
        </p>
      </div>
    );
  }

  return isAdmin ? <>{children}</> : <Navigate to={redirectTo} replace />;
};

export { ProtectedRoute, AdminRoute };
export default ProtectedRoute;