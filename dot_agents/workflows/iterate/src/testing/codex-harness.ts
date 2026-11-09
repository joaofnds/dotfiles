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

// Synthetic public-schema peer. It never starts a native provider.
export const fakeCodex = `#!${process.execPath}
import { appendFileSync, closeSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { spawn, spawnSync } from 'bun';
const root = process.env.FAKE_CODEX_DIRECTORY;
const scenario = process.env.FAKE_CODEX_SCENARIO;
if (process.argv.includes('--version')) { console.log('codex-cli 0.166.0'); process.exit(0); }
appendFileSync(root + '/launches', JSON.stringify({pid:process.pid,argv:process.argv.slice(2),cwd:process.cwd()})+'\\n');
process.stderr.write('synthetic app-server diagnostic\\n');
if (scenario === 'unavailable') process.exit(1);
const send = (x) => console.log(JSON.stringify(x));
let threadId = 'thread-owned-'+process.pid; const turnId = 'turn-owned';
const input = createInterface({input:process.stdin});
const completion = ${JSON.stringify(syntheticCodexCompletion)};
if (scenario === 'blocked' || scenario === 'failed') completion.outcome = scenario;
if (scenario === 'blocked' || scenario === 'required-blocker') completion.requiredToolBlockers = [{tool:'apply_patch',reason:'denied',evidencePath:'synthetic-tool.log'}];
const finalReply = scenario === 'legacy-completion' ? 'synthetic final reply' : scenario === 'malformed-completion' ? '{' : JSON.stringify(completion);
const turnError = scenario === 'optional-error' ? {} : {error:null};
if (scenario === 'silent') setInterval(()=>{}, 1000);
input.on('line', async line => {
  appendFileSync(root + '/requests', line+'\\n');
  const request = JSON.parse(line);
  if (scenario === 'silent') return;
  if (request.method === 'initialize') {
    if (scenario === 'stdin-closed') {
      input.on('error',()=>{});
      process.stdin.on('error',()=>{});
      const interfaceClosed = new Promise(resolve=>input.once('close',resolve));
      input.close();
      await interfaceClosed;
      const streamClosed = new Promise(resolve=>process.stdin.once('close',resolve));
      process.stdin.destroy();
      await streamClosed;
      try { closeSync(0); } catch (error) { if (error.code !== 'EBADF') throw error; }
      appendFileSync(root+'/stdin-closed','closed\\n');
      setInterval(()=>{},1000);
    }
    send({id:request.id,result:{userAgent:'codex-cli 0.166.0'}});
  }
  if (request.method === 'thread/start' || request.method === 'thread/resume') {
    threadId = request.params.threadId || threadId;
    if (scenario === 'missing-history') { send({id:request.id,error:{code:-32000,message:'history missing'}}); return; }
    send({id:request.id,result:{thread:{id:request.params.threadId || threadId},model:scenario === 'mismatch' ? 'gpt-6-luna' : request.params.model || 'gpt-6.1-sol',reasoningEffort:request.params.config?.model_reasoning_effort || 'high',cwd:process.cwd(),approvalPolicy:'never',sandbox:scenario === 'edit-check-transition' ? {type:'workspaceWrite',writableRoots:[process.cwd()],networkAccess:false} : scenario === 'policy-mismatch' ? {type:'readOnly',networkAccess:true} : {type:'readOnly',networkAccess:false}}});
    if (scenario === 'backpressure') { input.pause(); process.stdin.pause(); setInterval(()=>{},1000); }
  }
  if (request.method === 'turn/start') {
    send({id:request.id,result:{turn:{id:turnId,status:'inProgress',...turnError,items:[]}}});
    if (scenario === 'reroute') send({method:'model/rerouted',params:{threadId,turnId,fromModel:'gpt-6.1-sol',toModel:'gpt-6-luna',reason:'syntheticModelChange'}});
    if (scenario === 'hold') { writeFileSync(root+'/codex-ready',String(process.pid)); setInterval(()=>{},1000); return; }
    if (scenario === 'descendant' || scenario === 'cancel') {
      const child=spawn([process.execPath,'-e','setInterval(()=>{},1000)'],{stdin:'ignore',stdout:'inherit',stderr:'inherit'});
      writeFileSync(root+'/descendant',String(child.pid));
      setInterval(()=>{},1000); return;
    }
    if (scenario === 'truncated') { process.stdout.write('{"method":"turn/compl'); input.close(); process.stdin.destroy(); return; }
    if (scenario === 'no-terminal') { input.close(); process.stdin.destroy(); return; }
    if (scenario === 'unfinished-tool') send({method:'item/started',params:{threadId,turnId,item:{type:'commandExecution',id:'unfinished',command:'check',cwd:process.cwd(),commandActions:[],status:'inProgress'}}});
    if (scenario === 'edit-check-transition') {
      const check = () => spawnSync(['/bin/test','-f','requested.txt'],{stdout:'pipe',stderr:'pipe'});
      const red=check();
      send({method:'item/completed',params:{threadId,turnId,item:{type:'commandExecution',id:'red',command:'test -f requested.txt',cwd:process.cwd(),commandActions:[],status:'failed',exitCode:red.exitCode}}});
      writeFileSync(process.cwd()+'/requested.txt','verified\\n');
      send({method:'item/completed',params:{threadId,turnId,item:{type:'fileChange',id:'write',changes:[{path:'requested.txt',diff:'+verified',kind:{type:'add'}}],status:'completed'}}});
      const green=check();
      send({method:'item/completed',params:{threadId,turnId,item:{type:'commandExecution',id:'green',command:'test -f requested.txt',cwd:process.cwd(),commandActions:[],status:'completed',exitCode:green.exitCode}}});
      const board=spawnSync(['backlog','task','edit','TASK-1','--status','Review'],{stdout:'pipe',stderr:'pipe'});
      writeFileSync(root+'/editing-check.json',JSON.stringify({cwd:process.cwd(),red:red.exitCode,green:green.exitCode,transition:board.exitCode,transitionStdout:board.stdout.toString(),transitionStderr:board.stderr.toString()}));
      if(red.exitCode!==1 || green.exitCode!==0 || board.exitCode!==0) process.exit(1);
    }
    if (scenario === 'native-error') send({method:'error',params:{threadId,turnId,error:{message:'synthetic native error'},willRetry:false}});
    if (scenario === 'native-tool-failure') send({method:'item/completed',params:{threadId,turnId,item:{type:'mcpToolCall',id:'failed-native-tool',server:'synthetic',tool:'required_read',arguments:{},status:'failed',error:{message:'synthetic native tool error'}}}});
    if (scenario === 'expected-probe') send({method:'item/completed',params:{threadId,turnId,item:{type:'commandExecution',id:'probe',command:'test -f absent',cwd:process.cwd(),commandActions:[],status:'failed',exitCode:1}}});
    const items=scenario === 'no-final' ? [] : [{type:'agentMessage',id:'reply',text:finalReply,phase:'final_answer'}];
    send({method:'thread/tokenUsage/updated',params:{threadId,turnId,tokenUsage:{total:{inputTokens:11,cachedInputTokens:3,outputTokens:2,reasoningOutputTokens:1,totalTokens:13},last:{inputTokens:5,cachedInputTokens:1,outputTokens:1,reasoningOutputTokens:1,totalTokens:6}}}});
    send({method:'turn/completed',params:{threadId,turn:{id:turnId,status:'completed',...turnError,items}}});
    if (scenario === 'nonzero') process.exitCode=7;
    if (scenario === 'terminal-hang') setInterval(()=>{},1000);
  }
});
input.on('close',()=>{ appendFileSync(root+'/eof','closed\\n'); });
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
    await mkdir(join(root, "bin"));
    await writeFile(join(root, "bin", "codex"), fakeCodex);
    await chmod(join(root, "bin", "codex"), 0o700);
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
        PATH: `${join(root, "bin")}:/usr/bin:/bin`,
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
        requests: async (): Promise<unknown[]> =>
          (await readFile(join(root, "requests"), "utf8"))
            .trim()
            .split("\n")
            .map((line) => JSON.parse(line)),
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
