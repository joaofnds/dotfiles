import { $ } from "bun";
import { z } from "zod";
import type { Stage } from "./agents.ts";
import { Exit } from "./exit.ts";

const cardPattern = /^[A-Z]+-[0-9]+(\.[0-9]+)*$/;
const stagesByStatus = new Map<string, Stage>([
  ["To Do", "shape"],
  ["Shape", "shape"],
  ["Build", "build"],
  ["Review", "review"],
]);
const checklistItem = z.object({ index: z.number(), text: z.string(), checked: z.boolean() });
const taskFields = z.object({ status: z.string(), labels: z.array(z.string()) });
const taskView = z.object({
  schemaVersion: z.literal(1),
  task: taskFields.extend({
    assignees: z.array(z.string()),
    acceptanceCriteria: z.array(checklistItem),
    definitionOfDone: z.array(checklistItem),
    references: z.array(z.string()),
    dependencies: z.array(z.string()),
    priority: z.string().nullable(),
    type: z.string().nullable(),
    project: z.string().nullable(),
    reporter: z.string().nullable(),
    milestone: z.string().nullable(),
    dueDate: z.string().nullable(),
    ordinal: z.number().nullable(),
    parentTaskId: z.string().nullable(),
    subtasks: z.array(z.unknown()),
    title: z.string(),
    description: z.string().nullable(),
    implementationPlan: z.string().nullable(),
    implementationNotes: z.string().nullable(),
    finalSummary: z.string().nullable(),
    documentation: z.array(z.string()),
    comments: z.array(z.unknown()),
  }),
});
const taskList = z.object({
  schemaVersion: z.literal(1),
  tasks: z.array(taskFields.extend({ id: z.string().regex(cardPattern) })),
});

export type Card = {
  readonly text: string;
  readonly status: string;
  readonly assignee: string;
  readonly criteria: number;
  readonly labels: readonly string[];
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
  const { task } = await tool(
    async () => taskView.parse(await $`backlog task view ${id} --json`.json()),
    `reading ${id} failed`,
  );

  return {
    text: JSON.stringify(task),
    status: task.status,
    assignee: task.assignees.join(", "),
    criteria: task.acceptanceCriteria.length,
    labels: task.labels,
  };
}

export function stageForStatus(status: string): Stage | undefined {
  return stagesByStatus.get(status);
}

function isAccepted(task: {
  readonly status: string;
  readonly labels: readonly string[];
}): boolean {
  return stageForStatus(task.status) !== undefined && !task.labels.includes("deferred");
}

export async function acceptedQueue(readiness: "all" | "ready"): Promise<string[]> {
  const ready = readiness === "ready" ? ["--ready"] : [];
  const { tasks } = await tool(
    async () => taskList.parse(await $`backlog task list ${ready} --sort priority --json`.json()),
    "reading the queue failed",
  );

  return tasks.filter(isAccepted).map((task) => task.id);
}

export async function pick(accepted: ReadonlySet<string>): Promise<string> {
  return (await acceptedQueue("ready")).find((id) => accepted.has(id)) ?? "";
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
