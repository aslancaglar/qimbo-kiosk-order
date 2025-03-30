
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    // Initial check on mount
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Check immediately
    checkIfMobile()
    
    // Set up event listener for window resize
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => checkIfMobile()
    
    // Modern approach: addEventListener
    mql.addEventListener("change", onChange)
    
    // Cleanup function
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
