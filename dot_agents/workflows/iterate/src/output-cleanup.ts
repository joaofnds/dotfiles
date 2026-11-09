type OutputReader = {
  readonly cancel: () => Promise<void>;
};

export type OutputCleanup = {
  readonly state: "settled" | "uncertain";
  readonly errors: readonly string[];
};

export type OutputCleanupSchedule = (callback: () => void, milliseconds: number) => () => void;

const scheduleCleanup: OutputCleanupSchedule = (callback, milliseconds) => {
  const deadline = setTimeout(callback, milliseconds);
  return () => clearTimeout(deadline);
};

export async function cancelOutputs({
  stdout,
  stderr,
  allowanceMs = 200,
  schedule = scheduleCleanup,
}: {
  readonly stdout: OutputReader;
  readonly stderr: OutputReader;
  readonly allowanceMs?: number;
  readonly schedule?: OutputCleanupSchedule;
}): Promise<OutputCleanup> {
  const entries = [
    { name: "stdout", reader: stdout },
    { name: "stderr", reader: stderr },
  ];
  const outcomes = new Map<string, { readonly error?: string }>();
  const cancellations = entries.map(async ({ name, reader }) => {
    try {
      await reader.cancel();
      outcomes.set(name, {});
    } catch (error) {
      outcomes.set(name, {
        error: `${name} cleanup failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  });
  let cancelDeadline: (() => void) | undefined;

  try {
    await Promise.race([
      Promise.all(cancellations),
      new Promise<void>((resolve) => {
        cancelDeadline = schedule(resolve, allowanceMs);
      }),
    ]);
  } finally {
    cancelDeadline?.();
  }

  const errors = entries.flatMap(({ name }) => {
    const outcome = outcomes.get(name);
    if (!outcome) return [`${name} cleanup did not complete within ${allowanceMs}ms`];

    return outcome.error ? [outcome.error] : [];
  });

  return { state: errors.length === 0 ? "settled" : "uncertain", errors };
}
