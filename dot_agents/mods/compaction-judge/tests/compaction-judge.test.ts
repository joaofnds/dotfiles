import type { ModelCompleteInput, ModelCompleteResult, On, PromptOrigin, SessionCompactResult, SessionMessage, TurnStepChunk, TurnStepResult } from 'claude-code'
import type { Engine, MockClock } from 'claude-code/testing'
import { describe, expect, mock, test } from 'claude-code/testing'

const SESSION_ID = 'session-1'
const VERSION = { version: '2.1.296', base: '2.1.296', builtAt: '2026-10-10T12:00:00Z' }
const NOW = Date.parse('2026-10-14T12:00:00Z')
const AT = new Date(NOW).toISOString()
const PAST_200K = 210_000
const UNDER_200K = 190_000
const AT_200K = 200_000
const FAR_PAST_200K = 950_000
const AFTER_COMPACTION = 30_000
const MODEL_WINDOW = 1_000_000
const MODEL = 'claude-opus-5-5'
const TURN = 'turn-1'
const NEXT_TURN = 'turn-2'
const SUBAGENT = 'agent-1'
const JUDGE_LATENCY_MS = 1_300
const LOG_FILE = '.local/state/compaction-judge/log.jsonl'
const AUTO_COMPACT_WINDOW = 'CLAUDE_CODE_AUTO_COMPACT_WINDOW'
const SMALLEST_WINDOW = '100000'
const SLOW_TOOL = 'toolu_slow'
const WINDOW_REFUSED = 'Blocked by another plugin'
const USAGE = { input_tokens: 900, output_tokens: 1, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }
const REFUSED = 'Not compacted · the conversation is too short'
const SKIPPED = 'Blocked by a PreCompact hook'
const SUMMARY = 'This session is being continued from a previous conversation. Summary: the agent was partway through a task.'
const NO_COMPACTION = 'no implementation for command.run'
const BLOCKED = 'Blocked by a prompt hook'

const answered = (text: string): ModelCompleteResult => ({ isAnswered: true, text, usage: USAGE })
const UNANSWERED: ModelCompleteResult = { isAnswered: false, reason: 'empty-reply', usage: USAGE }

const RESPONSE = { answer: 'Reading the next file.', toolUses: [], stopReason: 'tool_use', usage: { ...USAGE, model: MODEL } } as const
const RESPONSE_CHUNK: TurnStepChunk = { kind: 'text', index: 0, text: RESPONSE.answer }
const sentIn = (turnId: string) => ({ chunks: [RESPONSE_CHUNK], result: { turnId, index: 0, ...RESPONSE } })
const SENT = sentIn(TURN)

const request = (text: string): SessionMessage => ({ role: 'user', text, toolUses: [] })

const readCall = (step: string): SessionMessage => ({
  role: 'assistant',
  text: '',
  toolUses: [{ tool_use_id: `toolu_${step}`, tool: 'Read', input: { file_path: `/repo/file-${step}.ts` } }],
})
const readResult = (step: string): SessionMessage => ({
  role: 'user',
  text: '',
  toolUses: [],
  toolResults: [{ tool_use_id: `toolu_${step}`, text: `contents of file-${step}`, isError: false }],
})
const withResult = (step: string, text: string, isError: boolean): SessionMessage => ({
  ...readResult(step),
  toolResults: [{ tool_use_id: `toolu_${step}`, text, isError }],
})

function toolSteps(count: number): SessionMessage[] {
  return Array.from({ length: count }, (_, i) => String(i + 1).padStart(2, '0')).flatMap(step => [readCall(step), readResult(step)])
}

const CONVERSATION: readonly SessionMessage[] = [request('Fix the login redirect'), ...toolSteps(3)]

class JudgeSpy {
  readonly asked: ModelCompleteInput[] = []

  constructor(
    private readonly answer: ModelCompleteResult,
    private readonly answersAfterMs = 0,
  ) {}

  install(on: On, clock: MockClock): void {
    on('model.complete', async (_, e) => {
      this.asked.push(e)
      if (this.answersAfterMs > 0) await clock.sleep(this.answersAfterMs)

      return { value: this.answer }
    })
  }
}

type SessionEvent = { compaction: 'ran' | 'refused' } | { prompt: string }

class FakeSession {
  readonly events: SessionEvent[] = []
  readonly notices: string[] = []
  readonly windowsToolsRanUnder: (string | undefined)[] = []
  private readonly environment = new Map<string, string | undefined>()
  private readonly heldToolCalls = new Map<string, Promise<void>>()
  private messages: SessionMessage[] = [...CONVERSATION]
  private compaction: 'runs' | 'is refused' | 'fails' = 'runs'
  private isRefusingPrompts = false
  private isRefusingWindowChange = false

  constructor(private tokens: number | undefined) {}

  get autoCompactWindow(): string | undefined {
    return this.environment.get(AUTO_COMPACT_WINDOW)
  }

