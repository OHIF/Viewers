import { toast, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export type ToastProps = {
  content: string;
  type: 'info' | 'success' | 'warning' | 'error';
};

export const useToast = () => {
  const options: ToastOptions<unknown> = {
    position: 'top-right',
    autoClose: 2000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  };

  const showToast = ({ content, type }: ToastProps) => toast(content, { ...options, type });

  return {
    showToast,
  };
};
