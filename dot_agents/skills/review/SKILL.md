---
name: review
description: Sends each product a task made to the review skill that owns it. Use it when a task's work is finished and before anything is called done.
---

# Review

List the changed files and read the card record with its attached documents before
judging any product, since a product classified from memory lands in no review or
in two. A corpus import and a process defect were reviewed inside absorb and
kaizen, which run their own unprimed pass, and get no second one here.

Send every other product to the first line below that names it:

- An instruction file goes to review-instructions: a CLAUDE.md, AGENTS.md, or
  GEMINI.md, a rules file, a skill, an agent definition, an output style, a slash
  command, and a hook that injects instruction text.
- Any other code or configuration goes to review-code.
- Any other document goes to review-docs, including shaped tasks, plans, and
  diagnoses, however imperative their prose. Send instruction text embedded for
  later use to review-instructions as well, since that text will govern agents.
- A decision with no document goes to adversarial-review.

A mixed change runs each review its products need. Run each destination skill, and
note in the record which skill reviewed each product.
