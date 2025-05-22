import { Capacitor } from '@capacitor/core';

export const setupPushNotifications = async () => {
  const platform = Capacitor.getPlatform();

  if (platform === 'web') {
    console.warn('❌ PushNotifications not supported on Web.');
    return;
  }

  const { PushNotifications } = await import('@capacitor/push-notifications');

  try {
    const permStatus = await PushNotifications.requestPermissions();

    if (permStatus.receive !== 'granted') {
      console.warn('🚫 Push notification permission not granted.');
      return;
    }

    await PushNotifications.register();

    PushNotifications.addListener('registration', (token) => {
      console.log('✅ Push registration success, token:', token.value);
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('❗ Push registration error:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('📩 Push received:', notification);
      alert(`Новое уведомление: ${notification.title}\n${notification.body}`);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('➡️ Push action performed:', notification);
    });

  } catch (err) {
    console.error('⚠️ Error setting up push notifications:', err);
  }
};
