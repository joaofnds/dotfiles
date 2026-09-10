---
name: review
description: Sends each product a task made to the review skill that owns it. Use it when a task's work is finished and before anything is called done.
---

# Review

List the changed files and read the card record with its attached documents before
judging any product, since a product classified from memory lands in no review or
in two. Send each product to the first line below that names it:

- A corpus import and a process defect were reviewed inside absorb and kaizen,
  which run their own unprimed pass, and get no second one here.
- Any other instruction file goes to review-instructions: a CLAUDE.md, AGENTS.md, or
  GEMINI.md, a rules file, a skill, an agent definition, an output style, a slash
  command, and a hook that injects instruction text.
- Any other code or configuration goes to review-code.
- Any other document goes to review-docs. A work
  product stays a document however imperative it reads, so a shaped task, a plan,
  or a diagnosis goes there and never to review-instructions. A task that only
  shaped a card has no diff and still produced a document, the record it wrote,
  and sends that there.
- A decision with no document goes to adversarial-review.

A mixed change runs each review its products need. Run each destination skill,
and note in the record which skill reviewed each product.
