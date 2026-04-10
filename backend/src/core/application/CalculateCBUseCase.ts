export class CalculateCBUseCase {
  private static readonly TARGET_GHG_INTENSITY = 89.3368;
  private static readonly ENERGY_FACTOR_MJ_PER_TONNE = 41000;

  execute(fuelConsumption: number, actualGhgIntensity: number): number {
    const energyInScopeMj = fuelConsumption * CalculateCBUseCase.ENERGY_FACTOR_MJ_PER_TONNE;
    return (CalculateCBUseCase.TARGET_GHG_INTENSITY - actualGhgIntensity) * energyInScopeMj;
  }
}
