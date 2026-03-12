import { toast as sonnerToast, type ExternalToast } from "sonner";

/**
 * Custom toast wrapper that adds "Copiar erro" button to all error toasts.
 */
const errorWithCopy = (message: string | React.ReactNode, data?: ExternalToast) => {
  const msg = typeof message === "string" ? message : String(message);
  return sonnerToast.error(message, {
    duration: 8000,
    action: {
      label: "Copiar erro",
      onClick: () => {
        navigator.clipboard.writeText(msg);
        sonnerToast.success("Erro copiado para a área de transferência!");
      },
    },
    ...data,
  });
};

// Re-export toast with overridden error method
export const toast = Object.assign(
  (...args: Parameters<typeof sonnerToast>) => sonnerToast(...args),
  {
    ...sonnerToast,
    error: errorWithCopy,
  }
);
