export const sendOrderToTelegram = async (order: any) => {
  const botToken = '6339860942:AAFolHF7Pk1HCLWwDIGhkvYEr2P-9eEBUgw'; // Замени на свой токен
  const chatId = '1137562732'; // Замени на свой chat ID

  // Безопасное извлечение данных с fallback значениями
  const carpetArea = order.carpetArea || '0';
  const chairCount = order.chairCount || 0;
  const armchairCount = order.armchairCount || 0;
  const sofaCount = order.sofaCount || 0;
  const mattressCount = order.mattressCount || 0;
  const withPillows = order.withPillows ? 'Да' : 'Нет';
  const additionalInfo = order.additionalInfo || 'Нет';
  const images = order.images && order.images.length > 0 ? order.images.join(', ') : 'Нет';
  const scheduledDate = order.scheduledDate ? new Date(order.scheduledDate).toLocaleString('ru-RU') : 'Не указана';
  const price = order.price || '---';

  const message = `
🆕 Новый заказ:

📐 Ковер: ${carpetArea} кв.м
🪑 Стулья: ${chairCount}
🛋️ Кресла: ${armchairCount}
🛋️ Диваны: ${sofaCount}
🛏️ Матрасы: ${mattressCount}
🪁 С подушками: ${withPillows}

📝 Доп. информация: ${additionalInfo}
📸 Изображения: ${images}
📅 Запланированная дата: ${scheduledDate}
💰 Цена: ${price}

⏰ Время создания: ${new Date().toLocaleString('ru-RU')}
  `;

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Telegram API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Сообщение отправлено в Telegram:', result);
    return result;

  } catch (error) {
    console.error('Ошибка при отправке в Telegram:', error);
    throw error;
  }
};