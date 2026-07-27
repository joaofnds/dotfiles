# reply-length fixture

Test data for `scripts/measure-reply-length.sh`. Verifies the four-step extraction rule in
`.boris/plans/2026-07-27-reply-length-and-ste-prose-spec.md` §1.

    bash scripts/measure-reply-length.sh scripts/fixtures/reply-length | diff - scripts/fixtures/reply-length/expected.txt

## What each record is for

| record | role | purpose |
|---|---|---|
| 1 | user, string content | opens turn 1 (rule 2, string clause) |
| 2 | assistant | `thinking` + `text` (21 words) + `tool_use`; only the text counts (rule 3) |
| 3 | user, array with `tool_result` | **not** a turn boundary (rule 2, the load-bearing filter) |
| 4 | assistant | second `text` emission of turn 1 (30 words) |
| 5 | `type: "mode"`, `isSidechain: null` | non-message record; must not crash or count |
| 6, 7 | `isSidechain: true` | dropped by rule 1; record 7 carries 25 words, so dropping it changes the result |
| 8, 9 | user + assistant with no `text` block | zero-prose turn 2, excluded by rule 4 |
| 10 | user, array without `tool_result` | opens turn 3 (rule 2, array clause). Its own 10 words are never counted — rule 3 counts assistant records only |
| 11 | assistant | turn 3: a `Reading:` line and a `Decision:` block, 60 words, all counted (AC 11) |
| 12, 13 | user + assistant | turn 4, 140 words, the one over-budget turn |

Record 3 sits **between** records 2 and 4 on purpose. Move it to the end of its turn and a
per-emission split creates a trailing zero-prose turn that rule 4 then removes, so a broken
script prints the same numbers as a correct one.

## Per-record word counts

Measured with `wc -w` over each extracted `text` block, independently of the script:
21, 30, 25 (sidechain), 60, 140.

## The arithmetic

Included turns: 21 + 30 = 51, then 60, then 140. Turn 2 is zero-prose and excluded.

Sorted: 51, 60, 140. Sum 251. Percentiles are nearest-rank, index `ceil(p/100 * n)` on the
1-based sorted list, and the median is the 50th percentile under the same rule.

| line | value | why |
|---|---|---|
| turns | 3 | four turns, one excluded by rule 4 |
| emissions | 4 | records 2, 4, 11, 13 |
| median | 60 | `ceil(0.50 * 3) = 2` |
| mean | 83.7 | 251 / 3 = 83.666… |
| p75 | 140 | `ceil(0.75 * 3) = 3` |
| p90 | 140 | `ceil(0.90 * 3) = 3` |
| p99 | 140 | `ceil(0.99 * 3) = 3` |
| max | 140 | |
| over_125_pct | 33.3 | 1 of 3 |
| over_125_prose_share_pct | 55.8 | 140 / 251 = 55.776… |

## What a wrong implementation prints

A script that splits on **every** `type == "user"` record — the failure spec §1 rule 2 and
AC 9 warn about — measures emissions instead of turns. Its four turns are 21, 30, 60, 140:

    turns: 4        (correct: 3)
    median: 30      (correct: 60)

Both numbers differ from the correct output, so the fixture discriminates.

A script that ignores `isSidechain` gets turns 51, 25, 60, 140:

    turns: 4        (correct: 3)
    median: 51      (correct: 60)
