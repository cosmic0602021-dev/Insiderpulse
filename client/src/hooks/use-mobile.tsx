import React, { useEffect, useState } from 'react';

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => 
      setIsMobile('matches' in e ? e.matches : (e as MediaQueryList).matches);
    
    setIsMobile(mql.matches);
    
    mql.addEventListener?.('change', onChange as EventListener);
    return () => mql.removeEventListener?.('change', onChange as EventListener);
  }, [breakpoint]);
  
  return isMobile;
}