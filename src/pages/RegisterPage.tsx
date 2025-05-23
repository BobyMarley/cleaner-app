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
  personCircleOutline,
  checkmarkCircleOutline,
  closeCircleOutline
} from 'ionicons/icons';
import newLogo from '../assets/new-logo.png';
import { auth, registerWithEmail } from '../services/firebase';

interface PasswordRequirement {
  met: boolean;
  text: string;
}

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
  
  // Состояния для показа требований к паролю
  const [showPasswordRequirements, setShowPasswordRequirements] = useState<boolean>(false);
  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirement[]>([
    { met: false, text: 'Минимум 8 символов' },
    { met: false, text: 'Хотя бы одна заглавная буква' },
    { met: false, text: 'Хотя бы одна строчная буква' },
    { met: false, text: 'Хотя бы одна цифра' },
  ]);

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

  // Улучшенная валидация email
  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!email) {
      setEmailError('');
    } else if (!emailRegex.test(email)) {
      setEmailError('Введите корректный email адрес');
    } else if (email.length > 254) {
      setEmailError('Email слишком длинный');
    } else {
      setEmailError('');
    }
  };

  // Улучшенная валидация пароля с проверкой сложности
  const validatePassword = (password: string) => {
    const requirements = [
      { met: password.length >= 8, text: 'Минимум 8 символов' },
      { met: /[A-Z]/.test(password), text: 'Хотя бы одна заглавная буква' },
      { met: /[a-z]/.test(password), text: 'Хотя бы одна строчная буква' },
      { met: /\d/.test(password), text: 'Хотя бы одна цифра' },
    ];
    
    setPasswordRequirements(requirements);
    
    const allMet = requirements.every(req => req.met);
    
    if (!password) {
      setPasswordError('');
    } else if (!allMet) {
      const unmetRequirements = requirements.filter(req => !req.met);
      setPasswordError(`Пароль должен содержать: ${unmetRequirements.map(req => req.text.toLowerCase()).join(', ')}`);
    } else {
      setPasswordError('');
    }
  };

  // Валидация имени с учетом специальных символов
  const validateName = (name: string) => {
    const nameRegex = /^[a-zA-Zа-яА-ЯёЁ\s'-]{2,50}$/;
    if (!name) {
      setNameError('');
    } else if (name.trim().length < 2) {
      setNameError('Имя должно содержать минимум 2 символа');
    } else if (name.trim().length > 50) {
      setNameError('Имя слишком длинное (максимум 50 символов)');
    } else if (!nameRegex.test(name.trim())) {
      setNameError('Имя может содержать только буквы, пробелы, апострофы и дефисы');
    } else {
      setNameError('');
    }
  };

  // Улучшенная валидация телефона
  const validatePhone = (phone: string) => {
    // Убираем все кроме цифр и знака +
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const phoneRegex = /^(\+?[1-9]\d{1,14})$/;
    
    if (!phone) {
      setPhoneError('');
    } else if (cleanPhone.length < 7) {
      setPhoneError('Номер телефона слишком короткий');
    } else if (cleanPhone.length > 15) {
      setPhoneError('Номер телефона слишком длинный');
    } else if (!phoneRegex.test(cleanPhone)) {
      setPhoneError('Введите корректный номер телефона');
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

    // Проверка имени
    if (!name.trim()) {
      setNameError('Пожалуйста, введите ваше имя');
      hasErrors = true;
    } else {
      validateName(name);
      if (nameError) hasErrors = true;
    }
    
    // Проверка email
    if (!email) {
      setEmailError('Пожалуйста, введите email');
      hasErrors = true;
    } else {
      validateEmail(email);
      if (emailError) hasErrors = true;
    }
    
    // Проверка пароля
    if (!password) {
      setPasswordError('Пожалуйста, введите пароль');
      hasErrors = true;
    } else {
      validatePassword(password);
      if (passwordError) hasErrors = true;
    }

    // Проверка телефона (если указан)
    if (phone.trim()) {
      validatePhone(phone);
      if (phoneError) hasErrors = true;
    }

    if (hasErrors) {
      setError('Пожалуйста, исправьте ошибки в форме');
      return;
    }

    setIsLoading(true);

    try {
      await registerWithEmail(email.trim(), password, name.trim(), phone.trim(), role);
      console.log('Регистрация прошла успешно');
      redirectAfterRegister();
    } catch (err: any) {
      console.error('Registration error:', err);
      let errorMessage = 'Ошибка регистрации';
      
      switch (err.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Пользователь с таким email уже зарегистрирован. Попробуйте войти в аккаунт или используйте другой email';
          setEmailError('Этот email уже используется');
          break;
        case 'auth/invalid-email':
          errorMessage = 'Некорректный email адрес';
          setEmailError('Некорректный email адрес');
          break;
        case 'auth/weak-password':
          errorMessage = 'Слабый пароль. Используйте более сложную комбинацию';
          setPasswordError('Пароль слишком слабый');
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Регистрация временно отключена. Обратитесь к администратору';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Ошибка сети. Проверьте подключение к интернету и попробуйте снова';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Слишком много попыток регистрации. Попробуйте через несколько минут';
          break;
        case 'auth/internal-error':
          errorMessage = 'Внутренняя ошибка сервера. Попробуйте позже';
          break;
        default:
          errorMessage = err.message || 'Произошла неожиданная ошибка. Попробуйте снова';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Обработчики изменения полей с валидацией
  const handleEmailChange = (value: string) => {
    setEmail(value);
    // Сбрасываем ошибку при изменении поля
    if (emailError) setEmailError('');
    // Валидируем только если поле не пустое
    if (value.trim()) {
      setTimeout(() => validateEmail(value), 300); // Debounce
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (passwordError) setPasswordError('');
    validatePassword(value);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (nameError) setNameError('');
    if (value.trim()) {
      setTimeout(() => validateName(value), 300); // Debounce
    }
  };

  const handlePhoneChange = (value: string) => {
    // Форматируем ввод телефона
    const formatted = value.replace(/[^\d+\-\(\)\s]/g, '');
    setPhone(formatted);
    if (phoneError) setPhoneError('');
    if (formatted.trim()) {
      setTimeout(() => validatePhone(formatted), 300); // Debounce
    }
  };

  const getPasswordStrength = () => {
    const metCount = passwordRequirements.filter(req => req.met).length;
    if (metCount === 0) return { strength: 0, text: '', color: '' };
    if (metCount <= 1) return { strength: 25, text: 'Слабый', color: 'text-red-500' };
    if (metCount <= 2) return { strength: 50, text: 'Средний', color: 'text-yellow-500' };
    if (metCount <= 3) return { strength: 75, text: 'Хороший', color: 'text-blue-500' };
    return { strength: 100, text: 'Отличный', color: 'text-green-500' };
  };

  const passwordStrength = getPasswordStrength();
  const canSubmit = !emailError && !passwordError && !nameError && !phoneError && 
                   email && password && name.trim() && passwordRequirements.every(req => req.met);

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
                {/* Поле имени */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                    <IonIcon 
                      icon={personCircleOutline} 
                      className="text-gray-400 dark:text-gray-500 text-xl"
                    />
                  </div>
                  <IonInput
                    value={name}
                    onIonChange={(e) => handleNameChange(e.detail.value || '')}
                    placeholder="Имя"
                    className={`w-full rounded-xl pl-12 pr-4 font-montserrat border-2 transition-colors ${
                      nameError 
                        ? 'border-red-300 dark:border-red-600' 
                        : name && !nameError 
                        ? 'border-green-300 dark:border-green-600' 
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                    fill="outline"
                  />
                  {nameError && (
                    <p className="text-red-500 text-xs mt-1 font-montserrat flex items-center">
                      <IonIcon icon={closeCircleOutline} className="mr-1" />
                      {nameError}
                    </p>
                  )}
                  {name && !nameError && (
                    <p className="text-green-500 text-xs mt-1 font-montserrat flex items-center">
                      <IonIcon icon={checkmarkCircleOutline} className="mr-1" />
                      Имя корректно
                    </p>
                  )}
                </div>

                {/* Поле email */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                    <IonIcon 
                      icon={mailOutline} 
                      className="text-gray-400 dark:text-gray-500 text-xl"
                    />
                  </div>
                  <IonInput
                    value={email}
                    onIonChange={(e) => handleEmailChange(e.detail.value || '')}
                    placeholder="Email"
                    type="email"
                    className={`w-full rounded-xl pl-12 pr-4 font-montserrat border-2 transition-colors ${
                      emailError 
                        ? 'border-red-300 dark:border-red-600' 
                        : email && !emailError 
                        ? 'border-green-300 dark:border-green-600' 
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                    fill="outline"
                  />
                  {emailError && (
                    <p className="text-red-500 text-xs mt-1 font-montserrat flex items-center">
                      <IonIcon icon={closeCircleOutline} className="mr-1" />
                      {emailError}
                    </p>
                  )}
                  {email && !emailError && (
                    <p className="text-green-500 text-xs mt-1 font-montserrat flex items-center">
                      <IonIcon icon={checkmarkCircleOutline} className="mr-1" />
                      Email корректен
                    </p>
                  )}
                </div>

                {/* Поле телефона */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                    <IonIcon 
                      icon={callOutline} 
                      className="text-gray-400 dark:text-gray-500 text-xl"
                    />
                  </div>
                  <IonInput
                    value={phone}
                    onIonChange={(e) => handlePhoneChange(e.detail.value || '')}
                    placeholder="Телефон (необязательно)"
                    type="tel"
                    className={`w-full rounded-xl pl-12 pr-4 font-montserrat border-2 transition-colors ${
                      phoneError 
                        ? 'border-red-300 dark:border-red-600' 
                        : phone && !phoneError 
                        ? 'border-green-300 dark:border-green-600' 
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                    fill="outline"
                  />
                  {phoneError && (
                    <p className="text-red-500 text-xs mt-1 font-montserrat flex items-center">
                      <IonIcon icon={closeCircleOutline} className="mr-1" />
                      {phoneError}
                    </p>
                  )}
                  {phone && !phoneError && (
                    <p className="text-green-500 text-xs mt-1 font-montserrat flex items-center">
                      <IonIcon icon={checkmarkCircleOutline} className="mr-1" />
                      Номер корректен
                    </p>
                  )}
                </div>

                {/* Поле пароля */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                    <IonIcon 
                      icon={lockClosedOutline} 
                      className="text-gray-400 dark:text-gray-500 text-xl"
                    />
                  </div>
                  <IonInput
                    value={password}
                    onIonChange={(e) => handlePasswordChange(e.detail.value || '')}
                    onIonFocus={() => setShowPasswordRequirements(true)}
                    placeholder="Пароль"
                    type="password"
                    className={`w-full rounded-xl pl-12 pr-4 font-montserrat border-2 transition-colors ${
                      passwordError 
                        ? 'border-red-300 dark:border-red-600' 
                        : password && !passwordError 
                        ? 'border-green-300 dark:border-green-600' 
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                    fill="outline"
                  />
                  
                  {/* Индикатор силы пароля */}
                  {password && (
                    <div className="mt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-montserrat text-gray-600 dark:text-gray-400">
                          Сила пароля:
                        </span>
                        <span className={`text-xs font-montserrat font-semibold ${passwordStrength.color}`}>
                          {passwordStrength.text}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength.strength <= 25 ? 'bg-red-500' :
                            passwordStrength.strength <= 50 ? 'bg-yellow-500' :
                            passwordStrength.strength <= 75 ? 'bg-blue-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${passwordStrength.strength}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Требования к паролю */}
                  {showPasswordRequirements && password && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-xs font-montserrat font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Требования к паролю:
                      </p>
                      <div className="space-y-1">
                        {passwordRequirements.map((req, index) => (
                          <div key={index} className="flex items-center">
                            <IonIcon
                              icon={req.met ? checkmarkCircleOutline : closeCircleOutline}
                              className={`mr-2 ${req.met ? 'text-green-500' : 'text-red-500'}`}
                            />
                            <span className={`text-xs font-montserrat ${
                              req.met ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {req.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {passwordError && (
                    <p className="text-red-500 text-xs mt-1 font-montserrat flex items-center">
                      <IonIcon icon={closeCircleOutline} className="mr-1" />
                      {passwordError}
                    </p>
                  )}
                </div>

                {/* Выбор роли */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl py-2 px-4 border-2 border-gray-200 dark:border-gray-700">
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

                {/* Общая ошибка */}
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-600 dark:text-red-400 text-sm font-montserrat flex items-center">
                      <IonIcon icon={closeCircleOutline} className="mr-2" />
                      {error}
                    </p>
                  </div>
                )}

                {/* Кнопка регистрации */}
                <IonButton
                  expand="block"
                  onClick={handleRegister}
                  disabled={isLoading || !canSubmit}
                  className={`rounded-xl shadow-lg text-base font-montserrat h-14 w-full mt-4 transition-all ${
                    canSubmit 
                      ? 'opacity-100 custom-button' 
                      : 'opacity-60 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
                </IonButton>
              </div>
            </div>

            {/* Ссылка на логин */}
            <div className="flex justify-center">
              <p className="text-center font-montserrat dark:text-gray-300">
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
        spinner="crescent"
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