import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quoteService } from '../../services/quoteService';

export const useMyQuotes = (status) => {
  return useQuery({
    queryKey: ['quotes', 'my', status],
    queryFn: () => quoteService.getMyQuotes(status),
    staleTime: 2 * 60 * 1000,
  });
};

export const useQuotesForRequest = (requestId) => {
  return useQuery({
    queryKey: ['quotes', 'request', requestId],
    queryFn: () => quoteService.getQuotesForRequest(requestId),
    enabled: !!requestId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useSubmitQuote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => quoteService.submitQuote(data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quotes', 'my'] });
      queryClient.invalidateQueries({ queryKey: ['quotes', 'request', variables.requestId] });
    },
  });
};

export const useNegotiateQuote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => quoteService.negotiateQuote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
};

export const useQuoteAction = (action) => {
  const queryClient = useQueryClient();
  
  const actionMap = {
    accept: quoteService.acceptQuote,
    reject: quoteService.rejectQuote,
    withdraw: quoteService.withdrawQuote,
    respond: (params) => quoteService.respondToNegotiation(params.id, params.data)
  };
  
  return useMutation({
    mutationFn: (params) => {
      const id = typeof params === 'object' ? params.id : params;
      return actionMap[action](action === 'respond' ? params : id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
};
