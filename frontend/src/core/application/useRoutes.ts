import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RoutesGateway } from '../../adapters/infrastructure/RoutesGateway';

const gateway = new RoutesGateway();

export function useRoutesData() {
  const query = useQuery({
    queryKey: ['routes'],
    queryFn: () => gateway.getRoutes(),
  });

  const queryClient = useQueryClient();

  const setBaselineMutation = useMutation({
    mutationFn: (id: string) => gateway.setBaseline(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
  });

  return {
    routes: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    setBaseline: setBaselineMutation.mutate,
    isSettingBaseline: setBaselineMutation.isPending,
  };
}
