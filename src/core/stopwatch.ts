/** Pausable stopwatch; paused time (e.g. glossary lookups) is excluded from elapsed time. */
export class Stopwatch {
  private startedAt: number | null = null;
  private accumulated = 0;

  constructor(private readonly now: () => number = () => performance.now()) {}

  get running(): boolean {
    return this.startedAt !== null;
  }

  start(): void {
    if (this.startedAt === null) this.startedAt = this.now();
  }

  pause(): void {
    if (this.startedAt === null) return;
    this.accumulated += this.now() - this.startedAt;
    this.startedAt = null;
  }

  reset(): void {
    this.startedAt = null;
    this.accumulated = 0;
  }

  get elapsedMs(): number {
    return this.accumulated + (this.startedAt === null ? 0 : this.now() - this.startedAt);
  }
}
