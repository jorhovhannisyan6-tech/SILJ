export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
}

export function notify(toast: Omit<ToastMessage, 'id'>) {
  const fullToast: ToastMessage = {
    ...toast,
    id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    duration: toast.duration || 4500
  };
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sil-notification', { detail: fullToast }));
  }
}

export function notifySuccess(message: string, title?: string) {
  notify({ type: 'success', title: title || 'Հաջողվեց', message });
}

export function notifyError(message: string, title?: string) {
  notify({ type: 'error', title: title || 'Սխալ', message });
}

export function notifyInfo(message: string, title?: string) {
  notify({ type: 'info', title: title || 'Տեղեկացում', message });
}

export function notifyWarning(message: string, title?: string) {
  notify({ type: 'warning', title: title || 'Ուշադրություն', message });
}
