#!/usr/bin/env bun
// Reads T3's state database. `find <title>` names sessions, `typed <thread-id>` prints what was typed into one,
// and `recent <thread-id> <time>` prints every message in one after a time.

import { Database } from "bun:sqlite";
import { homedir } from "node:os";
import { join } from "node:path";

import { flat, refuse, refuseForeignDirectory } from "./shared.js";

const FIND = `
select thread_id, updated_at, title from orchestration_v2_projection_threads
where deleted_at is null and archived_at is null
  and json_extract(payload_json, '$.lineage.relationshipToParent') is null
  and instr(lower(title), lower($title)) > 0
order by lower(title) = lower($title) desc, updated_at desc
`;
const TYPED = `
select
  m.created_at,
  r.status as run_status,
  json_extract(m.payload_json, '$.creationSource') as creation_source,
  json_extract(m.payload_json, '$.text') as text
from orchestration_v2_projection_messages m
left join orchestration_v2_projection_runs r on r.run_id = m.run_id
where m.thread_id = $thread and m.role = 'user' and json_extract(m.payload_json, '$.createdBy') = 'user'
order by m.created_at
`;
const RECENT = `
select
  m.created_at,
  m.role,
  r.status as run_status,
  json_extract(m.payload_json, '$.createdBy') as created_by,
  json_extract(m.payload_json, '$.creationSource') as creation_source,
  json_extract(m.payload_json, '$.text') as text
from orchestration_v2_projection_messages m
left join orchestration_v2_projection_runs r on r.run_id = m.run_id
where m.thread_id = $thread and strftime('%Y-%m-%dT%H:%M:%fZ', m.created_at) > $since
  and json_extract(m.payload_json, '$.text') is not null
order by strftime('%Y-%m-%dT%H:%M:%fZ', m.created_at)
`;
const USAGE = "usage: threads.js find <title> | threads.js typed <thread-id> | threads.js recent <thread-id> <time>";
const ZONED_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

function find(database, title) {
  const rows = database.query(FIND).all({ $title: title });
  if (rows.length === 0) {
    console.log(`no thread matches ${title}`);
    return 1;
  }

  for (const row of rows) {
    console.log(`${row.thread_id}  ${row.updated_at}  ${flat(row.title)}`);
  }

  return 0;
}

function provenance(row) {
  if (row.run_status === "queued") return "queued";
  if (row.creation_source === "server") return "answered";

  return "typed";
}

function typed(database, threadId) {
  const rows = database.query(TYPED).all({ $thread: threadId });
  if (rows.length === 0) {
    console.log(`no typed messages in ${threadId}`);
    return 1;
  }

  for (const row of rows) {
    console.log(`${row.created_at} ${provenance(row)} ${flat(row.text)}`);
  }

  return 0;
}

function author(row) {
  if (row.role !== "user") return row.role;
  if (row.created_by !== "user") return "agent";

  return provenance(row);
}

function recent(database, threadId, since) {
  const rows = database.query(RECENT).all({ $thread: threadId, $since: since });
  if (rows.length === 0) {
    console.log(`no messages in ${threadId} after ${since}`);
    return 1;
  }

  for (const row of rows) {
    console.log(`${row.created_at} ${author(row)} ${flat(row.text)}`);
  }

  return 0;
}

function nonEmpty(operand) {
  if (!operand) refuse(USAGE);

  return operand;
}

function zonedTime(operand) {
  const time = new Date(operand);
  if (!ZONED_TIME.test(operand) || Number.isNaN(time.getTime())) refuse(USAGE);

  return time.toISOString();
}

refuseForeignDirectory();

const commands = new Map([
  ["find", { run: find, operands: [nonEmpty] }],
  ["typed", { run: typed, operands: [nonEmpty] }],
  ["recent", { run: recent, operands: [nonEmpty, zonedTime] }],
]);
const [name, ...given] = process.argv.slice(2);
const command = commands.get(name);
if (!command || given.length !== command.operands.length) refuse(USAGE);

const operands = command.operands.map((parse, index) => parse(given[index]));

const database = new Database(join(homedir(), ".t3/userdata/statev2.sqlite"), { readonly: true });
database.run("PRAGMA busy_timeout = 30000");

process.exit(command.run(database, ...operands));
