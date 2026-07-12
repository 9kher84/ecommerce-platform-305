import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealService } from '../../services/dealService';

export const useDeals = (status) => {
  return useQuery({
    queryKey: ['deals', 'list', status],
    queryFn: () => dealService.getDeals(status),
    staleTime: 2 * 60 * 1000,
  });
};

export const useDealDetails = (id) => {
  return useQuery({
    queryKey: ['deals', 'detail', id],
    queryFn: () => dealService.getDealById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateDealStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => dealService.updateDealStatus(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deals', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['deals', 'detail', variables.id] });
    },
  });
};
