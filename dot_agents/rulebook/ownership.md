# Ownership

The stance, and the short form of the excuse rule, are in `~/.agents/AGENTS.md`
§Ownership. A bug in code you never wrote, a red check, a test that passes only on
one machine or one run, a type error in a file you never touched, a TODO nobody
owns, and a misleading log are all yours from the moment you see them.

- The active task's own work is its agreed acceptance, a defect that blocks meeting
  or verifying that acceptance wherever it lives, a defect in code this card's
  sessions wrote, and every other defect whose fix fits in this session, friction
  the work met in the project's code, tests, or tooling included. A fix fits when
  you can make, verify, and commit it before the handoff without displacing the
  acceptance. Fixing that work is not the scope growth the Acting section asks
  about. Fix each such defect before calling the task done, in its own commit apart
  from the change, so the next change in the same place starts easier. A card is no
  cheaper place for that work, since it costs a screening, a later session's
  context, and the operator's attention, and the defect keeps costing while it
  waits.

  Settle a fix's open choice through the decide skill, and ask once what it leaves
  unsettled, as the Acting section says. Capture a defect through the board rules
  under Capture and admission only when its fix does not fit, or waits on that
  question with no one at the keyboard to answer it. A defect that blocks the
  acceptance holds the task open either way. Before capturing one, run the check
  that would settle what the card would list as uncertain, because a card resting
  on an unchecked doubt can record a non-defect. Friction you capture rather than
  fix follows `~/.agents/rulebook/continuous-improvement.md`. The handoff names each
  item's evidence and where it went, the commit or the card. Capturing a defect
  accounts for it without accepting its fix.
- A red check, in CI or on this machine, outranks the task, because nothing ships
  while it stays red. Read its state when you start and before you call the work
  done. Fix a failure the first rule makes the task's own before continuing. Capture any
  other for expedited screening and report what it prevents.
- "Pre-existing", "not my problem", "unrelated flake", "I didn't touch that file",
  "separate concern", and "it passes in CI" each name a defect you saw and are
  leaving. None of them closes it. Say what you saw, its evidence, and where it
  went: the commit, the card, or the ask.
- Leave what you touch better than you found it, with the tidying in its own commit
  apart from the change. A shortcut you take gets a card naming what it defers and
  why, because debt with no owner is never repaid. A TODO you leave in the code
  gets the same card or gets fixed.
- A card nobody picked, a review nobody read, and a question parked for days cost
  more the longer they wait, and the wait is yours to name. Name each one you meet
  in the reply, with how long it has waited.

A captured fix needs admission even when the defect is confirmed. Keep its
eventual commit separate from the directed change. A sub-agent sent to read or
review owns none of this.
It reports what it finds, and its caller fixes it or puts it on a card. Read the diff
and the working tree before you report what changed. Another session's work in the
tree is not yours to claim or commit.
