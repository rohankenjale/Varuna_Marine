import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PoolGateway } from '../../adapters/infrastructure/PoolGateway';
import { ComplianceGateway } from '../../adapters/infrastructure/ComplianceGateway';
import { RoutesGateway } from '../../adapters/infrastructure/RoutesGateway';
import type { CreatePoolMemberInput } from '../domain/Pool';

const poolGateway = new PoolGateway();
const complianceGateway = new ComplianceGateway();
const routesGateway = new RoutesGateway();

export function usePoolingData() {
  const queryClient = useQueryClient();

  const shipsQuery = useQuery({
    queryKey: ['fleet-adjusted-cb'],
    queryFn: async () => {
      // 1. Fetch all routes to get active vessels
      const allRoutes = await routesGateway.getRoutes();
      const vesselIds = [...new Set(allRoutes.map(r => r.routeId))];
      
      // 2. Fetch the adjusted CB for each active vessel
      const promises = vesselIds.map(async (vesselId) => {
        return complianceGateway.getAdjustedCB(vesselId).then(res => ({
          shipId: vesselId,
          adjustedCB: res.adjustedCB,
        }));
      });
      
      return Promise.all(promises);
    },
  });

  const createPoolMutation = useMutation({
    mutationFn: (members: CreatePoolMemberInput[]) => poolGateway.createPool(2025, members),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-adjusted-cb'] });
      queryClient.invalidateQueries({ queryKey: ['banking'] });
      queryClient.invalidateQueries({ queryKey: ['compliance'] });
    },
  });

  return {
    ships: shipsQuery.data ?? [],
    isLoadingShips: shipsQuery.isLoading,
    isErrorShips: shipsQuery.isError,
    createPool: createPoolMutation.mutateAsync,
    isCreatingPool: createPoolMutation.isPending,
    poolResult: createPoolMutation.data,
    poolError: createPoolMutation.error,
  };
}
