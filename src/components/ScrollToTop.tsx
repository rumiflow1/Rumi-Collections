import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 * Ensures that the window scrolls to the top on every route change.
 * This provides a smooth, professional feel expected in luxury e-commerce.
 */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();
  const searchParams = search;

  useEffect(() => {
    // Immediate scroll to top
    window.scrollTo(0, 0);
    
    // Safety timeout for dynamic layouts that might shift after render
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return null;
}
