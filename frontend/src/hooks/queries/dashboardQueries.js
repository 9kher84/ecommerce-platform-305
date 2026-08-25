import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../services/dashboardService';
import { invoiceService } from '../../services/invoiceService';
import { useAuth } from '../../providers/AuthProvider';

export const useBuyerStats = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['dashboard', 'buyerStats'],
    queryFn: () => dashboardService.getBuyerStats(),
    enabled: user?.role === 'buyer' || user?.role === 'admin' || user?.role === 'super_admin',
    staleTime: 5 * 60 * 1000,
  });
};

export const useSellerStats = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['dashboard', 'sellerStats'],
    queryFn: () => dashboardService.getSellerStats(),
    enabled: user?.role === 'seller' || user?.role === 'admin' || user?.role === 'super_admin',
    staleTime: 5 * 60 * 1000,
  });
};

export const useMatchRadar = () => {
  return useQuery({
    queryKey: ['dashboard', 'matchRadar'],
    queryFn: () => dashboardService.getMatchRadar(),
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useMyInvoices = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['invoices', 'my'],
    queryFn: () => invoiceService.getMyInvoices(),
    enabled: !!user,
    staleTime: 30 * 1000,
  });
};
