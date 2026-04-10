import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BankingGateway } from '../../adapters/infrastructure/BankingGateway';
import { ComplianceGateway } from '../../adapters/infrastructure/ComplianceGateway';

const bankingGateway = new BankingGateway();
const complianceGateway = new ComplianceGateway();

export function useBankingData(shipId: string, year: number) {
  const queryClient = useQueryClient();

  const recordsQuery = useQuery({
    queryKey: ['banking', shipId],
    queryFn: () => bankingGateway.getRecords(shipId),
    enabled: !!shipId,
  });

  const complianceQuery = useQuery({
    queryKey: ['compliance', shipId, year],
    queryFn: () => complianceGateway.getAdjustedCB(shipId, year),
    enabled: !!shipId && !!year,
  });

  const bankMutation = useMutation({
    mutationFn: (amount: number) => bankingGateway.bankSurplus(shipId, year, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banking', shipId] });
      queryClient.invalidateQueries({ queryKey: ['compliance', shipId] });
    },
  });

  const applyMutation = useMutation({
    mutationFn: (amount: number) => bankingGateway.applyBanked(shipId, year, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banking', shipId] });
      queryClient.invalidateQueries({ queryKey: ['compliance', shipId] });
    },
  });

  return {
    records: recordsQuery.data?.entries ?? [],
    bankedBalance: recordsQuery.data?.balance ?? 0,
    complianceData: complianceQuery.data,
    isLoading: recordsQuery.isLoading || complianceQuery.isLoading,
    bankSurplus: bankMutation.mutateAsync,
    isBanking: bankMutation.isPending,
    applyBanked: applyMutation.mutateAsync,
    isApplying: applyMutation.isPending,
  };
}
