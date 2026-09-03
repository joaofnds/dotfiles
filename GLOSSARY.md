# Glossary

Terms of this repository's domain, in the words João uses for them. Add a term when
you introduce or lean on one; one term per concept.

- **Corpus**: the instruction files this repository renders for agents: the global
  instructions, skills, agent definitions, output styles.
- **Reply**: the final message of a turn, the only text João reliably reads.
- **Brief**: the reply cut to what João can act on, in the register the brief output
  style sets.
- **Record**: where the detail of the work lives when it leaves the reply: the commit,
  the card, or the document.
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
