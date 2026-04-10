import { IIdGenerator } from '../core/ports/IIdGenerator';

/** Production ID generator — wraps crypto.randomUUID(). */
export class UuidGenerator extends IIdGenerator {
  generate(): string {
    return crypto.randomUUID();
  }
}
