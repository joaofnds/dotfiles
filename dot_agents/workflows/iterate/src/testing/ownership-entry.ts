import { readFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";
import { agentPlanFromArgs, selectionForStage, stages } from "../agents.ts";
import { card } from "../board.ts";
import { markerSchema, NativeGate } from "../board-transaction.ts";
import { canonicalBoard, readClaim, requireOwnership } from "../claims.ts";
import { Journal } from "../journal.ts";

const [provider = "", requestedStage = ""] = process.argv.slice(2);
if (provider === "unbound-native") {
  const marker = markerSchema.parse(JSON.parse(await readFile(requestedStage, "utf8")));
  const gate = new NativeGate(
    marker,
    join(marker.board, ".locks", `task-${marker.card.toLowerCase()}`),
  );
  await gate.edit(["--assignee", "@unbound-delegation"]);
} else {
  const stage = stages.find((entry) => entry === requestedStage);
  if (!stage) throw new Error("unknown fixture stage");
  const selection = selectionForStage(agentPlanFromArgs(["--default-provider", provider]), stage);
  const board = await canonicalBoard();
  const journal = await Journal.read("TASK-1");
  const claim = await readClaim({ board, id: "TASK-1" });
  requireOwnership({ before: await card("TASK-1"), claim, journal, recovery: undefined });
  console.log(JSON.stringify({ selection, claim }));
}
