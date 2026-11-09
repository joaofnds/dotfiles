import { chmod, cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import process from "node:process";
import { spawn } from "bun";
import type { SessionInput } from "../provider-types.ts";
import type { SessionResult } from "../session.ts";

export const syntheticCodexCompletion = {
  schemaVersion: 1,
  outcome: "completed",
  requiredToolBlockers: [],
  cardState: "Build",
  claims: [{ claim: "synthetic final reply", evidencePath: "synthetic.log" }],
  errors: [],
  scopeChanges: [],
  unresolvedDecisions: [],
  recordPath: "synthetic-record.md",
};
export const syntheticCodexReply = JSON.stringify(syntheticCodexCompletion);

// Synthetic codex exec --experimental-json peer. It never starts a native provider.
export const fakeCodex = `#!${process.execPath}
import { appendFileSync, writeFileSync } from 'node:fs';
import { spawn, spawnSync } from 'bun';
const root = process.env.FAKE_CODEX_DIRECTORY;
const scenario = process.env.FAKE_CODEX_SCENARIO;
const argv = process.argv.slice(2);
if (argv.includes('--version')) { console.log('codex-cli 0.166.0'); process.exit(0); }
const prompt = await new Response(Bun.stdin.stream()).text();
const schemaPath = argv[argv.indexOf('--output-schema') + 1];
appendFileSync(root + '/launches', JSON.stringify({pid:process.pid,argv,cwd:process.cwd(),prompt,outputSchema:argv.includes('--output-schema') ? JSON.parse(await Bun.file(schemaPath).text()) : null})+'\\n');
process.stderr.write('synthetic exec diagnostic\\n');
if (scenario === 'unavailable') process.exit(1);
if (scenario === 'silent') setInterval(()=>{}, 1000);
if (scenario === 'silent') await new Promise(()=>{});
if (scenario === 'missing-history') { console.error('history missing'); process.exit(1); }
const send = (x) => console.log(JSON.stringify(x));
const resumed = argv.indexOf('resume');
send({type:'thread.started',thread_id: resumed === -1 ? 'thread-owned-'+process.pid : argv[resumed + 1]});
send({type:'turn.started'});
const completion = ${JSON.stringify(syntheticCodexCompletion)};
if (scenario === 'blocked' || scenario === 'failed') completion.outcome = scenario;
if (scenario === 'blocked' || scenario === 'required-blocker') completion.requiredToolBlockers = [{tool:'apply_patch',reason:'denied',evidencePath:'synthetic-tool.log'}];
const finalReply = JSON.stringify(completion);
if (scenario === 'hold') { writeFileSync(root+'/codex-ready',String(process.pid)); await new Promise(()=>{}); }
if (scenario === 'descendant' || scenario === 'cancel') {
  const child=spawn([process.execPath,'-e','setInterval(()=>{},1000)'],{stdin:'ignore',stdout:'inherit',stderr:'inherit'});
  writeFileSync(root+'/descendant',String(child.pid));
  await new Promise(()=>{});
}
if (scenario === 'truncated') { process.stdout.write('{"type":"turn.compl'); process.exit(0); }
if (scenario === 'no-terminal') process.exit(0);
if (scenario === 'malformed-event') { send({type:'turn.failed'}); process.exit(0); }
if (scenario === 'no-usage') { send({type:'turn.completed'}); process.exit(0); }
if (scenario === 'edit-check-transition') {
  const check = () => spawnSync(['/bin/test','-f','requested.txt'],{stdout:'pipe',stderr:'pipe'});
  const red=check();
  send({type:'item.completed',item:{type:'command_execution',id:'red',command:'test -f requested.txt',aggregated_output:'',status:'failed',exit_code:red.exitCode}});
  writeFileSync(process.cwd()+'/requested.txt','verified\\n');
  send({type:'item.completed',item:{type:'file_change',id:'write',changes:[{path:'requested.txt',kind:'add'}],status:'completed'}});
  const green=check();
  send({type:'item.completed',item:{type:'command_execution',id:'green',command:'test -f requested.txt',aggregated_output:'',status:'completed',exit_code:green.exitCode}});
  const board=spawnSync(['backlog','task','edit','TASK-1','--status','Review'],{stdout:'pipe',stderr:'pipe'});
  writeFileSync(root+'/editing-check.json',JSON.stringify({cwd:process.cwd(),red:red.exitCode,green:green.exitCode,transition:board.exitCode,transitionStdout:board.stdout.toString(),transitionStderr:board.stderr.toString()}));
  if(red.exitCode!==1 || green.exitCode!==0 || board.exitCode!==0) process.exit(1);
}
if (scenario !== 'no-final') send({type:'item.completed',item:{type:'agent_message',id:'reply',text:finalReply}});
send({type:'turn.completed',usage:{input_tokens:11,cached_input_tokens:3,cache_write_input_tokens:0,output_tokens:2,reasoning_output_tokens:1}});
if (scenario === 'nonzero') process.exit(7);
if (scenario === 'terminal-hang') await new Promise(()=>{});
`;

export class CodexHarness {
  private readonly roots: string[] = [];

  static setup(): CodexHarness {
    return new CodexHarness();
  }

  async run(
    scenario = "complete",
    options: Partial<SessionInput> & { readonly cancelMs?: number } = {},
  ) {
    const root = await mkdtemp(join(tmpdir(), "iterate-codex-"));
    this.roots.push(root);
    await mkdir(join(root, "cli"));
    await writeFile(join(root, "cli", "codex"), fakeCodex);
    await chmod(join(root, "cli", "codex"), 0o700);
    await writeFile(
      join(root, "runner.ts"),
      `
import { writeFile } from 'node:fs/promises';
import { prepareSession, SessionFailure } from ${JSON.stringify(join(import.meta.dir, "..", "session.ts"))};
const input = JSON.parse(await Bun.file(process.env.FAKE_CODEX_DIRECTORY!+'/input.json').text());
const running = prepareSession(input).start();
const timer = input.cancelMs === undefined ? undefined : setTimeout(()=>running.cancel('synthetic caller cancellation'), input.cancelMs);
try { await writeFile(process.env.FAKE_CODEX_DIRECTORY!+'/report.json',JSON.stringify(await running.result)); }
catch(error) { if (!(error instanceof SessionFailure)) throw error; await writeFile(process.env.FAKE_CODEX_DIRECTORY!+'/report.json',JSON.stringify(error.result)); process.exitCode=1; }
finally { clearTimeout(timer); }
`,
    );
    await writeFile(
      join(root, "input.json"),
      JSON.stringify({
        agent: { provider: "codex", model: "gpt-6.1-sol", effort: "high" },
        stage: "build",
        card: "DOT-1",
        systemPrompt: "guard text",
        logDirectory: root,
        timeoutMs: 2000,
        ...options,
      }),
    );
    const child = spawn([process.execPath, join(root, "runner.ts")], {
      detached: true,
      env: {
        ...process.env,
        PATH: "/usr/bin:/bin",
        ITERATE_CODEX_CLI: join(root, "cli", "codex"),
        ITERATE_LIVE: "0",
        FAKE_CODEX_DIRECTORY: root,
        FAKE_CODEX_SCENARIO: scenario,
      },
      stdin: "ignore",
      stdout: "pipe",
      stderr: "pipe",
    });
    const deadline = setTimeout(() => process.kill(child.pid, "SIGTERM"), 5000);
    try {
      const [code, stdout, stderr] = await Promise.all([
        child.exited,
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
      ]);
      const result: SessionResult = JSON.parse(await readFile(join(root, "report.json"), "utf8"));
      await writeFile(
        join(root, "host.json"),
        JSON.stringify({ code, stdout, stderr, pid: child.pid, scenario }),
      );
      return {
        root,
        code,
        stdout,
        stderr,
        result,
        launches: async (): Promise<unknown[]> =>
          (await readFile(join(root, "launches"), "utf8"))
            .trim()
            .split("\n")
            .map((line) => JSON.parse(line)),
      };
    } finally {
      clearTimeout(deadline);
      if (child.exitCode === null) {
        process.kill(child.pid, "SIGTERM");
        await child.exited;
      }
    }
  }

  async teardown(): Promise<void> {
    for (const root of this.roots) {
      if (process.env.ITERATE_TEST_EVIDENCE) {
        await cp(root, join(process.env.ITERATE_TEST_EVIDENCE, basename(root)), {
          recursive: true,
        });
      }
      await rm(root, { recursive: true, force: true });
    }
  }
}
