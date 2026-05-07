import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { adminApi } from '../services/api';

export function useActivityTracker() {
  const location = useLocation();
  const { user } = useAuth();

  const logActivity = async (action: string, details?: string) => {
    if (!user?.email) return;
    try {
      await adminApi.logCustomerActivity({
        email: user.email,
        action,
        details,
        timestamp: new Date().toISOString()
      } as any);
    } catch (error) {
      // Silent fail for logging
      console.error('Activity logging failed:', error);
    }
  };

  useEffect(() => {
    if (user?.email) {
      logActivity('page_view', location.pathname);
    }
  }, [location.pathname, user?.email]);

  return { logActivity };
}
