---
name: iterate
disable-model-invocation: true
description: Runs one iteration of the loop on the board in the current directory: triage, pick the queue's first card, carry it through its columns one session at a time, reflect. Reads what each stage did before starting the next, and stops when a stage's claim does not hold. Use when João directs an iteration on a board. It runs one iteration and ends, so he answers before the next.
---

# Iterate

You run one iteration on the board in the current directory, one session at a time,
and you decide after each one whether the next should start. The `iterate` script
starts the sessions and holds the guards, so run it rather than checking the tree,
the goal, or the card's status yourself.

```
iterate start           # triage, pick the queue's first card, write its bet, print it
iterate step <card>     # one session: the card's column, or reflect when it is Done
```

Start with `iterate start`, which prints the card. Then call `iterate step <card>`
until it says the card is Done, overseeing between the calls. Reflect runs on the
last step, after Done.

Each call prints the session's reply on stdout and its cost on stderr. Read both.

## When a step stops

Exit 2 means the card's column did not move. Usually the stage is asking João
something. Read the stage's reply and the card, and take the question to him as one
numbered list with your recommendation. When the reply instead says the work should
stop, say that, since a card that is no longer worth doing is not a question.

Exit 1, 3, or 4 ends the iteration. Say what the script said. A session cap or a
budget stop is not a failure: the card keeps its column, and it is João's call
whether to bet on it again.

## Oversee between the steps

The script watches whether the column moved. You watch what the stage did.

A stage that settles an unknown, chooses a mechanism, or names a constraint has made
a claim nobody has checked. Run the cheapest probe that would refute it: run the
command, read the file, plant a marker. Probe every such claim before the next step.
A stage that only did what the card already said made no claim, so probe nothing.

Stop the iteration when a probe refutes a claim, or when a stage's result costs
something the card never weighed. Write what you saw on the card, put the choice to
João, and end the turn.

## What the iteration leaves

Every step writes its own record before it returns, so a stop leaves the board true.
Your reply to João is the brief. It says what happened to the card, the reflection's
verdict, and the one thing he decides next. Check that verdict against the reflection
doc before you relay it. The records hold the rest.