  inheritShrunkWindow(): void {
    this.environment.set(AUTO_COMPACT_WINDOW, SMALLEST_WINDOW)
  }

  refuseNextWindowChange(): void {
    this.isRefusingWindowChange = true
  }

  holdToolCall(toolUseId: string): () => void {
    let finish = () => {}
    this.heldToolCalls.set(toolUseId, new Promise(resolve => (finish = resolve)))

    return finish
  }

  show(messages: readonly SessionMessage[]): void {
    this.messages = [...messages]
  }

  grow(tokens: number): void {
    this.tokens = tokens
  }

  refusePrompts(): void {
    this.isRefusingPrompts = true
  }

  refuseCompaction(): void {
    this.compaction = 'is refused'
  }

  failCompaction(): void {
    this.compaction = 'fails'
  }

  install(on: On): void {
    on('session.usage', () => ({ value: { startedAt: 0, context: { tokens: this.tokens, window: MODEL_WINDOW }, rateLimits: [] } }))
    on('session.messages', () => ({ value: [...this.messages] }))
    on('turn.step', async function* (_, e) {
      yield RESPONSE_CHUNK
      return { turnId: e.turnId, index: e.index, ...RESPONSE }
    })
    on('turn.start', (_, e) => ({ turnId: e.turnId }))
    on('turn.complete', (_, e) => ({ text: e.answer }))
    on('tool.call', async (_, e) => {
      this.windowsToolsRanUnder.push(this.autoCompactWindow)
      await this.heldToolCalls.get(e.tool_use_id ?? '')
      return { result: 'contents of file-next' }
    })
    on('session.compact', () => this.compactInTurn())
    on('command.run', { command: 'compact' }, (_, e, next) => (this.compaction === 'fails' ? next(e) : this.compactBetweenTurns()))
    on('env.set', (_, e) => {
      if (this.isRefusingWindowChange) {
        this.isRefusingWindowChange = false
        return { deny: WINDOW_REFUSED }
      }

      this.environment.set(e.name, e.value)
      return { value: undefined }
    })
    on('ui.log', (_, e) => {
      this.notices.push(e.text)
      return { value: undefined }
    })
    on('prompt.submit', (_, e) => {
      if (this.isRefusingPrompts) return { drop: BLOCKED }

      this.events.push({ prompt: e.text })
      return { text: e.text }
    })
  }

  private compactInTurn(): SessionCompactResult {
    if (this.compaction === 'is refused') {
      this.events.push({ compaction: 'refused' })
      return { skip: SKIPPED }
    }

    this.tokens = undefined
    this.events.push({ compaction: 'ran' })
    return { messages: [request(SUMMARY)], tokensAfter: AFTER_COMPACTION }
  }

  private compactBetweenTurns(): { text?: string } {
    if (this.compaction === 'is refused') {
      this.events.push({ compaction: 'refused' })
      return { text: REFUSED }
    }

    this.tokens = undefined
    this.events.push({ compaction: 'ran' })
    return {}
  }
}

async function step($: Engine, loop: { turnId?: string; agentId?: string } = {}): Promise<{ chunks: TurnStepChunk[]; result: TurnStepResult }> {
  const stream = $.turn.step({ turnId: TURN, index: 0, model: MODEL, messageCount: CONVERSATION.length, ...loop })

  const chunks: TurnStepChunk[] = []
  let read = await stream.next()
  while (!read.done) {
    chunks.push(read.value)
    read = await stream.next()
  }

  return { chunks, result: read.value }
}

function runTool($: Engine, loop: { agentId?: string; tool_use_id?: string } = {}) {
  return $.tool.call({ tool: 'Read', tool_use_id: 'toolu_next', file_path: '/repo/file-next.ts', ...loop })
}

async function stepWhileItsSlowToolStarts($: Engine, clock: MockClock): Promise<void> {
  const stream = $.turn.step({ turnId: TURN, index: 0, model: MODEL, messageCount: CONVERSATION.length })

  await stream.next()
  void runTool($, { tool_use_id: SLOW_TOOL })
  await clock.settle()
  await stream.next()
}

async function stepAndRunItsTool($: Engine): Promise<void> {
  await step($)
  await runTool($)
}

function compactInTurn($: Engine, loop: { agentId?: string } = {}) {
  return $.session.compact({ trigger: 'auto', messages: CONVERSATION, ...loop })
}

function submit($: Engine, text: string, origin: PromptOrigin = { kind: 'composer' }) {
  return $.prompt.submit({ text, wait: false, origin })
}

async function growPastItsOwnCompaction($: Engine, session: FakeSession): Promise<void> {
  await stepAndRunItsTool($)
  await compactInTurn($)
  session.show([request(SUMMARY), ...toolSteps(2)])
  await step($)
  session.grow(PAST_200K)
}

