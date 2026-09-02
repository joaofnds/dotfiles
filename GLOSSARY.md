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
- **Independent review**: a review whose reader is unprimed, which the `reviewer`
  agent's fresh context supplies. Independence is a property of that context, never
  of a further session: the session running the `review` skill is the review, and it
  owns the verdict, the fixes, and their verification.
- **Fire**: one use of /brief on a reply; the signal that the reply failed.
- **Replay**: the probe that forks a real transcript just before a fired reply and
  regenerates that reply under a style variant (doc-4).
