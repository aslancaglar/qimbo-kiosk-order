
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"
import { useEffect, useState } from "react"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  // Add error handling for theme context
  const [mounted, setMounted] = useState(false)
  
  // Only try to access theme after component is mounted
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const { theme = "system" } = mounted ? useTheme() : { theme: "system" }

  return mounted ? (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  ) : null
}

export { Toaster }
