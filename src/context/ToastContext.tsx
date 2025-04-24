// src/context/ToastContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
  Context,
} from "react";
import bootstrap from "react-bootstrap";
import Toast from "bootstrap/js/dist/toast";

// 타입 정의
type ToastType = "success" | "error" | "warning" | "danger";

interface ToastInfo {
  show: boolean;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toastInfo, setToastInfo] = useState<ToastInfo>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: ToastType = "success") => {
    setToastInfo({ show: true, message, type });
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <GlobalToast
        show={toastInfo.show}
        message={toastInfo.message}
        type={toastInfo.type}
        onClose={() => setToastInfo(prev => ({ ...prev, show: false }))}
      />
    </ToastContext.Provider>
  );
};

// GlobalToast 컴포넌트 Props 타입
interface GlobalToastProps {
  show: boolean;
  message: string;
  type: ToastType;
  onClose: () => void;
}

const GlobalToast = ({ show, message, type, onClose }: GlobalToastProps) => {
  const toastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show && toastRef.current) {
      const toast = new Toast(toastRef.current, {
        autohide: true,
        delay: 3000,
      });
      toast.show();

      const handleHidden = () => onClose();
      toastRef.current.addEventListener("hidden.bs.toast", handleHidden);

      return () => {
        toastRef.current?.removeEventListener("hidden.bs.toast", handleHidden);
        toast.dispose();
      };
    }
  }, [show, onClose]);

  const bgClass: Record<ToastType, string> = {
    success: "bg-success",
    error: "bg-danger",
    warning: "bg-warning",
    danger: "bg-danger",
  };

  return (
    <div className="toast-container position-fixed bottom-0 end-0 pb-3">
      <div
        ref={toastRef}
        className={`toast fade ${bgClass[type]} text-white`}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <div className="toast-body d-flex align-items-center">
          <span>{message}</span>
          <button
            type="button"
            className="btn-close btn-close-white ms-auto"
            data-bs-dismiss="toast"
            aria-label="Close"
          />
        </div>
      </div>
    </div>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
