export function sendGameNotification(
  title: string,
  body: string,
  icon?: string
) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'game-notification', // Prevents duplicate notifications
    });
  }
}