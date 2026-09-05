# Glossary

Terms of this repository's domain, in the words João uses for them. Add a term when
you introduce or lean on one; one term per concept.

- **Corpus**: the instruction files this repository renders for agents: the global
  instructions, the rules, skills, agent definitions, output styles.
- **Rules**: the craft knowledge under `~/.agents/rulebook/`: the doctrine, coding
  style, engineering judgment, coupling, testing, the refactoring pass and catalog,
  the wikis, the board, ownership, continuous improvement. The source for that knowledge. The global instructions
  compress it and the skills route to it.
- **Reply**: the final message of a turn, the only text João reliably reads.
- **Brief**: the reply cut to what João can act on, in the register the brief output
  style sets.
- **Record**: where the detail of the work lives when it leaves the reply: the commit,
  the card, or the document.
- **Handoff**: the record on a card that lets a fresh session continue the work cold.
  Build writes one when a task finishes. The relay skill writes one when a session
  stops partway, covering the whole session rather than the phase.
- **Position**: where the work stands now. Its opposite is the **story**, the account
  of how it got there.
- **Closed finding**: fixed, verified, and needing nothing from João. An **open
  finding** needs a decision, carries a risk, or waits on him.
- **Independent review**: a review whose reader is unprimed. The `reviewer` agent
  supplies this within a session, from its own fresh context. A project may
  additionally require a different session, as trunk's definition of done does for QA
  on real behaviour. The two are separate requirements. A project's own rule says
  which it wants.
- **Fire**: one use of /brief on a reply; the signal that the reply failed.
- **Replay**: the probe that forks a real transcript just before a fired reply and
  regenerates that reply under a style variant (doc-4).
- **Sitting**: two or more cards one session would do together (same file, same
  fixture, same design question). Linked and bundled in the queue, not merged: each
  keeps its own acceptance list. Distinct from a **duplicate** (one survivor, the
  other archived with a pointer) and a **rule with several instances** (one decision
  card, then dependent builds).
- **Stage**: one column's work on one card, done by one fresh session running that
  column's skill. Rehearsal uses the same word.
- **Run**: one card carried through its stages until Done, a question for João, or a
  guard.
- **Runner**: the script outside the harness that starts each stage's session, reads
  the card between stages, and applies the guards.
- **Held card**: a card in Build or Review with an assignee, belonging to the session
  that set it. Another session may add a note and never changes its status.
- **Goal**: what a board's open work is judged against, stated on its newest triage
  doc. Triage orders the queue by it and reflect judges each increment against it.
  Changing it is João's call.
- **Milestone**: one increment of the goal, named by what João can do when it is Done,
  holding the cards that produce it. A board carries several, ordered by when their
  feedback is needed.
- **Iteration**: one pass of the outer loop: triage the board, pick the queue's first
  card, run it to Done, reflect. The loop repeats iterations. It never drains the
  board.
- **Reflection doc**: the dated doc the reflect step leaves on the board, through the
  backlog CLI: the Coaching Kata's five questions answered, one verdict on the goal
  (on track, adjust, or pivot), proposed planning changes, and kaizen candidates.
  Reflect proposes; the next triage applies.
- **Bet**: the card an iteration commits to, with what will be observable about the
  goal when it is Done and the budget it gets. Triage writes it as the queue's first
  entry and the pick step copies it onto the card. Reflect judges against it.
- **Pick**: the iteration step that takes the first single card of the triage queue,
  writes its bet onto it as a dated note, and starts the run. The runner does it, or
  João by hand.
- **Ownership**: the stance that every broken thing in the project is the session's
  to fix, to put on a card, or to ask João about, whoever caused it. Its failure is
  **dismissal**: a defect the session saw that sits in no commit, on no card, and in
  no ask.
