---
name: iterate
disable-model-invocation: true
description: Runs one iteration of the loop on the board in the current directory: triage, pick the queue's first card, carry it through its columns one session at a time, reflect. Reads what each stage did before starting the next, and answers what a stage left open. Use when directed to run an iteration on a board. It runs one iteration and ends, so the next one is a separate direction.
---

# Iterate

You run one iteration on the board in the current directory, one session at a time,
and you answer between sessions what a stage left open, so the iteration reaches
its end without a question going out. The `iterate` script starts the sessions and
holds the guards, so run it rather than checking the tree, the goal, or the card's
status yourself.

```
iterate start           # triage, pick the queue's first card, write its bet, print it
iterate step <card>     # one session: the card's column, or reflect when it is Done
```

Start with `iterate start`, which prints the card. Rename this session to that card
id, so the session list says which card is running rather than which skill started
it. Then call `iterate step <card>` until it says the card is Done, overseeing
between the calls. Reflect runs on the last step, after Done.

Each call prints the session's reply on stdout and its cost on stderr. Read both.

## When a step stops

Exit 2 means the card's column did not move, and the stage's reply says why. A
question in it is yours to answer, the ones the Acting section says to ask once
included, because the direction to run the iteration is the direction to run it
to its end. Decide it on the recommendation the stage gave, or on your own where
it gave none, write the decision and its reason on the card as a note, and step
again. An action the hard lines reserve for a typed direction is the exception.
Write its exact command on the card and go on without it. A card that stalls on
the same question after your answer is one the loop cannot move. Say so and end
the iteration. When the reply instead says the work is not worth doing, that is a
verdict. Say it and end the iteration.

Exit 1, 3, or 4 ends the iteration. Say what the script said. A session cap or a
budget stop is not a failure. The card keeps its column, and whether to bet on it
again is decided outside the iteration.

## Oversee between the steps

The script watches whether the column moved. You watch what the stage did.

A stage that settles an unknown, chooses a mechanism, or names a constraint has made
a claim nobody has checked. Run the cheapest probe that would refute it: run the
command, read the file, plant a marker. Probe every such claim before the next step.
A stage that only did what the card already said made no claim, so probe nothing.

A refuted claim, or a cost the card never weighed, goes on the card as a note
before the next step, so the stage that runs next works from what you saw. The
iteration goes on. The stop file the script's help names and the script's own
exits end it, and a finding of yours never does.

## What the iteration leaves

Every step writes its own record before it returns, so a stop leaves the board true.
The last step refuses to return while anything it wrote is uncommitted, so commit
what it left rather than reporting the iteration complete over it.

Your reply is the brief. It says what happened to the card, the reflection's
verdict, each decision the iteration made on its own, and the one the reflection
leaves open. Check that verdict against the reflection doc before you relay it.
The records hold the rest.
