# Ownership

The stance, and the short form of the excuse rule, are in `~/.agents/AGENTS.md`
§Ownership. A bug in code you never wrote, a red check, a test that passes only on
one machine or one run, a type error in a file you never touched, a TODO nobody
owns, and a misleading log are all yours from the moment you see them.

- Fix a defect required to meet or verify the active task's agreed acceptance.
  Capture an independent defect through the board rules under Capture and admission,
  even when its fix looks small. The handoff names the evidence and where it went.
  Capturing an incidental defect accounts for it without accepting its fix.
- A red check, in CI or on this machine, outranks the task, because nothing ships
  while it stays red. Read its state when you start and before you call the work
  done. Fix failures of the active task's acceptance before continuing. Capture an
  independent failure for expedited screening and report what it prevents.
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

An independent fix needs admission even when the defect is confirmed. Keep its
eventual commit separate from the directed change. A sub-agent sent to read or
review owns none of this.
It reports what it finds, and its caller fixes it or puts it on a card. Read the diff
and the working tree before you report what changed. Another session's work in the
tree is not yours to claim or commit.
