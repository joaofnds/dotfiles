---
name: iterate
disable-model-invocation: true
argument-hint: "<card> [--<stage>-agent provider:model[:effort] ...]"
description: Supervises one accepted card through its required stages in fresh sessions, reading each result before continuing. Runs only on direction with a card ID. Planning and reflection run separately.
---

# Iterate

You carry the named card to Done on the board in the current directory, one session at a time,
and you answer between sessions what a stage left open, so the iteration reaches
its end within the card's accepted scope. If the invocation has no card ID, ask for
one. Intake, selecting work, writing a bet, and reflection are outside this run.
The `iterate` script starts the sessions and holds the guards, so use it for each
stage. The stage skills own their work and required reviews.

Pass every `--<stage>-agent provider:model[:effort]` option from the invocation
unchanged to each `step` or `resume`. The runner applies only the option for the
stage it is about to run. A stage with no option uses the Claude CLI defaults.
The supported stage names are shape, debug, verify, build, and review.
Unqualified `--provider`, `--model`, and `--effort` belong to one direct runner
call and cannot be mixed with stage options.

Rename this session to the card
id, so the session list says which card is running rather than which skill started
it. Then call `iterate step <card>` until it says the card is Done, overseeing
between the calls. Call each step separately so you can read its result before
starting another. After a stage reaches Done, call step once more to check the tree
and close the run without starting a session.

Each call prints the session's reply on stdout, and on stderr the stage and its
cost. Read both.

## When a step stops

Exit 2 means the card's column did not move, and the stage's reply says why. A
question in it is yours to answer, the ones the Acting section says to ask once
included, because the direction to run the iteration is the direction to run it
to its end. Decide it on the recommendation the stage gave, or on your own where
it gave none, write the decision and its reason on the card as a note, and continue through the
runner's resume policy for the same stage and agent options. Refresh changed state
and steering. Keep independent reviewers fresh. Use a fresh step when resume is
unsupported or stale. An action the hard lines reserve for a typed direction is the exception.
Write its exact command on the card and go on without it. A card that stalls on
the same question after your answer is one the loop cannot move. Say so and end
the iteration. When the reply instead says the work is not worth doing, that is a
verdict. Say it and end the iteration.

Exit 1 or 3 ends the iteration. Say what the script said. A session cap or a
budget stop is not a failure. The card keeps its column, and whether to resume the
work is decided outside the iteration.

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

Your reply is the brief. It says what happened to the card, each decision the
iteration made on its own, and what remains unresolved. The records hold the rest.
