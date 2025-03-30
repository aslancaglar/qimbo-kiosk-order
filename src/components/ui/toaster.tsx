
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useState } from "react"

export function Toaster() {
  const [mounted, setMounted] = useState(false)
  
  // Only run the hook after mount to ensure we're in a React context
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Only try to access toast data after component is mounted
  const { toasts } = mounted ? useToast() : { toasts: [] }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
