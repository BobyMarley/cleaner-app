import React, { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonToolbar, IonButton, IonIcon, IonInput, IonSelect, IonSelectOption, IonFooter, IonTabBar, IonTabButton, IonLabel } from '@ionic/react';
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
    // Валидация данных
    if (!name.trim()) {
      setError('Пожалуйста, введите ваше имя');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Пожалуйста, введите корректный email адрес');
      return;
    }
    
    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    try {
      await registerWithEmail(email, password, name);
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
        case 'auth/network-request-failed':
          errorMessage = 'Ошибка сети. Проверьте подключение к интернету';
          break;
        default:
          errorMessage = 'Ошибка регистрации. Попробуйте снова';
      }
      
      setError(errorMessage);
    }
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
                    onIonChange={(e) => setName(e.detail.value || '')}
                    placeholder="Имя"
                    className="w-full rounded-xl py-4 pl-12 pr-4 font-montserrat"
                  />
                </div>

                <div className="relative">
                  <IonIcon icon={mailOutline} className="input-icon" />
                  <IonInput
                    value={email}
                    onIonChange={(e) => setEmail(e.detail.value || '')}
                    placeholder="Email"
                    type="email"
                    className="w-full rounded-xl py-4 pl-12 pr-4 font-montserrat"
                  />
                </div>

                <div className="relative">
                  <IonIcon icon={callOutline} className="input-icon" />
                  <IonInput
                    value={phone}
                    onIonChange={(e) => setPhone(e.detail.value || '')}
                    placeholder="Телефон"
                    type="tel"
                    className="w-full rounded-xl py-4 pl-12 pr-4 font-montserrat"
                  />
                </div>

                <div className="relative">
                  <IonIcon icon={lockClosedOutline} className="input-icon" />
                  <IonInput
                    value={password}
                    onIonChange={(e) => setPassword(e.detail.value || '')}
                    placeholder="Пароль"
                    type="password"
                    className="w-full rounded-xl py-4 pl-12 pr-4 font-montserrat"
                  />
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
                  className="custom-button rounded-xl shadow-lg text-base font-montserrat h-14 w-full mt-4"
                >
                  Зарегистрироваться
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