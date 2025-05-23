// components/AddReviewForm.tsx - ФОРМА ДОБАВЛЕНИЯ ОТЗЫВА
import React, { useState } from 'react';
import {
  IonButton,
  IonItem,
  IonLabel,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonIcon,
  IonToast,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonInput
} from '@ionic/react';
import {
  star,
  starOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  cameraOutline,
  trashOutline
} from 'ionicons/icons';
import { addReview, auth } from '../services/firebase';

interface AddReviewFormProps {
  onReviewAdded: () => void;
  onCancel: () => void;
  orderId?: string; // Если отзыв привязан к конкретному заказу
}

const AddReviewForm: React.FC<AddReviewFormProps> = ({
  onReviewAdded,
  onCancel,
  orderId
}) => {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [serviceType, setServiceType] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning'>('success');

  const handleRatingClick = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const handleSubmit = async () => {
    // Валидация
    if (rating === 0) {
      showToastMessage('Пожалуйста, поставьте оценку', 'warning');
      return;
    }

    if (comment.trim().length < 10) {
      showToastMessage('Комментарий должен содержать минимум 10 символов', 'warning');
      return;
    }

    if (!serviceType) {
      showToastMessage('Пожалуйста, выберите тип услуги', 'warning');
      return;
    }

    if (!auth.currentUser) {
      showToastMessage('Необходимо войти в аккаунт', 'danger');
      return;
    }

    setLoading(true);

    try {
      const reviewData = {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Пользователь',
        userEmail: auth.currentUser.email || '',
        rating: rating,
        comment: comment.trim(),
        serviceType: serviceType,
        photos: photos,
        ...(orderId && { orderId })
      };

      await addReview(reviewData);
      
      showToastMessage('Отзыв успешно добавлен! Он будет опубликован после модерации.', 'success');
      
      // Сброс формы
      setRating(0);
      setComment('');
      setServiceType('');
      setPhotos([]);
      
      // Уведомляем родительский компонент
      setTimeout(() => {
        onReviewAdded();
      }, 1500);
      
    } catch (error) {
      console.error('Ошибка при добавлении отзыва:', error);
      showToastMessage('Произошла ошибка при добавлении отзыва', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const showToastMessage = (message: string, color: 'success' | 'danger' | 'warning' = 'success') => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Ограничиваем количество фото
    if (photos.length + files.length > 3) {
      showToastMessage('Можно загрузить максимум 3 фотографии', 'warning');
      return;
    }

    // Конвертируем файлы в base64 для демонстрации
    // В реальном приложении здесь должна быть загрузка в Firebase Storage
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPhotos(prev => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <IonIcon
          key={i}
          icon={i <= rating ? star : starOutline}
          className={`text-2xl cursor-pointer transition-colors ${
            i <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
          }`}
          onClick={() => handleRatingClick(i)}
        />
      );
    }
    return stars;
  };

  const getServiceTypeName = (type: string) => {
    switch (type) {
      case 'furniture': return 'Мебель';
      case 'carpet': return 'Ковры';
      case 'mattress': return 'Матрасы';
      default: return 'Выберите услугу';
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <IonCard className="rounded-xl overflow-hidden shadow-sm">
        <IonCardContent className="p-6">
          <h3 className="text-xl font-montserrat font-bold text-gray-800 dark:text-gray-200 mb-6 text-center">
            Оставить отзыв
          </h3>

          {/* Рейтинг */}
          <div className="mb-6">
            <IonLabel className="block text-sm font-montserrat font-medium text-gray-700 dark:text-gray-300 mb-3">
              Ваша оценка *
            </IonLabel>
            <div className="flex justify-center space-x-2 mb-2">
              {renderStars()}
            </div>
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 font-montserrat">
              {rating === 0 && 'Нажмите на звезды для оценки'}
              {rating === 1 && 'Очень плохо'}
              {rating === 2 && 'Плохо'}
              {rating === 3 && 'Нормально'}
              {rating === 4 && 'Хорошо'}
              {rating === 5 && 'Отлично'}
            </p>
          </div>

          {/* Тип услуги */}
          <div className="mb-6">
            <IonLabel className="block text-sm font-montserrat font-medium text-gray-700 dark:text-gray-300 mb-2">
              Тип услуги *
            </IonLabel>
            <IonSelect
              value={serviceType}
              onIonChange={(e) => setServiceType(e.detail.value)}
              placeholder="Выберите услугу"
              className="bg-gray-50 dark:bg-gray-700 rounded-lg"
              interfaceOptions={{ header: 'Выберите тип услуги' }}
            >
              <IonSelectOption value="furniture">Мебель</IonSelectOption>
              <IonSelectOption value="carpet">Ковры</IonSelectOption>
              <IonSelectOption value="mattress">Матрасы</IonSelectOption>
            </IonSelect>
          </div>

          {/* Комментарий */}
          <div className="mb-6">
            <IonLabel className="block text-sm font-montserrat font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ваш отзыв *
            </IonLabel>
            <IonTextarea
              value={comment}
              onIonInput={(e) => setComment(e.detail.value!)}
              placeholder="Расскажите о своем опыте работы с нами..."
              rows={4}
              maxlength={500}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 font-montserrat mt-1">
              Минимум 10 символов ({comment.length}/500)
            </p>
          </div>

          {/* Загрузка фото */}
          <div className="mb-6">
            <IonLabel className="block text-sm font-montserrat font-medium text-gray-700 dark:text-gray-300 mb-2">
              Фотографии (необязательно)
            </IonLabel>
            
            {photos.length < 3 && (
              <div className="mb-4">
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-indigo-400 transition-colors">
                    <IonIcon icon={cameraOutline} className="text-2xl text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-montserrat">
                      Нажмите для загрузки фото
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-montserrat">
                      Максимум 3 фотографии
                    </p>
                  </div>
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
            )}

            {/* Preview загруженных фото */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={photo}
                      alt={`Фото ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    <IonButton
                      fill="clear"
                      size="small"
                      onClick={() => removePhoto(index)}
                      className="absolute top-0 right-0 text-red-500 bg-white rounded-full w-6 h-6 p-0 m-1"
                    >
                      <IonIcon icon={trashOutline} className="text-xs" />
                    </IonButton>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Кнопки */}
          <div className="flex space-x-3">
            <IonButton
              expand="block"
              onClick={handleSubmit}
              disabled={loading || rating === 0 || comment.trim().length < 10 || !serviceType}
              className="custom-button rounded-xl font-montserrat h-12 flex-1"
            >
              {loading ? (
                <>
                  <IonSpinner className="mr-2" />
                  Отправка...
                </>
              ) : (
                <>
                  <IonIcon icon={checkmarkCircleOutline} slot="start" />
                  Отправить отзыв
                </>
              )}
            </IonButton>
            
            <IonButton
              expand="block"
              fill="outline"
              onClick={onCancel}
              disabled={loading}
              className="rounded-xl font-montserrat h-12"
            >
              <IonIcon icon={closeCircleOutline} slot="start" />
              Отмена
            </IonButton>
          </div>

          {/* Информация о модерации */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300 font-montserrat text-center">
              ℹ️ Ваш отзыв будет опубликован после проверки модератором
            </p>
          </div>
        </IonCardContent>
      </IonCard>

      {/* Toast уведомления */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position="bottom"
        color={toastColor}
        className="font-montserrat"
      />
    </div>
  );
};

export default AddReviewForm;