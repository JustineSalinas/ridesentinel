// Demo-scoped "push notifications": the Notification Web API fired from
// the client that's already open, not a real push subscription/VAPID
// server round-trip. Good enough to demo "you get notified when matched /
// on SOS" without standing up push infrastructure — see docs/DECISIONS.md.

export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  if (!notificationsSupported()) return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported'
  return Notification.requestPermission()
}

export function notify(title: string, body?: string) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, icon: '/icon-192.png' })
  } catch {
    // Some platforms (e.g. iOS Safari outside an installed PWA) throw here
    // even when permission reads "granted" — never let a demo notification
    // crash the page.
  }
}
