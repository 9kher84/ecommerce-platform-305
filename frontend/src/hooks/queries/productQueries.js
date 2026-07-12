import { useQuery } from '@tanstack/react-query';
import { entityService } from '../../services/entityService';
import { useAuth } from '../../providers/AuthProvider';

export const useProducts = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['products', 'list'],
    queryFn: () => entityService.getProducts(),
    enabled: user?.role === 'seller' || user?.role === 'admin' || user?.role === 'super_admin',
    staleTime: 2 * 60 * 1000,
  });
};
