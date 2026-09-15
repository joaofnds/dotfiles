import hostProcess from "node:process";

export async function runProcess(argv: string[], timeoutMs: number, cwd?: string) {
  const child = Bun.spawn(argv, {
    detached: true,
    ...(cwd ? { cwd } : {}),
    stdout: "pipe",
    stderr: "pipe",
  });
  let timedOut = false;
  let interrupted = false;
  let escalation: ReturnType<typeof setTimeout> | undefined;
  const signal = (name: NodeJS.Signals) => {
    try {
      hostProcess.kill(-child.pid, name);
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ESRCH")) throw error;
    }
  };
  const stop = () => {
    if (escalation) return;
    signal("SIGTERM");
    escalation = setTimeout(() => signal("SIGKILL"), 1000);
  };
  const timer = setTimeout(() => {
    timedOut = true;
    stop();
  }, timeoutMs);
  const interrupt = () => {
    interrupted = true;
    stop();
  };
  hostProcess.on("SIGINT", interrupt);
  hostProcess.on("SIGTERM", interrupt);
  try {
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    return { stdout, stderr, exitCode, timedOut, interrupted };
  } finally {
    clearTimeout(timer);
    clearTimeout(escalation);
    hostProcess.off("SIGINT", interrupt);
    hostProcess.off("SIGTERM", interrupt);
    signal("SIGKILL");
  }
}
