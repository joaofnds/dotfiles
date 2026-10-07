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
const taskView = z.object({
  schemaVersion: z.literal(1),
  task: z.object({
    status: z.string(),
    labels: z.array(z.string()),
    assignees: z.array(z.string()),
    acceptanceCriteria: z.array(checklistItem),
  }),
});
export const ours = "@claude";

export type Card = {
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
    status: task.status,
    assignee: task.assignees.join(", "),
    criteria: task.acceptanceCriteria.length,
    labels: task.labels,
  };
}

export function stageForStatus(status: string): Stage | undefined {
  return stagesByStatus.get(status);
}

export function inProgress(status: string): boolean {
  return status === "Build" || status === "Review";
}

export async function setStatus(id: string, status: string): Promise<void> {
  await tool(
    () => $`backlog task edit ${id} --status ${status}`.quiet(),
    `moving ${id} to ${status} failed`,
  );
}
