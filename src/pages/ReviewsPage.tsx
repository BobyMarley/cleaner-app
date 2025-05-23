// pages/ReviewsPage.tsx
import React, { useState, useEffect } from 'react';
import { 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonToolbar, 
  IonButton, 
  IonIcon, 
  IonSegment, 
  IonSegmentButton, 
  IonLabel,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonModal,
  IonFooter,
  IonTabBar,
  IonTabButton
} from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { 
  arrowBackOutline, 
  star,
  starOutline,
  addOutline,
  funnel,
  homeOutline,
  personOutline,
  calendarOutline,
  chatbubbleOutline,
  notificationsOutline,
  chatbubblesOutline
} from 'ionicons/icons';
import { 
  getApprovedReviews, 
  getAverageRating, 
  Review, 
  auth 
} from '../services/firebase';
import ReviewCard from '../components/ReviewCard';
import AddReviewForm from '../components/AddReviewForm';
import newLogo from '../assets/new-logo.png';

const ReviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');
  const [filterRating, setFilterRating] = useState<string>('');
  const [filterService, setFilterService] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [averageRating, setAverageRating] = useState<number>(0);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showAddReviewModal, setShowAddReviewModal] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [hasMoreReviews, setHasMoreReviews] = useState<boolean>(true);
  const [currentLimit, setCurrentLimit] = useState<number>(10);

  useEffect(() => {
    // Проверяем авторизацию
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
    });

    loadReviews();

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    filterAndSortReviews();
  }, [reviews, searchText, filterRating, filterService, sortBy]);

  const loadReviews = async (limit: number = 10) => {
    try {
      setLoading(true);
      const [reviewsData, avgRating] = await Promise.all([
        getApprovedReviews(limit),
        getAverageRating()
      ]);
      setReviews(reviewsData);
      setAverageRating(avgRating);
      setHasMoreReviews(reviewsData.length === limit);
    } catch (error) {
      console.error('Ошибка при загрузке отзывов:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreReviews = async () => {
    try {
      const newLimit = currentLimit + 10;
      const moreReviews = await getApprovedReviews(newLimit);
      setReviews(moreReviews);
      setCurrentLimit(newLimit);
      setHasMoreReviews(moreReviews.length === newLimit);
    } catch (error) {
      console.error('Ошибка при загрузке дополнительных отзывов:', error);
    }
  };

  const filterAndSortReviews = () => {
    let filtered = [...reviews];

    // Поиск по тексту
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(r => 
        r.comment.toLowerCase().includes(search) ||
        r.userName.toLowerCase().includes(search)
      );
    }

    // Фильтр по рейтингу
    if (filterRating) {
      filtered = filtered.filter(r => r.rating === parseInt(filterRating));
    }

    // Фильтр по типу услуги
    if (filterService) {
      filtered = filtered.filter(r => r.serviceType === filterService);
    }

    // Сортировка
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'highest':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        filtered.sort((a, b) => a.rating - b.rating);
        break;
    }

    setFilteredReviews(filtered);
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadReviews(currentLimit);
    event.detail.complete();
  };

  const handleInfiniteScroll = async (event: CustomEvent) => {
    await loadMoreReviews();
    event.detail.complete();
  };

  const clearFilters = () => {
    setSearchText('');
    setFilterRating('');
    setFilterService('');
    setSortBy('newest');
  };

  const handleReviewAdded = () => {
    setShowAddReviewModal(false);
    loadReviews(currentLimit);
  };

  const goToLogin = () => {
    navigate('/login');
  };

  // Навигационные функции
  const goToHome = () => navigate('/');
  const goToOrder = () => navigate('/order');
  const goToProfile = () => navigate('/profile');

  // Рендер звезд среднего рейтинга
  const renderAverageRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <IonIcon key={i} icon={star} className="text-yellow-400 text-lg" />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <IonIcon key={i} icon={star} className="text-yellow-400 text-lg opacity-50" />
        );
      } else {
        stars.push(
          <IonIcon key={i} icon={starOutline} className="text-gray-300 dark:text-gray-600 text-lg" />
        );
      }
    }
    return stars;
  };

  const getServiceTypeName = (serviceType: string) => {
    switch (serviceType) {
      case 'furniture': return 'Мебель';
      case 'carpet': return 'Ковры';
      case 'mattress': return 'Матрасы';
      default: return 'Услуга';
    }
  };

  // Подсчет статистики по рейтингам
  const ratingStats = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length,
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <IonButton fill="clear" onClick={() => navigate(-1)} className="text-indigo-600 dark:text-indigo-400 mr-2">
                <IonIcon icon={arrowBackOutline} className="text-xl" />
              </IonButton>
              <img src={newLogo} alt="BrightWaw Logo" className="h-8 mr-2" />
              <span className="text-indigo-600 dark:text-indigo-400 font-montserrat text-xl font-bold tracking-tight">
                Отзывы
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <IonButton 
                fill="clear" 
                onClick={() => setShowFilters(!showFilters)}
                className="text-indigo-600 dark:text-indigo-400"
              >
                <IonIcon icon={funnel} className="text-xl" />
              </IonButton>
              {isAuthenticated && (
                <IonButton 
                  fill="clear"
                  onClick={() => setShowAddReviewModal(true)}
                  className="text-indigo-600 dark:text-indigo-400"
                >
                  <IonIcon icon={addOutline} className="text-xl" />
                </IonButton>
              )}
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-gray-50 dark:bg-gray-900">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <div className="p-4">
          {/* Статистика и общий рейтинг */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 shadow-sm">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-montserrat font-bold text-gray-800 dark:text-gray-200 mb-2">
                Отзывы наших клиентов
              </h2>
              <div className="flex items-center justify-center mb-2">
                <div className="flex mr-3">
                  {renderAverageRating(averageRating)}
                </div>
                <span className="text-2xl font-montserrat font-bold text-gray-800 dark:text-gray-200">
                  {averageRating.toFixed(1)}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-montserrat">
                На основе {reviews.length} отзывов
              </p>
            </div>

            {/* Распределение по рейтингам */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(rating => {
                const count = ratingStats[rating as keyof typeof ratingStats];
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                
                return (
                  <div key={rating} className="flex items-center">
                    <span className="text-sm font-montserrat text-gray-600 dark:text-gray-400 w-8">
                      {rating}★
                    </span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mx-3">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-montserrat text-gray-500 dark:text-gray-400 w-8">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Фильтры */}
          {showFilters && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-montserrat font-semibold text-gray-800 dark:text-gray-200">
                  Фильтры и сортировка
                </h3>
                <IonButton 
                  fill="clear" 
                  size="small" 
                  onClick={clearFilters}
                  className="text-indigo-600 dark:text-indigo-400 font-montserrat"
                >
                  Очистить
                </IonButton>
              </div>
              
              <div className="space-y-3">
                <IonSearchbar
                  value={searchText}
                  onIonInput={(e) => setSearchText(e.detail.value!)}
                  placeholder="Поиск в отзывах..."
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg"
                />
                
                <div className="grid grid-cols-1 gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <IonSelect
                      value={filterRating}
                      onIonChange={(e) => setFilterRating(e.detail.value)}
                      placeholder="Рейтинг"
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg text-sm"
                      interfaceOptions={{ header: 'Выберите рейтинг' }}
                    >
                      <IonSelectOption value="">Все рейтинги</IonSelectOption>
                      <IonSelectOption value="5">5 звезд</IonSelectOption>
                      <IonSelectOption value="4">4 звезды</IonSelectOption>
                      <IonSelectOption value="3">3 звезды</IonSelectOption>
                      <IonSelectOption value="2">2 звезды</IonSelectOption>
                      <IonSelectOption value="1">1 звезда</IonSelectOption>
                    </IonSelect>
                    
                    <IonSelect
                      value={filterService}
                      onIonChange={(e) => setFilterService(e.detail.value)}
                      placeholder="Услуга"
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg text-sm"
                      interfaceOptions={{ header: 'Выберите услугу' }}
                    >
                      <IonSelectOption value="">Все услуги</IonSelectOption>
                      <IonSelectOption value="furniture">Мебель</IonSelectOption>
                      <IonSelectOption value="carpet">Ковры</IonSelectOption>
                      <IonSelectOption value="mattress">Матрасы</IonSelectOption>
                    </IonSelect>
                  </div>
                  
                  <IonSelect
                    value={sortBy}
                    onIonChange={(e) => setSortBy(e.detail.value)}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg text-sm"
                    interfaceOptions={{ header: 'Сортировка' }}
                  >
                    <IonSelectOption value="newest">Сначала новые</IonSelectOption>
                    <IonSelectOption value="oldest">Сначала старые</IonSelectOption>
                    <IonSelectOption value="highest">Высокий рейтинг</IonSelectOption>
                    <IonSelectOption value="lowest">Низкий рейтинг</IonSelectOption>
                  </IonSelect>
                </div>
              </div>
            </div>
          )}

          {/* Результаты поиска */}
          {(searchText || filterRating || filterService) && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 font-montserrat">
                Найдено отзывов: {filteredReviews.length}
                {searchText && ` по запросу "${searchText}"`}
                {filterRating && ` с рейтингом ${filterRating} звезд`}
                {filterService && ` по услуге "${getServiceTypeName(filterService)}"`}
              </p>
            </div>
          )}

          {/* Список отзывов */}
          {loading ? (
            <div className="flex justify-center py-8">
              <IonSpinner name="crescent" className="text-indigo-600" />
            </div>
          ) : filteredReviews.length > 0 ? (
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <ReviewCard 
                  key={review.id} 
                  review={review} 
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow-sm">
              <IonIcon icon={chatbubblesOutline} className="text-4xl text-gray-400 mb-3" />
              <h3 className="text-lg font-montserrat font-semibold text-gray-600 dark:text-gray-400 mb-2">
                {reviews.length === 0 ? 'Пока нет отзывов' : 'Отзывы не найдены'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-500 font-montserrat mb-4">
                {reviews.length === 0 
                  ? 'Станьте первым, кто оставит отзыв о наших услугах'
                  : 'Попробуйте изменить параметры поиска'
                }
              </p>
              {isAuthenticated ? (
                <IonButton
                  onClick={() => setShowAddReviewModal(true)}
                  className="custom-button rounded-xl text-sm font-montserrat"
                >
                  <IonIcon icon={addOutline} className="mr-2" />
                  Оставить отзыв
                </IonButton>
              ) : (
                <IonButton
                  onClick={goToLogin}
                  className="custom-button rounded-xl text-sm font-montserrat"
                >
                  Войти и оставить отзыв
                </IonButton>
              )}
            </div>
          )}

          {/* Призыв к действию для неавторизованных */}
          {!isAuthenticated && filteredReviews.length > 0 && (
            <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-4 mt-6">
              <div className="text-center">
                <h3 className="text-base font-montserrat font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Хотите поделиться своим опытом?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-montserrat mb-3">
                  Войдите в аккаунт, чтобы оставить отзыв
                </p>
                <IonButton 
                  onClick={goToLogin}
                  className="custom-button rounded-xl text-sm font-montserrat"
                >
                  Войти в аккаунт
                </IonButton>
              </div>
            </div>
          )}
        </div>

        {/* Бесконечная прокрутка */}
        <IonInfiniteScroll
          onIonInfinite={handleInfiniteScroll}
          threshold="100px"
          disabled={!hasMoreReviews}
        >
          <IonInfiniteScrollContent
            loadingSpinner="bubbles"
            loadingText="Загрузка отзывов..."
          ></IonInfiniteScrollContent>
        </IonInfiniteScroll>
      </IonContent>

      {/* Модальное окно добавления отзыва */}
      <IonModal isOpen={showAddReviewModal} onDidDismiss={() => setShowAddReviewModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonLabel slot="start" className="ml-4 font-montserrat font-bold">Новый отзыв</IonLabel>
            <IonButton 
              slot="end" 
              fill="clear" 
              onClick={() => setShowAddReviewModal(false)}
              className="mr-2"
            >
              Закрыть
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent className="p-4">
          <AddReviewForm 
            onReviewAdded={handleReviewAdded}
            onCancel={() => setShowAddReviewModal(false)}
          />
        </IonContent>
      </IonModal>

      {/* Bottom Navigation */}
      <IonFooter>
        <IonTabBar slot="bottom" className="bg-white dark:bg-gray-800 shadow-lg">
          <IonTabButton onClick={goToHome} className="text-gray-500 dark:text-gray-400">
            <IonIcon icon={homeOutline} className="text-xl" />
            <IonLabel className="text-xs font-montserrat">Главная</IonLabel>
          </IonTabButton>
          <IonTabButton onClick={goToOrder} className="text-gray-500 dark:text-gray-400">
            <IonIcon icon={calendarOutline} className="text-xl" />
            <IonLabel className="text-xs font-montserrat">Заказы</IonLabel>
          </IonTabButton>
          <IonTabButton className="text-indigo-600 dark:text-indigo-400">
            <IonIcon icon={chatbubblesOutline} className="text-xl" />
            <IonLabel className="text-xs font-montserrat">Отзывы</IonLabel>
          </IonTabButton>
          <IonTabButton onClick={goToProfile} className="text-gray-500 dark:text-gray-400">
            <IonIcon icon={personOutline} className="text-xl" />
            <IonLabel className="text-xs font-montserrat">Профиль</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonFooter>
    </IonPage>
  );
};

export default ReviewsPage;