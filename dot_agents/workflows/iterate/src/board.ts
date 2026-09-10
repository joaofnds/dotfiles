import { $ } from "bun";
import { Exit } from "./exit.ts";

const cardPattern = /^[A-Z]+-[0-9]+(\.[0-9]+)?$/;
const queuePattern = /^\s*(?:\[\w+\]\s*)*([A-Z]+-[0-9]+(?:\.[0-9]+)?) - /m;

export type Card = {
  readonly text: string;
  readonly status: string;
  readonly assignee: string;
  readonly criteria: number;
};

export async function tool<T>(run: () => Promise<T>, what: string): Promise<T> {
  try {
    return await run();
  } catch (error) {
    throw new Exit(1, `${what}: ${describe(error)}`);
  }
}

function describe(error: unknown): string {
  if (error instanceof $.ShellError) {
    const said = `${error.stdout.toString()}${error.stderr.toString()}`.trim();
    if (said) return said;
  }

  return error instanceof Error ? error.message : String(error);
}

export function cardId(value: string): string {
  const id = value.toUpperCase();
  if (!cardPattern.test(id)) throw new Exit(1, `${value} is not a card id`);

  return id;
}

export async function card(id: string): Promise<Card> {
  const text = await tool(() => $`backlog task view ${id} --plain`.text(), `reading ${id} failed`);
  const field = (name: string): string =>
    text
      .split("\n")
      .find((line) => line.startsWith(`${name}:`))
      ?.slice(name.length + 1)
      .trim() ?? "";

  return {
    text,
    status: field("Status").replace(/^[^A-Za-z]*/, ""),
    assignee: field("Assignee"),
    criteria: countCriteria(text),
  };
}

// Definition of Done items are checkbox lines of the same shape, so counting past
// the Acceptance Criteria section reports criteria on a card that has none.
function countCriteria(text: string): number {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => line.startsWith("Acceptance Criteria:"));
  if (start === -1) return 0;

  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^[A-Z][A-Za-z ]*:$/.test(line));

  return (end === -1 ? rest : rest.slice(0, end)).filter((line) => /^- \[[ x]\] #/.test(line))
    .length;
}

export async function pick(): Promise<string> {
  const list = await tool(
    () => $`backlog task list --ready --sort priority --plain`.text(),
    "reading the queue failed",
  );

  return list.match(queuePattern)?.[1] ?? "";
}

export async function boardHasActiveMilestone(): Promise<boolean> {
  const list = await tool(
    () => $`backlog milestone list --plain`.text(),
    "reading the milestones failed",
  );

  return /Active milestones \([1-9]/.test(list);
}

export async function appendNote(id: string, note: string): Promise<void> {
  await tool(
    () => $`backlog task edit ${id} --append-notes ${note}`.quiet(),
    `writing on ${id} failed`,
  );
}

export async function setStatus(id: string, status: string): Promise<void> {
  await tool(
    () => $`backlog task edit ${id} --status ${status}`.quiet(),
    `moving ${id} to ${status} failed`,
  );
}
