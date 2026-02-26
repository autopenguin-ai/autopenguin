/**
 * Native Browser Notifications API
 * Simple, free, and works exactly like Lovable notifications
 */

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const showNotification = (title: string, options?: NotificationOptions) => {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return;
  }
  
  if (Notification.permission !== 'granted') {
    console.log('Notification permission not granted');
    return;
  }

  const notification = new Notification(title, {
    icon: '/autopenguin-logo.png',
    badge: '/autopenguin-logo.png',
    ...options
  });

  // Auto-close after 5 seconds
  setTimeout(() => notification.close(), 5000);

  // Focus the tab when clicked
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
};

export const hasNotificationPermission = (): boolean => {
  return 'Notification' in window && Notification.permission === 'granted';
};

export const isNotificationSupported = (): boolean => {
  return 'Notification' in window;
};
