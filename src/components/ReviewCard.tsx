// components/ReviewCard.tsx
import React, { useState } from 'react';
import { IonCard, IonCardContent, IonIcon, IonButton, IonImg } from '@ionic/react';
import { star, starOutline, timeOutline, checkmarkCircle, closeCircle, eyeOutline } from 'ionicons/icons';
import { Review } from '../services/firebase';

interface ReviewCardProps {
  review: Review;
  showActions?: boolean; // для админки
  onApprove?: (reviewId: string) => void;
  onReject?: (reviewId: string) => void;
  compact?: boolean; // компактный вид для профиля
}

const ReviewCard: React.FC<ReviewCardProps> = ({ 
  review, 
  showActions = false, 
  onApprove, 
  onReject,
  compact = false 
}) => {
  const [showFullComment, setShowFullComment] = useState(false);

  // Функция для отображения звезд рейтинга
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <IonIcon
          key={i}
          icon={i <= rating ? star : starOutline}
          className={`text-lg ${i <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
        />
      );
    }
    return stars;
  };

  // Функция для получения названия типа услуги
  const getServiceTypeName = (serviceType: string) => {
    switch (serviceType) {
      case 'furniture': return 'Мебель';
      case 'carpet': return 'Ковры';
      case 'mattress': return 'Матрасы';
      default: return 'Услуга';
    }
  };

  // Обрезка комментария для компактного вида
  const truncatedComment = review.comment.length > 150 
    ? review.comment.substring(0, 150) + '...'
    : review.comment;

  const displayComment = compact && !showFullComment ? truncatedComment : review.comment;

  return (
    <IonCard className={`m-0 rounded-xl overflow-hidden shadow-sm ${compact ? 'mb-3' : 'mb-4'}`}>
      <IonCardContent className="p-0">
        <div className={`p-${compact ? '4' : '6'}`}>
          {/* Заголовок с информацией о пользователе */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <h4 className={`font-montserrat font-semibold text-gray-800 dark:text-gray-200 ${compact ? 'text-sm' : 'text-base'}`}>
                  {review.userName}
                </h4>
                {review.isApproved && (
                  <IonIcon 
                    icon={checkmarkCircle} 
                    className="text-green-500 ml-2 text-sm" 
                  />
                )}
              </div>
              
              {/* Рейтинг */}
              <div className="flex items-center mb-2">
                <div className="flex mr-2">
                  {renderStars(review.rating)}
                </div>
                <span className={`font-montserrat font-medium text-gray-600 dark:text-gray-400 ${compact ? 'text-xs' : 'text-sm'}`}>
                  {review.rating}/5
                </span>
              </div>

              {/* Тип услуги */}
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-full font-montserrat">
                  {getServiceTypeName(review.serviceType)}
                </span>
              </div>
            </div>

            {/* Дата */}
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <IonIcon icon={timeOutline} className="mr-1" />
              <span className="font-montserrat">
                {new Date(review.createdAt).toLocaleDateString('ru-RU')}
              </span>
            </div>
          </div>

          {/* Комментарий */}
          <div className="mb-4">
            <p className={`text-gray-700 dark:text-gray-300 font-montserrat leading-relaxed ${compact ? 'text-sm' : 'text-base'}`}>
              {displayComment}
            </p>
            {compact && review.comment.length > 150 && (
              <IonButton
                fill="clear"
                size="small"
                onClick={() => setShowFullComment(!showFullComment)}
                className="mt-1 p-0 h-auto text-indigo-600 dark:text-indigo-400 font-montserrat text-xs"
              >
                {showFullComment ? 'Свернуть' : 'Читать полностью'}
              </IonButton>
            )}
          </div>

          {/* Фотографии */}
          {review.photos && review.photos.length > 0 && (
            <div className="mb-4">
              <div className="grid grid-cols-3 gap-2">
                {review.photos.slice(0, 3).map((photo, index) => (
                  <div key={index} className={`relative ${compact ? 'h-16' : 'h-24'} bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden`}>
                    <IonImg 
                      src={photo} 
                      alt={`Фото отзыва ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {review.photos!.length > 3 && index === 2 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-montserrat text-xs">
                          +{review.photos!.length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Статус модерации (только для админки или профиля) */}
          {(!review.isApproved || !review.isPublished) && (
            <div className="mb-4">
              <div className={`px-3 py-2 rounded-lg text-xs font-montserrat flex items-center ${
                review.isApproved 
                  ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                  : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400'
              }`}>
                <IonIcon 
                  icon={review.isApproved ? checkmarkCircle : eyeOutline} 
                  className="mr-1" 
                />
                {review.isApproved ? 'Одобрен' : 'На модерации'}
              </div>
            </div>
          )}

          {/* Действия для админки */}
          {showActions && !review.isApproved && (
            <div className="flex space-x-2 pt-4 border-t border-gray-100 dark:border-gray-700">
              <IonButton
                size="small"
                onClick={() => onApprove?.(review.id!)}
                className="custom-button rounded-lg text-xs font-montserrat h-8 flex-1"
              >
                <IonIcon icon={checkmarkCircle} className="mr-1" />
                Одобрить
              </IonButton>
              <IonButton
                size="small"
                fill="outline"
                color="danger"
                onClick={() => onReject?.(review.id!)}
                className="rounded-lg text-xs font-montserrat h-8 flex-1 border-red-300 text-red-600"
              >
                <IonIcon icon={closeCircle} className="mr-1" />
                Отклонить
              </IonButton>
            </div>
          )}
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default ReviewCard;