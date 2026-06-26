export const NOTIFICATIONS_ENABLED_KEY = 'pinkcloud_notifications_enabled';

export const requestNotificationPermission = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notification');
      resolve(false);
      return;
    }
    
    if (Notification.permission === 'granted') {
      resolve(true);
      return;
    }
    
    if (Notification.permission !== 'denied') {
      const handlePermission = (permission: NotificationPermission) => {
        resolve(permission === 'granted');
      };
      
      try {
        const promise = Notification.requestPermission(handlePermission);
        if (promise) {
          promise.then(handlePermission).catch((err) => {
            console.error('Push permission error:', err);
            resolve(false);
          });
        }
      } catch (err) {
        console.error('Push permission error:', err);
        resolve(false);
      }
    } else {
      resolve(false);
    }
  });
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
