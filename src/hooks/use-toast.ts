
// This file implements the toast hook used throughout the application
import { 
  Toast,
  ToastActionElement,
  ToastProps 
} from "@/components/ui/toast";

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 1000000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: string;
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: string;
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action;

      if (toastId) {
        return {
          ...state,
          toasts: state.toasts.map((t) =>
            t.id === toastId ? { ...t, open: false } : t
          ),
        };
      }

      return {
        ...state,
        toasts: state.toasts.map((t) => ({ ...t, open: false })),
      };
    }

    case actionTypes.REMOVE_TOAST: {
      const { toastId } = action;

      if (toastId) {
        return {
          ...state,
          toasts: state.toasts.filter((t) => t.id !== toastId),
        };
      }

      return {
        ...state,
        toasts: [],
      };
    }
  }
};

const dispatch = (action: Action) => {
  let ctx = useToastContext();
  let { toasts } = ctx;

  switch (action.type) {
    case actionTypes.ADD_TOAST:
      ctx.setToasts([action.toast, ...toasts].slice(0, TOAST_LIMIT));
      break;
    
    case actionTypes.UPDATE_TOAST:
      ctx.setToasts(
        toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t))
      );
      break;
    
    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action;

      if (toastId) {
        ctx.setToasts(
          toasts.map((t) => (t.id === toastId ? { ...t, open: false } : t))
        );
      } else {
        ctx.setToasts(toasts.map((t) => ({ ...t, open: false })));
      }
      break;
    }
    
    case actionTypes.REMOVE_TOAST: {
      const { toastId } = action;

      if (toastId) {
        ctx.setToasts(toasts.filter((t) => t.id !== toastId));
      } else {
        ctx.setToasts([]);
      }
      break;
    }
  }
};

type Toast = Omit<ToasterToast, "id">;

function toast(props: Toast) {
  const id = genId();

  const update = (props: Toast) =>
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: { ...props, id },
    });

  const dismiss = () =>
    dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id });

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id,
    dismiss,
    update,
  };
}

interface ToastContextType extends State {
  setToasts: React.Dispatch<React.SetStateAction<ToasterToast[]>>;
}

const ToastContext = createContext<ToastContextType | null>(null);

function useToastContext() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}

function useToast() {
  return {
    toast,
    dismiss: (toastId?: string) =>
      dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
    toasts: useToastContext().toasts,
  };
}

export { useToast, toast };

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToasterToast[]>([]);
  
  return (
    <ToastContext.Provider value={{ toasts, setToasts }}>
      {children}
    </ToastContext.Provider>
  );
};
