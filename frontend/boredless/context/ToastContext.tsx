import React, { createContext, useContext, useState, useCallback } from 'react';

interface ToastState {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration: number;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning', duration?: number) => void;
  hideToast: () => void;
  toastState: ToastState;
}

const initialToastState: ToastState = {
  visible: false,
  message: '',
  type: 'info',
  duration: 3000,
};

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
  hideToast: () => {},
  toastState: initialToastState,
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toastState, setToastState] = useState<ToastState>(initialToastState);

  const showToast = useCallback((
    message: string, 
    type: 'success' | 'error' | 'info' | 'warning' = 'info', 
    duration: number = 3000
  ) => {
    setToastState({
      visible: true,
      message,
      type,
      duration,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToastState(prev => ({ ...prev, visible: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast, toastState }}>
      {children}
    </ToastContext.Provider>
  );
}; 