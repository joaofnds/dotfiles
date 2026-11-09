export class Exit extends Error {
  readonly code: number;

  constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }
}

export function say(message: string): void {
  console.error(message);
}

export function diagnostic(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
