import { useQuery } from '@tanstack/react-query';
import { RoutesGateway } from '../../adapters/infrastructure/RoutesGateway';

const gateway = new RoutesGateway();

export function useCompareData() {
  const query = useQuery({
    queryKey: ['comparison'],
    queryFn: () => gateway.getComparison(),
  });

  return {
    comparisonData: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
