import { PrismaClient } from '@prisma/client';
import { IRouteRepository } from '../../../core/ports/IRouteRepository';
import type { Route } from '../../../core/domain/Route';

export class RouteRepository extends IRouteRepository {
  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  async findAll(): Promise<Route[]> {
    const records = await this.prisma.routes.findMany({
      orderBy: [
        { route_id: 'asc' },
        { year: 'desc' }
      ]
    });
    return records.map(r => this.mapToDomain(r));
  }

  async findById(id: string): Promise<Route | null> {
    const r = await this.prisma.routes.findUnique({ where: { id } });
    return r ? this.mapToDomain(r) : null;
  }

  async setBaseline(id: string): Promise<void> {
    const route = await this.findById(id);
    if (!route) {
      throw new Error(`Route with id ${id} not found.`);
    }

    // Atomic transaction: unset all baselines, then set the chosen one
    await this.prisma.$transaction(async (tx) => {
      await tx.routes.updateMany({
        where: { is_baseline: true },
        data: { is_baseline: false },
      });
      
      await tx.routes.update({
        where: { id },
        data: { is_baseline: true },
      });
    });
  }

  async getBaseline(): Promise<Route | null> {
    const b = await this.prisma.routes.findFirst({
      where: { is_baseline: true },
    });
    return b ? this.mapToDomain(b) : null;
  }

  private mapToDomain(row: any): Route {
    return {
      id: row.id,
      routeId: row.route_id,
      vesselType: row.vessel_type,
      fuelType: row.fuel_type,
      year: row.year,
      ghgIntensity: row.ghg_intensity,
      fuelConsumption: row.fuel_consumption,
      distance: row.distance,
      totalEmissions: row.total_emissions,
      isBaseline: row.is_baseline,
    };
  }
}
