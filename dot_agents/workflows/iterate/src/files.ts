import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { lstat, open, rename } from "node:fs/promises";
import { dirname } from "node:path";
import { Exit } from "./exit.ts";

export async function atomicJson(path: string, value: unknown): Promise<void> {
  const temporary = `${path}.${randomUUID()}.tmp`;
  const handle = await open(temporary, "wx", 0o600);
  try {
    await handle.writeFile(`${JSON.stringify(value, null, 2)}\n`);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await rename(temporary, path);
  const directory = await open(dirname(path), "r");
  try {
    await directory.sync();
  } finally {
    await directory.close();
  }
}

export async function readOptionalFile({
  path,
  description,
}: {
  readonly path: string;
  readonly description: string;
}): Promise<Buffer | undefined> {
  try {
    const entry = await lstat(path).catch((error: unknown) => {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") return;

      throw error;
    });
    if (entry === undefined) return undefined;

    const file = await open(path, constants.O_RDONLY | constants.O_NONBLOCK);
    try {
      if (!(await file.stat()).isFile())
        throw new Exit(1, `${description} ${path} must be a regular file`);

      return await file.readFile({ signal: AbortSignal.timeout(2000) });
    } finally {
      await file.close();
    }
  } catch (error) {
    if (error instanceof Exit) throw error;

    const diagnostic = error instanceof Error ? error.message : String(error);
    throw new Exit(1, `reading ${description} ${path} failed: ${diagnostic}`);
  }
}

export type JsonWriter = (path: string, value: unknown) => Promise<void>;
export type FileRemoval = (path: string) => Promise<void>;
