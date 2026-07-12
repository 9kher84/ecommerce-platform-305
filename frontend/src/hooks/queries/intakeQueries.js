import { useMutation, useQueryClient } from '@tanstack/react-query';
import { intakeService } from '../../services/intakeService';

export const useAnalyzeIntake = () => {
  return useMutation({
    mutationKey: ['intake', 'analyze'],
    mutationFn: (data) => intakeService.analyzeIntake(data),
  });
};

export const useCreateOpportunity = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: ['intake', 'create'],
    mutationFn: (data) => intakeService.createOpportunity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
};
