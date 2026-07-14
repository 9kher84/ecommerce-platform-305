import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: () => adminService.getAdminStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAdminUsers = (params) => {
  return useQuery({
    queryKey: ['adminUsers', params],
    queryFn: () => adminService.getAllUsers(params),
    keepPreviousData: true,
  });
};

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, isActive }) => adminService.toggleUserStatus(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });
};
