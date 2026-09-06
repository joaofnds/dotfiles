---
name: review
description: Sends each product a task made to the review skill that owns it. Use it when a task's work is finished and before anything is called done, and whenever João asks for a review.
---

# Review

List the changed files and read the card record with its attached documents before
judging any product, since a product classified from memory lands in no review or
in two. Send each product to the first line below that names it:

- A corpus import goes to absorb and a process defect to kaizen.
- Any other instruction file goes to review-instructions: a CLAUDE.md, AGENTS.md, or
  GEMINI.md, a rules file, a skill, an agent definition, an output style, a slash
  command, and a hook that injects instruction text.
- Any other code or configuration goes to review-code.
- Everything else, a document or a decision, goes to adversarial-review. A work
  product stays a document however imperative it reads, so a shaped task, a plan,
  or a diagnosis goes there and never to review-instructions. A task that only
  shaped a card has no diff and still produced a document, the record it wrote,
  and sends that there.

A mixed change runs each review its products need, and each destination runs its
own unprimed pass. Run each destination skill, and note on the card's record which
skill reviewed each product.
