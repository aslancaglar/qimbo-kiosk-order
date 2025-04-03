
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    // Function to check if the window width is below the mobile breakpoint
    const checkIfMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      }
    }
    
    // Debounce function to limit the number of resize event calls
    const debounce = (func: Function, delay: number) => {
      let timeoutId: ReturnType<typeof setTimeout>
      return function(...args: any[]) {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          func.apply(null, args)
        }, delay)
      }
    }
    
    // Debounced version of checkIfMobile
    const debouncedCheckIfMobile = debounce(checkIfMobile, 100)
    
    // Run on mount
    checkIfMobile()
    
    // Set up the event listener for window resize
    if (typeof window !== 'undefined') {
      window.addEventListener("resize", debouncedCheckIfMobile)
    }
    
    // Clean up
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener("resize", debouncedCheckIfMobile)
      }
    }
  }, [])

  return isMobile
}