function complete($: Engine, end: { turnId?: string; reason?: 'answer' | 'aborted' | 'error' | 'refusal'; agentId?: string } = {}) {
  const reason = end.reason ?? 'answer'
  const ending = reason === 'refusal' ? { reason, refusal: { category: null, explanation: null } } : { reason }

  return $.turn.complete({ answer: 'Done.', durationMs: 1_000, isAborted: reason === 'aborted', turnId: end.turnId ?? TURN, ...ending, ...(end.agentId === undefined ? {} : { agentId: end.agentId }) })
}

const NO_SPACE = 'No space left on device'
const exited = (exitCode: number, stderr = '') => ({ exitCode, stdout: '', stderr, isStdoutTruncated: false, isStderrTruncated: false })

class FakeDecisionLog {
  private appended = ''
  private isFull = false

  get entries(): unknown[] {
    return this.appended
      .split('\n')
      .slice(0, -1)
      .map(line => JSON.parse(line))
  }

  fill(): void {
    this.isFull = true
  }

  install(on: On): void {
    on('process.run', (_, e) => {
      if (this.isFull) return { value: exited(1, NO_SPACE) }

      if (e.argv.join(' ').includes(LOG_FILE)) this.appended += e.init?.stdin ?? ''
      return { value: exited(0) }
    })
  }
}

type SessionState = { tokens: number | undefined; judge: JudgeSpy; log?: FakeDecisionLog }

function seedSession(on: On, state: SessionState): { clock: MockClock; session: FakeSession } {
  const clock = mock.clock(on, { now: NOW })
  const session = new FakeSession(state.tokens)
  state.judge.install(on, clock)
  ;(state.log ?? new FakeDecisionLog()).install(on)
  session.install(on)
  on('session.id', () => ({ value: SESSION_ID }))
  on('session.version', () => ({ value: VERSION }))

  return { clock, session }
}

