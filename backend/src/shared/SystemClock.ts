import { IClock } from '../core/ports/IClock';

/** Production clock — delegates to the system clock. */
export class SystemClock extends IClock {
  now(): Date {
    return new Date();
  }
}
