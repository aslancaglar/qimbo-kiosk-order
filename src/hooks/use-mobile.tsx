
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
    
    // Run on mount
    checkIfMobile()
    
    // Set up the event listener for window resize
    if (typeof window !== 'undefined') {
      window.addEventListener("resize", checkIfMobile)
    }
    
    // Clean up
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener("resize", checkIfMobile)
      }
    }
  }, [])

  return isMobile
}
