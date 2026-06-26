export const NOTIFICATIONS_ENABLED_KEY = 'pinkcloud_notifications_enabled';

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notification');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

export const areNotificationsEnabled = (): boolean => {
  if (!('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;
  return localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) !== 'false';
};

export const setNotificationsEnabled = (enabled: boolean) => {
  localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled ? 'true' : 'false');
};

export const sendNotification = (title: string, options?: NotificationOptions) => {
  if (!areNotificationsEnabled()) return;
  
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/favicon.svg',
      ...options
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
};
