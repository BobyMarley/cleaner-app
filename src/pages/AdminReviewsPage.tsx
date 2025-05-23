// pages/AdminReviewsPage.tsx - ИСПРАВЛЕННАЯ НАВИГАЦИЯ
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
  IonAlert,
  IonToast,
  IonSearchbar,
  IonSelect,
  IonSelectOption
} from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { 
  arrowBackOutline, 
  checkmarkCircle, 
  closeCircle, 
  funnel, 
  refresh,
  shieldCheckmarkOutline,
  alertCircleOutline,
  checkmarkOutline,
  eyeOutline
} from 'ionicons/icons';
import { 
  getAllReviews, 
  approveReview, 
  rejectReview, 
  Review, 
  auth, 
  onAuthStateChanged 
} from '../services/firebase';
import ReviewCard from '../components/ReviewCard';
import newLogo from '../assets/new-logo.png';

const adminEmails = ['plenkanet@gmail.com'];

const AdminReviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSegment, setSelectedSegment] = useState<string>('pending');
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');
  const [filterRating, setFilterRating] = useState<string>('');
  const [filterService, setFilterService] = useState<string>('');
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [alertConfig, setAlertConfig] = useState<{
    header?: string;
    message?: string;
    buttons: Array<{ text: string; role?: string; handler?: () => void }>;
  }>({
    header: '',
    message: '',
    buttons: []
  });
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [user, setUser] = useState<any>(null); // Состояние для пользователя

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser || !adminEmails.includes(currentUser.email || '')) {
        navigate('/');
      } else {
        loadAllReviews();
      }
    });
    return () => unsubscribe(); // Очистка подписки
  }, [navigate]);

  useEffect(() => {
    if (user && adminEmails.includes(user.email || '')) {
      filterReviews();
    }
  }, [selectedSegment, allReviews, searchText, filterRating, filterService, user]);

  const loadAllReviews = async () => {
    try {
      setLoading(true);
      const reviews = await getAllReviews();
      setAllReviews(reviews);
    } catch (error) {
      console.error('Ошибка при загрузке отзывов:', error);
      setToastMessage('Ошибка при загрузке отзывов');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const filterReviews = () => {
    let filtered = [...allReviews];

    switch (selectedSegment) {
      case 'pending':
        filtered = filtered.filter(r => !r.isApproved);
        break;
      case 'approved':
        filtered = filtered.filter(r => r.isApproved && r.isPublished);
        break;
      case 'rejected':
        filtered = filtered.filter(r => r.isApproved === false && r.isPublished === false);
        break;
      default:
        break;
    }

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(r => 
        r.comment.toLowerCase().includes(search) ||
        r.userName.toLowerCase().includes(search) ||
        r.userEmail.toLowerCase().includes(search)
      );
    }

    if (filterRating) {
      filtered = filtered.filter(r => r.rating === parseInt(filterRating));
    }

    if (filterService) {
      filtered = filtered.filter(r => r.serviceType === filterService);
    }

    setFilteredReviews(filtered);
  };

  const handleApprove = (reviewId: string) => {
    if (!reviewId) {
      setToastMessage('Ошибка: ID отзыва не указан');
      setShowToast(true);
      return;
    }
    setAlertConfig({
      header: 'Подтверждение',
      message: 'Вы уверены, что хотите одобрить этот отзыв?',
      buttons: [
        { text: 'Отмена', role: 'cancel' },
        { text: 'Одобрить', handler: () => approveReviewAction(reviewId) }
      ]
    });
    setShowAlert(true);
  };

  const handleReject = (reviewId: string) => {
    if (!reviewId) {
      setToastMessage('Ошибка: ID отзыва не указан');
      setShowToast(true);
      return;
    }
    setAlertConfig({
      header: 'Подтверждение',
      message: 'Вы уверены, что хотите отклонить этот отзыв?',
      buttons: [
        { text: 'Отмена', role: 'cancel' },
        { text: 'Отклонить', handler: () => rejectReviewAction(reviewId) }
      ]
    });
    setShowAlert(true);
  };

  const approveReviewAction = async (reviewId: string) => {
    try {
      await approveReview(reviewId);
      setToastMessage('Отзыв одобрен');
      setShowToast(true);
      loadAllReviews();
    } catch (error) {
      console.error('Ошибка при одобрении отзыва:', error);
      setToastMessage('Ошибка при одобрении отзыва');
      setShowToast(true);
    }
  };

  const rejectReviewAction = async (reviewId: string) => {
    try {
      await rejectReview(reviewId);
      setToastMessage('Отзыв отклонен');
      setShowToast(true);
      loadAllReviews();
    } catch (error) {
      console.error('Ошибка при отклонении отзыва:', error);
      setToastMessage('Ошибка при отклонении отзыва');
      setShowToast(true);
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadAllReviews();
    event.detail.complete();
  };

  const clearFilters = () => {
    setSearchText('');
    setFilterRating('');
    setFilterService('');
  };

  const stats = {
    total: allReviews.length,
    pending: allReviews.filter(r => !r.isApproved).length,
    approved: allReviews.filter(r => r.isApproved && r.isPublished).length,
    rejected: allReviews.filter(r => r.isApproved === false && r.isPublished === false).length
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] shadow-lg">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <IonButton fill="clear" onClick={() => navigate('/admin')} className="text-white mr-2">
                <IonIcon icon={arrowBackOutline} className="text-xl" />
              </IonButton>
              <img src={newLogo} alt="BrightWaw Logo" className="h-9 mr-3" />
              <span className="text-white font-montserrat text-xl font-bold tracking-tight">
                Модерация отзывов
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <IonButton fill="clear" onClick={loadAllReviews} className="text-white">
                <IonIcon icon={refresh} className="text-xl" />
              </IonButton>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-gray-50 dark:bg-gray-900">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <div className="p-4">
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-sm">
              <div className="text-lg font-montserrat font-bold text-gray-800 dark:text-gray-200">
                {stats.total}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-montserrat">
                Всего
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-xl p-3 text-center shadow-sm">
              <div className="text-lg font-montserrat font-bold text-yellow-600 dark:text-yellow-400">
                {stats.pending}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-montserrat">
                Ожидают
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-3 text-center shadow-sm">
              <div className="text-lg font-montserrat font-bold text-green-600 dark:text-green-400">
                {stats.approved}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-montserrat">
                Одобрено
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/30 rounded-xl p-3 text-center shadow-sm">
              <div className="text-lg font-montserrat font-bold text-red-600 dark:text-red-400">
                {stats.rejected}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-montserrat">
                Отклонено
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-montserrat font-semibold text-gray-800 dark:text-gray-200">
                Поиск и фильтры
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
                placeholder="Поиск по тексту, имени или email..."
                className="bg-gray-50 dark:bg-gray-700 rounded-lg"
              />
              
              <div className="grid grid-cols-2 gap-3">
                <IonSelect
                  value={filterRating}
                  onIonChange={(e) => setFilterRating(e.detail.value)}
                  placeholder="Рейтинг"
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg text-sm"
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
                >
                  <IonSelectOption value="">Все услуги</IonSelectOption>
                  <IonSelectOption value="furniture">Мебель</IonSelectOption>
                  <IonSelectOption value="carpet">Ковры</IonSelectOption>
                  <IonSelectOption value="mattress">Матрасы</IonSelectOption>
                </IonSelect>
              </div>
            </div>
          </div>

          <IonSegment 
            value={selectedSegment} 
            onIonChange={(e) => setSelectedSegment(e.detail.value as string)}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6"
          >
            <IonSegmentButton value="pending" className="font-montserrat">
              <IonIcon icon={eyeOutline} className="mr-1" />
              <IonLabel>Ожидают ({stats.pending})</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="approved" className="font-montserrat">
              <IonIcon icon={checkmarkCircle} className="mr-1" />
              <IonLabel>Одобрены ({stats.approved})</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="all" className="font-montserrat">
              <IonLabel>Все ({stats.total})</IonLabel>
            </IonSegmentButton>
          </IonSegment>

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
                  showActions={selectedSegment === 'pending'}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow-sm">
              <IonIcon 
                icon={selectedSegment === 'pending' ? alertCircleOutline : checkmarkOutline} 
                className="text-4xl text-gray-400 mb-3" 
              />
              <h3 className="text-lg font-montserrat font-semibold text-gray-600 dark:text-gray-400 mb-2">
                {selectedSegment === 'pending' ? 'Нет отзывов на модерации' : 'Отзывы не найдены'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-500 font-montserrat">
                {selectedSegment === 'pending' 
                  ? 'Все отзывы проверены' 
                  : 'Попробуйте изменить фильтры поиска'
                }
              </p>
            </div>
          )}
        </div>
      </IonContent>

      <IonAlert
        isOpen={showAlert && alertConfig.buttons.length > 0}
        onDidDismiss={() => {
          setShowAlert(false);
          setAlertConfig({ header: '', message: '', buttons: [] });
        }}
        header={alertConfig.header}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
      />

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position="bottom"
      />
    </IonPage>
  );
};

export default AdminReviewsPage;