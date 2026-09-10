import { $ } from "bun";
import { tool } from "./board.ts";

export const stopFile = ".iterate-stop";

export async function treeIsClean(): Promise<boolean> {
  const status = await tool(() => $`git status --porcelain`.text(), "reading the tree failed");

  return status.split("\n").every((line) => line === "" || line === `?? ${stopFile}`);
}
