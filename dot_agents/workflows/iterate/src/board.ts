import { $ } from "bun";
import { z } from "zod";
import type { Stage } from "./agents.ts";
import {
  BoardCommandFailure,
  type BoardOperations,
  backlogCommand,
  type NativeGate,
} from "./board-transaction.ts";
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
    definitionOfDone: z.array(checklistItem),
  }),
});

export type Card = {
  readonly status: string;
  readonly assignee: string;
  readonly assignees: readonly string[];
  readonly criteria: number;
  readonly uncheckedRequirements: number;
  readonly labels: readonly string[];
};

export async function tool<T>(run: () => Promise<T>, what: string): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof BoardCommandFailure) throw error;

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

export async function card(
  id: string,
  gate?: NativeGate,
  operations: BoardOperations = {},
): Promise<Card> {
  const { task } = await tool(
    async () =>
      taskView.parse(
        JSON.parse(
          await backlogCommand(["task", "view", id, "--json"], gate, false, undefined, operations),
        ),
      ),
    `reading ${id} failed`,
  );

  return {
    status: task.status,
    assignee: task.assignees.join(", "),
    assignees: task.assignees,
    criteria: task.acceptanceCriteria.length,
    uncheckedRequirements: [...task.acceptanceCriteria, ...task.definitionOfDone].filter(
      (item) => !item.checked,
    ).length,
    labels: task.labels,
  };
}

export function stageForStatus(status: string): Stage | undefined {
  return stagesByStatus.get(status);
}

export function inProgress(status: string): boolean {
  return status === "Build" || status === "Review";
}

export async function setStatus({
  gate,
  status,
}: {
  readonly gate: NativeGate;
  readonly status: string;
}): Promise<void> {
  await gate.edit(["--status", status]);
}

export async function setAssignee({
  gate,
  assignee,
}: {
  readonly gate: NativeGate;
  readonly assignee: string;
}): Promise<void> {
  await gate.edit(["--assignee", assignee]);
}
