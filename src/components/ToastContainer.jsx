import { useToastStore } from "../store/useToastStore";

function Toast({ type, message }) {
  const styles = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    warn: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };
  const icons = { success: "✓", warn: "⚠", info: "ℹ" };
  
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium pointer-events-auto ${styles[type] || styles.info}`}>
      <span className="font-bold">{icons[type] || icons.info}</span>
      {message}
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <Toast key={t.id} type={t.type} message={t.message} />
      ))}
    </div>
  );
}