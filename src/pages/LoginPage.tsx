import React, { useState } from 'react';
import { IonContent, IonHeader, IonPage, IonToolbar, IonButton, IonIcon, IonInput, IonFooter, IonTabBar, IonTabButton, IonLabel, IonLoading } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { homeOutline, personOutline, cartOutline, sunnyOutline, moonOutline, mailOutline, lockClosedOutline, logoGoogle } from 'ionicons/icons';
import newLogo from '../assets/new-logo.png';
import { auth, signInWithGoogle, loginWithEmail } from '../services/firebase';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Валидация email в реальном времени
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      setEmailError('Некорректный email адрес');
    } else {
      setEmailError('');
    }
  };

  // Валидация пароля в реальном времени
  const validatePassword = (password: string) => {
    if (password && password.length < 6) {
      setPasswordError('Пароль должен содержать минимум 6 символов');
    } else {
      setPasswordError('');
    }
  };

  const goToHome = () => navigate('/');
  const goToOrder = () => navigate('/order');
  const goToProfile = () => navigate('/profile');
  const goToRegister = () => navigate('/register');

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Функция перенаправления после успешного входа
  const redirectAfterLogin = () => {
    const redirectPath = sessionStorage.getItem('redirectAfterLogin');
    if (redirectPath) {
      sessionStorage.removeItem('redirectAfterLogin');
      navigate(redirectPath);
    } else {
      navigate('/profile');
    }
  };

  const handleLogin = async () => {
    // Очищаем предыдущие ошибки
    setError('');
    
    // Простая валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setError('Пожалуйста, введите email адрес');
      return;
    }
    if (!emailRegex.test(email)) {
      setError('Пожалуйста, введите корректный email адрес');
      return;
    }
    
    if (!password) {
      setError('Пожалуйста, введите пароль');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    setIsLoading(true);

    try {
      await loginWithEmail(email, password);
      console.log('Вход выполнен успешно');
      redirectAfterLogin();
    } catch (err: any) {
      console.error('Login error:', err);
      let errorMessage = 'Ошибка входа';
      
      switch (err.code) {
        case 'auth/user-not-found':
          errorMessage = 'Пользователь с таким email не найден';
          break;
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = 'Неверный пароль';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Некорректный email адрес';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Аккаунт заблокирован';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Слишком много попыток. Попробуйте позже';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Ошибка сети. Проверьте подключение к интернету';
          break;
        default:
          errorMessage = 'Ошибка входа. Проверьте данные и попробуйте снова';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      console.log('Вход через Google выполнен успешно');
      redirectAfterLogin();
    } catch (err: any) {
      console.error('Google login error:', err);
      let errorMessage = 'Ошибка входа через Google';
      
      switch (err.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Окно входа было закрыто';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Всплывающее окно заблокировано браузером';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Ошибка сети. Проверьте подключение к интернету';
          break;
        default:
          errorMessage = 'Ошибка входа через Google: ' + (err.message || 'Неизвестная ошибка');
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Обработчики изменения полей с валидацией
  const handleEmailChange = (value: string) => {
    setEmail(value);
    validateEmail(value);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    validatePassword(value);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] shadow-lg">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <img src={newLogo} alt="BrightWaw Logo" className="h-12 mr-3" />
              <span className="text-white font-montserrat text-xl font-bold tracking-tight">BrightWaw</span>
            </div>
            <div className="flex items-center space-x-3">
              <IonButton fill="clear" onClick={toggleDarkMode} className="text-white">
                <IonIcon icon={isDarkMode ? sunnyOutline : moonOutline} className="text-xl" />
              </IonButton>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent className="bg-gradient-to-br from-[#f1f5f9] to-[#ddd6fe] dark:from-[#1e293b] dark:to-[#312e81]">
        <div className="flex flex-col items-center min-h-screen px-6 py-12">
          <div className="w-32 h-32 mb-6 bg-[#6366f1] rounded-full flex items-center justify-center shadow-lg">
            <IonIcon icon={personOutline} className="text-white text-5xl" />
          </div>

          <h2 className="text-3xl font-montserrat font-bold text-[#1e293b] dark:text-white mb-8 text-center tracking-tight">
            Добро пожаловать
          </h2>

          <div className="w-full max-w-md space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full">
              <div className="space-y-5">
                <div className="relative">
                  <IonIcon icon={mailOutline} className="input-icon" />
                  <IonInput
                    value={email}
                    onIonChange={(e) => handleEmailChange(e.detail.value || '')}
                    placeholder="Email"
                    type="email"
                    className="w-full rounded-xl py-4 pl-12 pr-4 font-montserrat"
                  />
                  {emailError && <p className="text-red-500 text-xs mt-1 font-montserrat">{emailError}</p>}
                </div>

                <div className="relative">
                  <IonIcon icon={lockClosedOutline} className="input-icon" />
                  <IonInput
                    value={password}
                    onIonChange={(e) => handlePasswordChange(e.detail.value || '')}
                    placeholder="Пароль"
                    type="password"
                    className="w-full rounded-xl py-4 pl-12 pr-4 font-montserrat"
                  />
                  {passwordError && <p className="text-red-500 text-xs mt-1 font-montserrat">{passwordError}</p>}
                </div>

                {error && <p className="text-red-500 text-sm font-montserrat">{error}</p>}

                <IonButton
                  expand="block"
                  onClick={handleLogin}
                  disabled={isLoading || !!emailError || !!passwordError}
                  className="custom-button rounded-xl shadow-lg text-base font-montserrat h-14 w-full"
                >
                  {isLoading ? 'Вход...' : 'Войти'}
                </IonButton>

                <IonButton
                  expand="block"
                  onClick={handleGoogleLogin}
                  fill="outline"
                  disabled={isLoading}
                  className="google-button rounded-xl shadow-lg text-base font-montserrat h-14 w-full"
                >
                  <IonIcon icon={logoGoogle} className="mr-2" /> 
                  {isLoading ? 'Вход...' : 'Войти через Google'}
                </IonButton>
              </div>
            </div>

            <div className="flex justify-center">
              <p className="text-center font-montserrat text-[#475569] dark:text-gray-300">
                Нет аккаунта?{' '}
                <IonButton fill="clear" onClick={goToRegister} className="ml-1 p-0 font-semibold">
                  Зарегистрироваться
                </IonButton>
              </p>
            </div>
          </div>
        </div>
      </IonContent>
      
      <IonLoading
        isOpen={isLoading}
        message="Выполняется вход..."
      />
      
      <IonFooter>
        <IonTabBar slot="bottom" className="bg-white dark:bg-gray-800 shadow-md">
          <IonTabButton tab="home" onClick={goToHome}>
            <IonIcon icon={homeOutline} className="text-2xl" />
            <IonLabel className="text-xs font-montserrat">Главная</IonLabel>
          </IonTabButton>
          <IonTabButton tab="order" onClick={goToOrder}>
            <IonIcon icon={cartOutline} className="text-2xl" />
            <IonLabel className="text-xs font-montserrat">Заказ</IonLabel>
          </IonTabButton>
          <IonTabButton tab="profile" onClick={goToProfile}>
            <IonIcon icon={personOutline} className="text-2xl" />
            <IonLabel className="text-xs font-montserrat">Профиль</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonFooter>
    </IonPage>
  );
};

export default LoginPage;