describe('compaction-judge', () => {
  describe('a step of the main conversation past 200K', () => {
    test('sends its request where the judge sees a breakpoint', async ($, on) => {
      seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('now')) })

      const sent = await step($)

      expect(sent).toEqual(SENT)
    })

    test('asks sonnet for a one-word verdict', async ($, on) => {
      const judge = new JudgeSpy(answered('wait'))
      seedSession(on, { tokens: PAST_200K, judge })

      await step($)

      expect(judge.asked).toEqual([expect.objectContaining({ model: 'sonnet', system: expect.stringContaining('Reply with one word, now or wait, and nothing else.') })])
    })

    test('shows the judge the latest request', async ($, on) => {
      const judge = new JudgeSpy(answered('wait'))
      const { session } = seedSession(on, { tokens: PAST_200K, judge })
      session.show([request('Fix the login redirect'), ...toolSteps(30), request('Update the README'), ...toolSteps(30)])

      await step($)

      expect(judge.asked[0]?.prompt).toContain('Update the README')
      expect(judge.asked[0]?.prompt).not.toContain('Fix the login redirect')
    })

    test('shows the judge the newest steps and not the oldest', async ($, on) => {
      const judge = new JudgeSpy(answered('wait'))
      const { session } = seedSession(on, { tokens: PAST_200K, judge })
      session.show([request('Fix the login redirect'), ...toolSteps(30)])

      await step($)

      expect(judge.asked[0]?.prompt).toContain('file-30')
      expect(judge.asked[0]?.prompt).not.toContain('file-01')
    })

    test('shows the judge the outcome of each step', async ($, on) => {
      const judge = new JudgeSpy(answered('wait'))
      seedSession(on, { tokens: PAST_200K, judge })

      await step($)

      expect(judge.asked[0]?.prompt).toContain('contents of file-03')
    })

    test('shows the judge which steps failed', async ($, on) => {
      const judge = new JudgeSpy(answered('wait'))
      const { session } = seedSession(on, { tokens: PAST_200K, judge })
      session.show([...CONVERSATION, readCall('04'), withResult('04', '40 pass 2 fail', true)])

      await step($)

      expect(judge.asked[0]?.prompt).toContain('Error: 40 pass 2 fail')
    })

    test('shows the judge both ends of a long result', async ($, on) => {
      const judge = new JudgeSpy(answered('wait'))
      const { session } = seedSession(on, { tokens: PAST_200K, judge })
      session.show([...CONVERSATION, readCall('04'), withResult('04', `bun test ${'.'.repeat(5_000)} 12 pass 0 fail`, false)])

      await step($)

      expect(judge.asked[0]?.prompt).toContain('bun test')
      expect(judge.asked[0]?.prompt).toContain('12 pass 0 fail')
      expect(judge.asked[0]?.prompt).not.toContain('.'.repeat(1_000))
    })

    test('shows the judge the request that entered and not one a hook refused', async ($, on) => {
      const judge = new JudgeSpy(answered('wait'))
      const { session } = seedSession(on, { tokens: PAST_200K, judge })
      await submit($, 'Fix the login redirect')
      session.refusePrompts()
      await submit($, 'Delete the repository')
      session.show(toolSteps(2))

      await step($)

      expect(judge.asked[0]?.prompt).toContain('Fix the login redirect')
    })

    test('shows the judge the newest request that entered', async ($, on) => {
      const judge = new JudgeSpy(answered('wait'))
      const { session } = seedSession(on, { tokens: PAST_200K, judge })
      await submit($, 'Fix the login redirect')
      await submit($, 'Update the README')
      session.show(toolSteps(2))

      await step($)

      expect(judge.asked[0]?.prompt).toContain('Update the README')
      expect(judge.asked[0]?.prompt).not.toContain('Fix the login redirect')
    })

    for (const origin of [{ kind: 'bridge' }, { kind: 'sdk' }, { kind: 'slack-ping' }] as const) {
      test(`shows the judge a request sent through ${origin.kind}`, async ($, on) => {
        const judge = new JudgeSpy(answered('wait'))
        const { session } = seedSession(on, { tokens: PAST_200K, judge })
        await submit($, 'Fix the login redirect')
        await submit($, 'Update the README', origin)
        session.show(toolSteps(2))

        await step($)

        expect(judge.asked[0]?.prompt).toContain('Update the README')
      })
    }

    for (const origin of [{ kind: 'task-notification' }, { kind: 'peer' }, { kind: 'plugin', name: 'linter' }] as const) {
      test(`shows the judge the person's request and not a ${origin.kind} prompt after it`, async ($, on) => {
        const judge = new JudgeSpy(answered('wait'))
        const { session } = seedSession(on, { tokens: PAST_200K, judge })
        await submit($, 'Fix the login redirect')
        await submit($, 'A background task finished', origin)
        session.show(toolSteps(2))

        await step($)

        expect(judge.asked[0]?.prompt).toContain('Fix the login redirect')
      })
    }

    test('shows the judge the request and not text riding with a tool result', async ($, on) => {
      const judge = new JudgeSpy(answered('wait'))
      const { session } = seedSession(on, { tokens: PAST_200K, judge })
      session.show([request('Fix the login redirect'), ...toolSteps(30), readCall('31'), { ...readResult('31'), text: 'a reminder the harness attached' }])

      await step($)

      expect(judge.asked[0]?.prompt).toContain('Fix the login redirect')
    })

    const verdicts = [
      { name: 'a breakpoint the judge saw', answer: answered('now'), entry: { decision: 'compact', judged: 'now', reply: 'now', failure: null } },
      { name: "a wait with the judge's reply", answer: answered('wait'), entry: { decision: 'wait', judged: 'wait', reply: 'wait', failure: null } },
      { name: 'a judge that did not answer', answer: UNANSWERED, entry: { decision: 'wait', judged: null, reply: null, failure: 'empty-reply' } },
    ]
    for (const { name, answer, entry } of verdicts) {
      test(`records ${name}`, async ($, on) => {
        const log = new FakeDecisionLog()
        seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answer), log })

        await step($)

        expect(log.entries).toEqual([{ at: AT, session: SESSION_ID, moment: 'step', tokens: PAST_200K, ...entry, judgeMs: 0, judgeUsage: USAGE }])
      })
    }

    test('records how long the judge took', async ($, on) => {
      const log = new FakeDecisionLog()
      const { clock } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('wait'), JUDGE_LATENCY_MS), log })

      const stepping = step($)
      await clock.settle()
      await clock.advance(JUDGE_LATENCY_MS)
      await stepping

      expect(log.entries).toEqual([expect.objectContaining({ judgeMs: JUDGE_LATENCY_MS })])
    })

    describe('when the judge words its verdict loosely', () => {
      for (const reply of [' NOW\n', 'Now.', 'The agent just appended its note, so compacting now is fine.\n\nnow']) {
        test(`shrinks the auto-compact window on ${JSON.stringify(reply)}`, async ($, on) => {
          const { session } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered(reply)) })

          await stepAndRunItsTool($)

          expect(session.autoCompactWindow).toBe(SMALLEST_WINDOW)
        })
      }

      for (const reply of ['Wait', ' wait\n', 'Wait.', 'Now is not the time, since the agent is about to edit what it read.\n\nwait']) {
        test(`leaves the auto-compact window as configured on ${JSON.stringify(reply)}`, async ($, on) => {
          const { session } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered(reply)) })

          await stepAndRunItsTool($)

          expect(session.autoCompactWindow).toBeUndefined()
        })
      }
    })

    describe('when the judge does not answer', () => {
      test('leaves the auto-compact window as configured', async ($, on) => {
        const { session } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(UNANSWERED) })

        await stepAndRunItsTool($)

        expect(session.autoCompactWindow).toBeUndefined()
      })
    })

    describe('when the judge answers neither now nor wait', () => {
      test('leaves the auto-compact window as configured', async ($, on) => {
        const { session } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('It depends on the next step.')) })

        await stepAndRunItsTool($)

        expect(session.autoCompactWindow).toBeUndefined()
      })
    })

    describe('when the verdict cannot be recorded', () => {
      test('sends its request', async ($, on) => {
        const log = new FakeDecisionLog()
        log.fill()
        seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('now')), log })

        const sent = await step($)

        expect(sent).toEqual(SENT)
      })
    })
  })

  describe('a step the judge saw a breakpoint at', () => {
    test('shrinks the auto-compact window once its tool call returns', async ($, on) => {
      const { session } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('now')) })

      await stepAndRunItsTool($)

      expect(session.autoCompactWindow).toBe(SMALLEST_WINDOW)
    })

    test('shrinks the auto-compact window as it ends with no tool call running', async ($, on) => {
      const { session } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('now')) })

      await step($)

      expect(session.autoCompactWindow).toBe(SMALLEST_WINDOW)
    })

    test('shrinks the auto-compact window once the last of its running tool calls returns', async ($, on) => {
      const { clock, session } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('now')) })
      const finishSlowTool = session.holdToolCall(SLOW_TOOL)
      await step($)
      const slowTool = runTool($, { tool_use_id: SLOW_TOOL })
      await clock.settle()
      await runTool($)

      finishSlowTool()
      await slowTool

      expect(session.autoCompactWindow).toBe(SMALLEST_WINDOW)
    })

    test('runs each of its tool calls under the configured window', async ($, on) => {
      const { session } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('now')) })
      await step($)

      await runTool($)
      await runTool($)

      expect(session.windowsToolsRanUnder).toEqual([undefined, undefined])
    })

    test('lets the engine compact the conversation before the next step', async ($, on) => {
      const { session } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('now')) })
      await stepAndRunItsTool($)

      await compactInTurn($)

      expect(session.events).toEqual([{ compaction: 'ran' }])
    })

    test('restores the auto-compact window when the engine compacts', async ($, on) => {
      const { session } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('now')) })
      await stepAndRunItsTool($)

      await compactInTurn($)

      expect(session.autoCompactWindow).toBeUndefined()
    })

    test('records the compaction', async ($, on) => {
      const log = new FakeDecisionLog()
      seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('now')), log })
      await stepAndRunItsTool($)

      await compactInTurn($)

      expect(log.entries.at(-1)).toEqual({ at: AT, session: SESSION_ID, compaction: 'step', skip: null, tokensAfter: AFTER_COMPACTION })
    })

    test('watches again once the conversation is under 200K', async ($, on) => {
      const judge = new JudgeSpy(answered('now'))
      const { session } = seedSession(on, { tokens: PAST_200K, judge })
      await stepAndRunItsTool($)
      await compactInTurn($)
      session.grow(UNDER_200K)
      await step($)
      session.grow(PAST_200K)

      await stepAndRunItsTool($)

      expect(judge.asked).toHaveLength(2)
      expect(session.autoCompactWindow).toBe(SMALLEST_WINDOW)
    })

    test('shows the judge the request the user made before the compaction', async ($, on) => {
      const judge = new JudgeSpy(answered('now'))
      const { session } = seedSession(on, { tokens: PAST_200K, judge })
      await submit($, 'Fix the login redirect')
      await growPastItsOwnCompaction($, session)

      await step($)

      expect(judge.asked.at(-1)?.prompt).toContain('Fix the login redirect')
    })

    describe('when one of its tool calls returns while another runs', () => {
      test('leaves the auto-compact window as configured', async ($, on) => {
        const { clock, session } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('now')) })
        session.holdToolCall(SLOW_TOOL)
        await step($)
        void runTool($, { tool_use_id: SLOW_TOOL })
        await clock.settle()

        await runTool($)

        expect(session.autoCompactWindow).toBeUndefined()
      })
    })

    describe('when one of its tool calls starts before its response ends', () => {
      test('leaves the auto-compact window as configured', async ($, on) => {
        const { clock, session } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('now')) })
        session.holdToolCall(SLOW_TOOL)

        await stepWhileItsSlowToolStarts($, clock)

        expect(session.autoCompactWindow).toBeUndefined()
      })
    })

    describe("when a subagent's tool call returns while one of the turn's runs", () => {
      test('leaves the auto-compact window as configured', async ($, on) => {
        const { clock, session } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('now')) })
        session.holdToolCall(SLOW_TOOL)
        await step($)
        void runTool($, { tool_use_id: SLOW_TOOL })
        await clock.settle()

        await runTool($, { agentId: SUBAGENT })

        expect(session.autoCompactWindow).toBeUndefined()
      })
    })

    describe("when a subagent's tool call runs while the window is shrunk", () => {
      test('keeps the window shrunk while it runs', async ($, on) => {
        const { session } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('now')) })
        await step($)

        await runTool($, { agentId: SUBAGENT })

        expect(session.windowsToolsRanUnder).toEqual([SMALLEST_WINDOW])
      })
    })

    describe('when an interrupted turn left a tool call running', () => {
      test("shrinks the auto-compact window as the next turn's judged step ends", async ($, on) => {
        const { clock, session } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('now')) })
        session.holdToolCall(SLOW_TOOL)
        await step($)
        void runTool($, { tool_use_id: SLOW_TOOL })
        await clock.settle()
        await complete($, { reason: 'aborted' })
        await clock.settle()

        await step($, { turnId: NEXT_TURN })

        expect(session.autoCompactWindow).toBe(SMALLEST_WINDOW)
      })
    })

    describe('when a subagent compacts while the window is shrunk', () => {
      test('holds that compaction', async ($, on) => {
        const { session } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('now')) })
        await stepAndRunItsTool($)

        await compactInTurn($, { agentId: SUBAGENT })

        expect(session.events).toEqual([])
      })

      test('records the hold', async ($, on) => {
        const log = new FakeDecisionLog()
        seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('now')), log })
        await stepAndRunItsTool($)

        await compactInTurn($, { agentId: SUBAGENT })

        expect(log.entries.at(-1)).toEqual({ at: AT, session: SESSION_ID, compaction: 'held', agentId: SUBAGENT })
      })

      describe('when the hold cannot be recorded', () => {
        test('holds that compaction', async ($, on) => {
          const log = new FakeDecisionLog()
          const { session } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('now')), log })
          await stepAndRunItsTool($)
          log.fill()

          await compactInTurn($, { agentId: SUBAGENT })

          expect(session.events).toEqual([])
        })
      })
    })

    describe("when a subagent compacts while one of the turn's tool calls runs", () => {
      test('lets that compaction run', async ($, on) => {
        const { clock, session } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('now')) })
        session.holdToolCall(SLOW_TOOL)
        await step($)
        void runTool($, { tool_use_id: SLOW_TOOL })
        await clock.settle()

        await compactInTurn($, { agentId: SUBAGENT })

        expect(session.events).toEqual([{ compaction: 'ran' }])
      })
    })

    describe('when the engine refuses to restore the window as it compacts', () => {
      test('restores the auto-compact window when the turn ends', async ($, on) => {
        const { clock, session } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('now')) })
        await stepAndRunItsTool($)
        session.refuseNextWindowChange()
        await compactInTurn($)

        await complete($)
        await clock.settle()

        expect(session.autoCompactWindow).toBeUndefined()
      })
    })

    describe('when the turn ends before the engine compacts', () => {
      test('restores the auto-compact window', async ($, on) => {
        const { clock, session } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('now')) })
        await stepAndRunItsTool($)

        await complete($)
        await clock.settle()

        expect(session.autoCompactWindow).toBeUndefined()
      })

      test("leaves the window as configured after the next turn's tool call", async ($, on) => {
        const { clock, session } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('now')) })
        await step($)
        await complete($)
        await clock.settle()

        await runTool($)

        expect(session.autoCompactWindow).toBeUndefined()
      })
    })

    describe('when the engine does not compact before the next step', () => {
      test('restores the auto-compact window', async ($, on) => {
        const { session } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('now')) })
        await stepAndRunItsTool($)

        await step($)

        expect(session.autoCompactWindow).toBeUndefined()
      })

      test('records the compaction that did not come', async ($, on) => {
        const log = new FakeDecisionLog()
        seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('now')), log })
        await stepAndRunItsTool($)

        await step($)

        expect(log.entries.at(-1)).toEqual({ at: AT, session: SESSION_ID, compaction: 'missed' })
      })

      test('sends the next steps without asking the judge while the conversation stays past 200K', async ($, on) => {
        const judge = new JudgeSpy(answered('now'))
        seedSession(on, { tokens: PAST_200K, judge })
        await stepAndRunItsTool($)

        const sent = await step($)

        expect(sent).toEqual(SENT)
        expect(judge.asked).toHaveLength(1)
      })
    })

    describe('when a hook skips the compaction', () => {
      test('records the skip', async ($, on) => {
        const log = new FakeDecisionLog()
        const { session } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('now')), log })
        session.refuseCompaction()
        await stepAndRunItsTool($)

        await compactInTurn($)

        expect(log.entries.at(-1)).toEqual({ at: AT, session: SESSION_ID, compaction: 'step', skip: SKIPPED, tokensAfter: null })
      })

      test('sends the next steps without asking the judge while the conversation stays past 200K', async ($, on) => {
        const judge = new JudgeSpy(answered('now'))
        const { session } = seedSession(on, { tokens: PAST_200K, judge })
        session.refuseCompaction()
        await stepAndRunItsTool($)
        await compactInTurn($)

        const sent = await step($)

        expect(sent).toEqual(SENT)
        expect(judge.asked).toHaveLength(1)
      })

      test("watches again after the person's next request", async ($, on) => {
        const judge = new JudgeSpy(answered('now'))
        const { session } = seedSession(on, { tokens: PAST_200K, judge })
        session.refuseCompaction()
        await stepAndRunItsTool($)
        await compactInTurn($)
        await submit($, 'Fix the login redirect')

        await step($, { turnId: NEXT_TURN })

        expect(judge.asked).toHaveLength(2)
      })

      test('sends the next steps without asking the judge after a background notice', async ($, on) => {
        const judge = new JudgeSpy(answered('now'))
        const { session } = seedSession(on, { tokens: PAST_200K, judge })
        session.refuseCompaction()
        await stepAndRunItsTool($)
        await compactInTurn($)
        await submit($, 'A background task finished', { kind: 'task-notification' })

        await step($, { turnId: NEXT_TURN })

        expect(judge.asked).toHaveLength(1)
      })
    })

    describe('when the compaction cannot be recorded', () => {
      test('restores the auto-compact window', async ($, on) => {
        const log = new FakeDecisionLog()
        const { session } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('now')), log })
        await stepAndRunItsTool($)
        log.fill()

        await compactInTurn($)

        expect(session.autoCompactWindow).toBeUndefined()
      })
    })
  })

  describe('a turn that ends with an answer past 200K', () => {
    test('compacts the conversation where the judge sees a breakpoint', async ($, on) => {
      const { clock, session } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('now')) })

      await complete($)
      await clock.settle()

      expect(session.events).toEqual([{ compaction: 'ran' }])
    })

    test('stays as it is while the judge sees work in progress', async ($, on) => {
      const { clock, session } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('wait')) })

      await complete($)
      await clock.settle()

      expect(session.events).toEqual([])
    })

    test('records the verdict and the compaction', async ($, on) => {
      const log = new FakeDecisionLog()
      const { clock } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('now')), log })

      await complete($)
      await clock.settle()

      expect(log.entries).toEqual([
        { at: AT, session: SESSION_ID, moment: 'turn end', tokens: PAST_200K, decision: 'compact', judged: 'now', reply: 'now', failure: null, judgeMs: 0, judgeUsage: USAGE },
        { at: AT, session: SESSION_ID, compaction: 'turn end', output: null, error: null },
      ])
    })

    test('shows the judge the request the user made before the compaction', async ($, on) => {
      const judge = new JudgeSpy(answered('now'))
      const { clock, session } = seedSession(on, { tokens: PAST_200K, judge })
      await submit($, 'Fix the login redirect')
      await growPastItsOwnCompaction($, session)

      await complete($, { turnId: NEXT_TURN })
      await clock.settle()

      expect(judge.asked.at(-1)?.prompt).toContain('Fix the login redirect')
    })

    test('drops a verdict that arrives after the next turn started', async ($, on) => {
      const { clock, session } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('now'), JUDGE_LATENCY_MS) })
      await complete($)
      await $.turn.start({ text: 'Now update the README', turnId: NEXT_TURN })

      await clock.settle()
      await clock.advance(JUDGE_LATENCY_MS)
      await clock.settle()

      expect(session.events).toEqual([])
    })

    test("keeps a verdict that arrives after a subagent's step started", async ($, on) => {
      const { clock, session } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('now'), JUDGE_LATENCY_MS) })
      await complete($)
      await step($, { agentId: SUBAGENT })

      await clock.settle()
      await clock.advance(JUDGE_LATENCY_MS)
      await clock.settle()

      expect(session.events).toEqual([{ compaction: 'ran' }])
    })

    test("stays as it is after a step's compaction was skipped", async ($, on) => {
      const judge = new JudgeSpy(answered('now'))
      const { clock, session } = seedSession(on, { tokens: PAST_200K, judge })
      session.refuseCompaction()
      await stepAndRunItsTool($)
      await compactInTurn($)

      await complete($)
      await clock.settle()

      expect(judge.asked).toHaveLength(1)
      expect(session.events).toEqual([{ compaction: 'refused' }])
    })

    test('stays as it is after its own compaction was refused', async ($, on) => {
      const judge = new JudgeSpy(answered('now'))
      const { clock, session } = seedSession(on, { tokens: PAST_200K, judge })
      session.refuseCompaction()
      await complete($)
      await clock.settle()

      await complete($, { turnId: NEXT_TURN })
      await clock.settle()

      expect(judge.asked).toHaveLength(1)
    })

    describe('when the compaction is refused', () => {
      test('records what the compaction answered', async ($, on) => {
        const log = new FakeDecisionLog()
        const { clock, session } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('now')), log })
        session.refuseCompaction()

        await complete($)
        await clock.settle()

        expect(log.entries.at(-1)).toEqual({ at: AT, session: SESSION_ID, compaction: 'turn end', output: REFUSED, error: null })
      })
    })

    describe('when the compaction fails', () => {
      test('records the failure', async ($, on) => {
        const log = new FakeDecisionLog()
        const { clock, session } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('now')), log })
        session.failCompaction()

        await complete($)
        await clock.settle()

        expect(log.entries.at(-1)).toEqual({ at: AT, session: SESSION_ID, compaction: 'turn end', output: null, error: expect.stringContaining(NO_COMPACTION) })
      })
    })

    describe('when the log cannot be written', () => {
      test('says so in the transcript', async ($, on) => {
        const log = new FakeDecisionLog()
        log.fill()
        const { clock, session } = seedSession(on, { tokens: PAST_200K, judge: new JudgeSpy(answered('now')), log })

        await complete($)
        await clock.settle()

        expect(session.notices).toEqual([expect.stringContaining(NO_SPACE)])
      })
    })
  })

  describe('a turn that ends without asking the judge', () => {
    test('stays as it is under 200K', async ($, on) => {
      const judge = new JudgeSpy(answered('now'))
      const { clock, session } = seedSession(on, { tokens: UNDER_200K, judge })

      await complete($)
      await clock.settle()

      expect(session.events).toEqual([])
      expect(judge.asked).toEqual([])
    })

    test('stays as it is when its size is unknown', async ($, on) => {
      const judge = new JudgeSpy(answered('now'))
      const { clock, session } = seedSession(on, { tokens: undefined, judge })

      await complete($)
      await clock.settle()

      expect(session.events).toEqual([])
      expect(judge.asked).toEqual([])
    })

    for (const reason of ['aborted', 'error', 'refusal'] as const) {
      test(`stays as it is when it ended ${reason}`, async ($, on) => {
        const judge = new JudgeSpy(answered('now'))
        const { clock, session } = seedSession(on, { tokens: PAST_200K, judge })

        await complete($, { reason })
        await clock.settle()

        expect(session.events).toEqual([])
        expect(judge.asked).toEqual([])
      })
    }

    test("stays as it is when it was a subagent's", async ($, on) => {
      const judge = new JudgeSpy(answered('now'))
      const { clock, session } = seedSession(on, { tokens: PAST_200K, judge })

      await complete($, { agentId: SUBAGENT })
      await clock.settle()

      expect(session.events).toEqual([])
      expect(judge.asked).toEqual([])
    })
  })

  describe('a step of the main conversation at 200K', () => {
    test('asks the judge', async ($, on) => {
      const judge = new JudgeSpy(answered('wait'))
      seedSession(on, { tokens: AT_200K, judge })

      await step($)

      expect(judge.asked).toHaveLength(1)
    })
  })

  describe('a turn that ends with an answer at 200K', () => {
    test('asks the judge', async ($, on) => {
      const judge = new JudgeSpy(answered('wait'))
      const { clock } = seedSession(on, { tokens: AT_200K, judge })

      await complete($)
      await clock.settle()

      expect(judge.asked).toHaveLength(1)
    })
  })

  describe('a step of the main conversation far past 200K', () => {
    test('sends its request while the judge sees work in progress', async ($, on) => {
      seedSession(on, { tokens: FAR_PAST_200K, judge: new JudgeSpy(answered('wait')) })

      const sent = await step($)

      expect(sent).toEqual(SENT)
    })

    test('shrinks the auto-compact window once its tool call returns where the judge sees a breakpoint', async ($, on) => {
      const { session } = seedSession(on, { tokens: FAR_PAST_200K, judge: new JudgeSpy(answered('now')) })

      await stepAndRunItsTool($)

      expect(session.autoCompactWindow).toBe(SMALLEST_WINDOW)
    })
  })

  describe('a step of the main conversation under 200K', () => {
    test('sends its request without asking the judge', async ($, on) => {
      const judge = new JudgeSpy(answered('now'))
      seedSession(on, { tokens: UNDER_200K, judge })

      const sent = await step($)

      expect(sent).toEqual(SENT)
      expect(judge.asked).toEqual([])
    })
  })

  describe('a step of the main conversation of unknown size', () => {
    test('sends its request without asking the judge', async ($, on) => {
      const judge = new JudgeSpy(answered('now'))
      seedSession(on, { tokens: undefined, judge })

      const sent = await step($)

      expect(sent).toEqual(SENT)
      expect(judge.asked).toEqual([])
    })
  })

  describe("a subagent's step", () => {
    test('sends its request without asking the judge', async ($, on) => {
      const judge = new JudgeSpy(answered('now'))
      seedSession(on, { tokens: PAST_200K, judge })

      const sent = await step($, { agentId: SUBAGENT })

      expect(sent).toEqual(SENT)
      expect(judge.asked).toEqual([])
    })
  })

  describe('a session start', () => {
    test('records that the session loaded the judge', async ($, on) => {
      const log = new FakeDecisionLog()
      seedSession(on, { tokens: 0, judge: new JudgeSpy(answered('wait')), log })
      on('session.start', (_, e) => ({ cwd: e.cwd }))

      await $.session.start({ cwd: '/repo', surface: 'desktop', isInteractive: true })

      expect(log.entries).toEqual([{ at: AT, session: SESSION_ID, started: true, surface: 'desktop', isInteractive: true, version: VERSION.version }])
    })

    test('clears an auto-compact window an earlier load left shrunk', async ($, on) => {
      const { session } = seedSession(on, { tokens: 0, judge: new JudgeSpy(answered('wait')) })
      on('session.start', (_, e) => ({ cwd: e.cwd }))
      session.inheritShrunkWindow()

      await $.session.start({ cwd: '/repo', surface: 'desktop', isInteractive: true })

      expect(session.autoCompactWindow).toBeUndefined()
    })
  })
})
