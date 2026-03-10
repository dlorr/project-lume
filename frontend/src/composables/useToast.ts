import { ref } from "vue";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

const toasts = ref<Toast[]>([]);

export function useToast() {
  function add(toast: Omit<Toast, "id">) {
    const id = crypto.randomUUID();
    const duration = toast.duration ?? 4000;

    toasts.value.push({ ...toast, id });

    if (duration > 0) {
      setTimeout(() => remove(id), duration);
    }
  }

  function remove(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  const success = (title: string, message?: string) =>
    add({ type: "success", title, message });

  const error = (title: string, message?: string) =>
    add({ type: "error", title, message, duration: 6000 });

  const info = (title: string, message?: string) =>
    add({ type: "info", title, message });

  const warning = (title: string, message?: string) =>
    add({ type: "warning", title, message });

  return { toasts, add, remove, success, error, info, warning };
}
