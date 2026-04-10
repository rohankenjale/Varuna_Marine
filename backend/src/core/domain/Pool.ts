/**
 * Pool — a FuelEU compliance pool for a single reporting year.
 *
 * Pure domain entity. No imports. No behavior.
 * A Pool is a container; the actual transfers between ships are recorded
 * in PoolMember rows that reference the Pool by id.
 */
export interface Pool {
  id: string;
  year: number;
  createdAt: Date;
}
