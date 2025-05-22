export const sendOrderToTelegram = async (order: any) => {
  const botToken = '6339860942:AAFolHF7Pk1HCLWwDIGhkvYEr2P-9eEBUgw'; // Замени на свой токен
  const chatId = '1137562732'; // Замени на свой chat ID

  const message = `
    Новый заказ:
    Ковер: ${order.carpetArea} кв.м
    Стулья: ${order.chairCount}
    Кресла: ${order.armchairCount}
    Диваны: ${order.sofaCount}
    С подушками: ${order.withPillows ? 'Да' : 'Нет'}
    Доп. информация: ${order.additionalInfo || 'Нет'}
    Изображения: ${order.images.join(', ') || 'Нет'}
    Время: ${order.createdAt}
  `;

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
    }),
  });

  if (!response.ok) {
    throw new Error('Ошибка при отправке в Telegram');
  }
};