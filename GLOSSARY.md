# Glossary

Terms of this repository's domain, in the words this project uses for them. Add a
term when you introduce or lean on one, one term per concept.

- **Corpus**: the instruction files this repository renders for agents: the global
  instructions, the rules, skills, agent definitions, output styles.
- **Rules**: the craft knowledge under `~/.agents/rulebook/`: production, coding
  style, engineering judgment, coupling, testing, the refactoring pass and catalog,
  the wikis, the board, ownership, continuous improvement. The source for that knowledge. The global instructions
  compress it and the skills route to it.
- **Reply**: the final message of a turn, and the only part of it reliably read.
- **Brief**: the reply cut to what can be acted on, in the register the brief output
  style sets.
- **Record**: where the detail of the work lives when it leaves the reply: the commit,
  the card, or the document.
- **Handoff**: the record on a card that lets a fresh session continue the work cold.
  Build writes one when a task finishes. The relay skill writes one when a session
  stops partway, covering the whole session rather than the phase.
- **Position**: where the work stands now. Its opposite is the **story**, the account
  of how it got there.
- **Closed finding**: fixed, verified, and needing no decision. An **open finding**
  needs a decision, carries a risk, or waits on an answer.
- **Entry point**: the review skill, the one a session runs when a task's work is
  finished. It sends each product to its reviewer and runs no review itself.
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
  column's skill. Rehearse uses the same word.
- **Run**: one card carried through its stages until Done, an open question, or a
  guard.
- **Runner**: the script outside the harness that starts each stage's session, reads
  the card between stages, and applies the guards.
- **Held card**: a card in Build or Review with an assignee, belonging to the session
  that set it. Another session may add a note and never changes its status.
- **Inbox**: captured observations and proposed work awaiting an admission decision.
- **Admission**: acceptance of an outcome and its scope into the delivery queue,
  recorded from a typed direction or an explicitly delegated policy.
- **Intake**: screening incoming work and returning deferrals against evidence and
  the goal, with proposed admissions presented as one batch.
- **Deferred work**: work withheld from execution until reconsideration, with a
  recorded next check date and, where relevant, an observable return event.
- **Goal**: what a board's open work is judged against, stated in `backlog/PRIORITY.md`. Triage orders the queue by it and reflect judges each increment against it.
  Changing it is a decision the loop does not make for itself.
- **Milestone**: one increment of the goal, named by what becomes possible when it
  is Done, holding only the cards that produce it. A board carries several, explicitly ordered
  in `backlog/PRIORITY.md`, which names the current one. Due dates record deadlines.
- **Iteration**: one accepted card carried through its required stages by a
  supervisor. Intake, selection, and reflection are separate activities.
- **Reflection doc**: the dated doc the reflect step leaves on the board, through the
  backlog CLI: the Coaching Kata's five questions answered, one verdict on the goal
  (on track, adjust, or pivot), proposed planning changes, and kaizen candidates.
  Reflect proposes; the next triage applies.
- **Bet**: a planning commitment to a card, with what will be observable about the
  goal when it is Done and the budget it gets. Triage records it and reflect judges
  against it.
- **Pick**: selection of the next card, informed by triage's recommendation or a
  direct decision. The iterate invocation names that card.
- **Ownership**: the stance that every broken thing in the project is the session's
  to fix, to put on a card, or to ask about, whoever caused it. Its failure is
  **dismissal**: a defect the session saw that sits in no commit, on no card, and in
  no ask.
