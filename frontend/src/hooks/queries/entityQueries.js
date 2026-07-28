import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entityService } from '../../services/entityService';

export const useRequests = (params) => {
  return useQuery({
    queryKey: ['requests', 'list', params],
    queryFn: () => entityService.getRequests(params),
    staleTime: 2 * 60 * 1000,
  });
};

export const useMyRequests = (params) => {
  return useQuery({
    queryKey: ['requests', 'my-requests', params],
    queryFn: () => entityService.getMyRequests(params),
    staleTime: 2 * 60 * 1000,
  });
};

export const useRequestDetails = (id) => {
  return useQuery({
    queryKey: ['requests', 'detail', id],
    queryFn: () => entityService.getRequestDetails(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => entityService.getCategories(),
    staleTime: 10 * 60 * 1000,
  });
};

export const useCreateRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => entityService.createRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['requests', 'my-requests'] });
    },
  });
};

export const useUpdateRequestStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }) => entityService.updateRequestStatus(id, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['requests', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['requests', 'my-requests'] });
      queryClient.invalidateQueries({ queryKey: ['requests', 'detail', variables.id] });
    },
  });
};

export const useUpdateRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => entityService.updateRequest(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['requests', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['requests', 'my-requests'] });
      queryClient.invalidateQueries({ queryKey: ['requests', 'detail', variables.id] });
    },
  });
};

export const usePublishRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => entityService.publishRequest(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['requests', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['requests', 'my-requests'] });
      queryClient.invalidateQueries({ queryKey: ['requests', 'detail', id] });
    },
  });
};
