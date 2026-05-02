import { AnimatePresence } from "framer-motion"
import { useToastStore } from "../store/useToastStore"
import Toast from "./Toast"

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast id={toast.id} type={toast.type} message={toast.message} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}