import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commercialService } from '../../services/commercialService';

// Queries
export const useInbox = () => {
  return useQuery({
    queryKey: ['commercial', 'inbox'],
    queryFn: commercialService.getInbox
  });
};

export const useCommercialMatrix = (workPackageId) => {
  return useQuery({
    queryKey: ['commercial', 'matrix', workPackageId],
    queryFn: () => commercialService.getMatrix(workPackageId),
    enabled: !!workPackageId
  });
};

export const useCommercialTimeline = (processId) => {
  return useQuery({
    queryKey: ['commercial', 'timeline', processId],
    queryFn: () => commercialService.getTimeline(processId),
    enabled: !!processId
  });
};

// Mutations
export const useSubmitInitialProposal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workPackageId, payload }) => commercialService.submitInitialProposal(workPackageId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['commercial', 'matrix', variables.workPackageId] });
    }
  });
};

export const useSubmitRevision = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ processId, payload }) => commercialService.submitRevision(processId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['commercial', 'timeline', variables.processId] });
    }
  });
};

export const useAcceptRevision = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (processId) => commercialService.acceptRevision(processId),
    onSuccess: (_, processId) => {
      queryClient.invalidateQueries({ queryKey: ['commercial', 'timeline', processId] });
      queryClient.invalidateQueries({ queryKey: ['commercial', 'inbox'] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    }
  });
};

export const useRejectRevision = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (processId) => commercialService.rejectRevision(processId),
    onSuccess: (_, processId) => {
      queryClient.invalidateQueries({ queryKey: ['commercial', 'timeline', processId] });
    }
  });
};

export const useCheckoutAwards = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (processIds) => commercialService.checkoutAwards(processIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commercial', 'inbox'] });
    }
  });
};

export const useGeneratePO = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (awardId) => commercialService.generatePO(awardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commercial', 'inbox'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    }
  });
};

export const useSellerPOs = () => {
  return useQuery({
    queryKey: ['purchaseOrders', 'seller'],
    queryFn: commercialService.getSellerPOs
  });
};

export const useAcceptPO = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (poId) => commercialService.acceptPO(poId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    }
  });
};

export const useRejectPO = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ poId, reason }) => commercialService.rejectPO(poId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    }
  });
};

export const useStartPreparation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (poId) => commercialService.startPreparation(poId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    }
  });
};

export const useMarkReadyToShip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (poId) => commercialService.markReadyToShip(poId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    }
  });
};

export const useCreateShipment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => commercialService.createShipment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    }
  });
};

export const useDispatchShipment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shipmentId) => commercialService.dispatchShipment(shipmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    }
  });
};

export const useReceiptSummary = (poId) => {
  return useQuery({
    queryKey: ['receiptSummary', poId],
    queryFn: () => commercialService.getReceiptSummary(poId),
    enabled: !!poId
  });
};

export const useLogReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => commercialService.logReceipt(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['receiptSummary', variables.poId] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    }
  });
};

export const useAcceptReceipt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ receiptId, poId }) => commercialService.acceptReceipt(receiptId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['receiptSummary', variables.poId] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    }
  });
};

export const useInvoiceEligibility = (poId) => {
  return useQuery({
    queryKey: ['invoiceEligibility', poId],
    queryFn: () => commercialService.getInvoiceEligibility(poId),
    enabled: !!poId
  });
};

export const useIssueInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => commercialService.issueInvoice(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoiceEligibility', variables.purchaseOrderId] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  });
};
