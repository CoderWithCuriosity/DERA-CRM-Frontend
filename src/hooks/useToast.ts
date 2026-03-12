import toast from 'react-hot-toast';

interface ToastOptions {
  duration?: number;
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
}

export function useToast() {
  const defaultOptions: ToastOptions = {
    duration: 4000,
    position: 'top-right',
  };

  return {
    success: (message: string, options?: ToastOptions) => {
      toast.success(message, { ...defaultOptions, ...options });
    },
    error: (message: string, options?: ToastOptions) => {
      toast.error(message, { ...defaultOptions, ...options });
    },
    info: (message: string, options?: ToastOptions) => {
      toast(message, { ...defaultOptions, ...options, icon: 'ℹ️' });
    },
    warning: (message: string, options?: ToastOptions) => {
      toast(message, { ...defaultOptions, ...options, icon: '⚠️' });
    },
    loading: (message: string, options?: ToastOptions) => {
      return toast.loading(message, { ...defaultOptions, ...options });
    },
    dismiss: (toastId?: string) => {
      if (toastId) {
        toast.dismiss(toastId);
      } else {
        toast.dismiss();
      }
    },
  };
}