'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastComponent({ toast, onClose }: ToastProps) {
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onClose(toast.id);
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onClose]);

  const styles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-600',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: AlertCircle,
      iconColor: 'text-red-600',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: Info,
      iconColor: 'text-blue-600',
    },
  };

  const style = styles[toast.type];
  const Icon = style.icon;

  return (
    <div
      className={`${style.bg} ${style.border} border rounded-lg shadow-lg p-4 mb-3 min-w-[300px] max-w-md animate-slide-in-right`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />
        <p className={`${style.text} text-sm flex-1`}>{toast.message}</p>
        <button
          onClick={() => onClose(toast.id)}
          className={`${style.text} hover:opacity-70 transition-opacity flex-shrink-0`}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}

// Toast hook/store
let toastIdCounter = 0;
const toastListeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

function notifyListeners() {
  toastListeners.forEach((listener) => listener([...toasts]));
}

export function useToast() {
  const showToast = (message: string, type: ToastType = 'info', duration = 5000) => {
    const id = `toast-${++toastIdCounter}`;
    const newToast: Toast = { id, message, type, duration };
    toasts = [...toasts, newToast];
    notifyListeners();
  };

  const removeToast = (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    notifyListeners();
  };

  return { showToast, removeToast };
}

// Global toast functions
export const toast = {
  success: (message: string, duration?: number) => {
    const id = `toast-${++toastIdCounter}`;
    const newToast: Toast = { id, message, type: 'success', duration: duration ?? 5000 };
    toasts = [...toasts, newToast];
    notifyListeners();
  },
  error: (message: string, duration?: number) => {
    const id = `toast-${++toastIdCounter}`;
    const newToast: Toast = { id, message, type: 'error', duration: duration ?? 7000 };
    toasts = [...toasts, newToast];
    notifyListeners();
  },
  info: (message: string, duration?: number) => {
    const id = `toast-${++toastIdCounter}`;
    const newToast: Toast = { id, message, type: 'info', duration: duration ?? 5000 };
    toasts = [...toasts, newToast];
    notifyListeners();
  },
  warning: (message: string, duration?: number) => {
    const id = `toast-${++toastIdCounter}`;
    const newToast: Toast = { id, message, type: 'warning', duration: duration ?? 6000 };
    toasts = [...toasts, newToast];
    notifyListeners();
  },
};

export function useToastState() {
  const [state, setState] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => {
      setState(newToasts);
    };
    toastListeners.push(listener);
    setState([...toasts]);

    return () => {
      const index = toastListeners.indexOf(listener);
      if (index > -1) {
        toastListeners.splice(index, 1);
      }
    };
  }, []);

  const removeToast = (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    notifyListeners();
  };

  return { toasts: state, removeToast };
}

