import React, { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonToolbar, IonButton, IonIcon, IonInput, IonSelect, IonSelectOption, IonFooter, IonTabBar, IonTabButton, IonLabel, IonLoading } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { 
  homeOutline, 
  personOutline, 
  cartOutline, 
  sunnyOutline, 
  moonOutline, 
  mailOutline, 
  lockClosedOutline, 
  callOutline, 
  personCircleOutline 
} from 'ionicons/icons';
import newLogo from '../assets/new-logo.png';
import { auth, registerWithEmail } from '../services/firebase';

const RegisterPage: React.FC<{ isWorker?: boolean }> = ({ isWorker }) => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [role, setRole] = useState<'client' | 'worker'>('client');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Состояния для валидации в реальном времени
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');

  const goToHome = () => navigate('/');
  const goToOrder = () => navigate('/order');
  const goToProfile = () => navigate('/profile');
  const goToLogin = () => navigate('/login');

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  useEffect(() => {
    if (isWorker) setRole('worker');
  }, [isWorker]);

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

  // Валидация имени в реальном времени
  const validateName = (name: string) => {
    if (name && name.trim().length < 2) {
      setNameError('Имя должно содержать минимум 2 символа');
    } else {
      setNameError('');
    }
  };

  // Валидация телефона в реальном времени
  const validatePhone = (phone: string) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (phone && !phoneRegex.test(phone.replace(/\s/g, ''))) {
      setPhoneError('Некорректный номер телефона');
    } else {
      setPhoneError('');
    }
  };

  // Функция перенаправления после успешной регистрации
  const redirectAfterRegister = () => {
    const redirectPath = sessionStorage.getItem('redirectAfterLogin');
    if (redirectPath) {
      sessionStorage.removeItem('redirectAfterLogin');
      navigate(redirectPath);
    } else {
      navigate('/profile');
    }
  };

  const handleRegister = async () => {
    // Очищаем предыдущие ошибки
    setError('');
    
    // Валидация данных перед отправкой
    let hasErrors = false;

    if (!name.trim()) {
      setNameError('Пожалуйста, введите ваше имя');
      hasErrors = true;
    } else if (name.trim().length < 2) {
      setNameError('Имя должно содержать минимум 2 символа');
      hasErrors = true;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Пожалуйста, введите email');
      hasErrors = true;
    } else if (!emailRegex.test(email)) {
      setEmailError('Пожалуйста, введите корректный email адрес');
      hasErrors = true;
    }
    
    if (!password) {
      setPasswordError('Пожалуйста, введите пароль');
      hasErrors = true;
    } else if (password.length < 6) {
      setPasswordError('Пароль должен содержать минимум 6 символов');
      hasErrors = true;
    }

    // Проверка телефона (необязательное поле)
    if (phone) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        setPhoneError('Некорректный номер телефона');
        hasErrors = true;
      }
    }

    if (hasErrors) {
      setError('Пожалуйста, исправьте ошибки в форме');
      return;
    }

    setIsLoading(true);

    try {
      await registerWithEmail(email, password, name.trim(), phone.trim(), role);
      console.log('Регистрация прошла успешно');
      redirectAfterRegister();
    } catch (err: any) {
      console.error('Registration error:', err);
      let errorMessage = 'Ошибка регистрации';
      
      switch (err.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Пользователь с таким email уже существует';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Некорректный email адрес';
          break;
        case 'auth/weak-password':
          errorMessage = 'Слабый пароль. Используйте минимум 6 символов';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Регистрация временно отключена';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Ошибка сети. Проверьте подключение к интернету';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Слишком много попыток. Попробуйте позже';
          break;
        default:
          errorMessage = err.message || 'Ошибка регистрации. Попробуйте снова';
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

  const handleNameChange = (value: string) => {
    setName(value);
    validateName(value);
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    validatePhone(value);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] shadow-lg">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <img src={newLogo} alt="BrightWaw Logo" className="h-9 mr-3" />
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
        <div className="flex flex-col items-center min-h-screen px-6 py-8">
          <h2 className="text-3xl font-montserrat font-bold text-[#1e293b] dark:text-white mb-6 text-center tracking-tight">
            Создайте аккаунт
          </h2>

          <div className="w-full max-w-md space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full">
              <div className="space-y-4">
                <div className="relative">
                  <IonIcon icon={personCircleOutline} className="input-icon" />
                  <IonInput
                    value={name}
                    onIonChange={(e) => handleNameChange(e.detail.value || '')}
                    placeholder="Имя"
                    className="w-full rounded-xl py-4 pl-12 pr-4 font-montserrat"
                  />
                  {nameError && <p className="text-red-500 text-xs mt-1 font-montserrat">{nameError}</p>}
                </div>

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
                  <IonIcon icon={callOutline} className="input-icon" />
                  <IonInput
                    value={phone}
                    onIonChange={(e) => handlePhoneChange(e.detail.value || '')}
                    placeholder="Телефон (необязательно)"
                    type="tel"
                    className="w-full rounded-xl py-4 pl-12 pr-4 font-montserrat"
                  />
                  {phoneError && <p className="text-red-500 text-xs mt-1 font-montserrat">{phoneError}</p>}
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

                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl py-2 px-4">
                  <IonSelect
                    value={role}
                    onIonChange={(e) => setRole(e.detail.value as 'client' | 'worker')}
                    className="w-full text-[#1e293b] dark:text-white font-montserrat"
                    placeholder="Выберите роль"
                    interfaceOptions={{
                      header: 'Роль',
                      cssClass: 'custom-select'
                    }}
                  >
                    <IonSelectOption value="client">Клиент</IonSelectOption>
                    <IonSelectOption value="worker">Работник</IonSelectOption>
                  </IonSelect>
                </div>

                {error && <p className="text-red-500 text-sm font-montserrat">{error}</p>}

                <IonButton
                  expand="block"
                  onClick={handleRegister}
                  disabled={isLoading || !!emailError || !!passwordError || !!nameError || !!phoneError}
                  className="custom-button rounded-xl shadow-lg text-base font-montserrat h-14 w-full mt-4"
                >
                  {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
                </IonButton>
              </div>
            </div>

            <div className="flex justify-center">
              <p className="text-center font-montserrat text-[#475569] dark:text-gray-300">
                Уже есть аккаунт?{' '}
                <IonButton fill="clear" onClick={goToLogin} className="ml-1 p-0 font-semibold">
                  Войти
                </IonButton>
              </p>
            </div>
          </div>
        </div>
      </IonContent>
      
      <IonLoading
        isOpen={isLoading}
        message="Создание аккаунта..."
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

export default RegisterPage;