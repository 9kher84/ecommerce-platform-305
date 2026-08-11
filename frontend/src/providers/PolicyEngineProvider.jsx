import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useAuth } from '../providers/AuthProvider';

const PolicyEngineContext = createContext(null);

export const PolicyEngineProvider = ({ children }) => {
  const { user } = useAuth();

  const can = useCallback((capabilityId, context = {}) => {
    // Zero-logic passive execution: Backend is Single Source of Truth
    // If Backend grants the capability object in user.capabilities, allow it.
    if (!user) return false;

    let userCapabilities = user.capabilities;
    if (!userCapabilities) {
      if (user.role === 'buyer') {
        userCapabilities = ['BUYER_PROCUREMENT'];
      } else if (user.role === 'seller') {
        userCapabilities = ['SELLER_PLATFORM'];
      } else if (user.role === 'admin' || user.role === 'super_admin' || user.isAdmin) {
        userCapabilities = ['BUYER_PROCUREMENT', 'SELLER_PLATFORM', 'MANAGE_SYSTEM'];
      } else {
        userCapabilities = [];
      }
    }
    
    const hasCap = userCapabilities.some(c => c.id === capabilityId || c === capabilityId);
    if (!hasCap) return false;

    // Optional dynamic contextual rules
    if (context.limitExceeded) return false;

    return true;
  }, [user]);

  const cannot = useCallback((capabilityId, context = {}) => !can(capabilityId, context), [can]);

  const value = useMemo(() => ({ can, cannot }), [can, cannot]);

  return (
    <PolicyEngineContext.Provider value={value}>
      {children}
    </PolicyEngineContext.Provider>
  );
};

export const usePolicy = () => {
  const context = useContext(PolicyEngineContext);
  if (!context) {
    throw new Error('usePolicy must be used within a PolicyEngineProvider');
  }
  return context;
};
