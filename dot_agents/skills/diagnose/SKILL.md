---
name: diagnose
description: Writes the durable diagnosis document for a defect whose investigation has ended, carrying the cause, the evidence, the causal chain, and what was ruled out, for a reader with no memory of the session. It reads the code and proposes no fix. Use when a cause needs to survive the session as a document others will read. A cause still being chased belongs to debug, which records its own result on the card, and pausing that chase mid-flight is handoff.
---

# Diagnose

The reader has no memory of this session, so the document alone has to carry the
defect. Debug records its result on the card as it goes. This skill runs when that
result needs to be a document: a cause others will read, a defect handed to another
team, an investigation whose evidence is worth keeping.

## Describe the cause, not the remedy

Say what is broken and why, including what is absent and what was already tried.
Naming the fix is the next session's work, and a precise cause narrows the fix space
by itself, which is not permission to pick the fix. Never propose a fix, and never
rate one against another.

This skill only reads the code it diagnoses. Repairing what you were sent to explain
leaves the next reader a cause that no longer matches the code.

Write "the configuration loads before the environment file is regenerated, so the path
is empty." Do not write "so load the configuration lazily."

## Ground every claim

Re-read each path and line against the code before you write it. A confident wrong
cause sends the next session into the wrong file. Where the cause is not established,
say so, give the leading hypothesis, and say what observation would confirm it. Mark
every finding as confirmed or as hypothesis, and never let the two blur.

## What the document holds

The defect, its impact, and the commit and branch it was diagnosed against.

Per finding: the symptom with its evidence, a path and line, a command's output, a
failing test; the chain from symptom to cause, each step naming why the one above it
happened, down to the step whose fix would remove every symptom listed; the principle
it broke, where one applies; what was tried and ruled out; and how confident you are.

What is still unknown that the fix will have to settle.

Inline the evidence. An issue, a commit, or an earlier document goes by path or URL
rather than restated, since a copy of it here goes stale where the original does not.
Write no "as we discussed", since the reader was not there. Keep secrets and personal
data out. Where the session's own conclusion now looks wrong to you, say that rather
than writing it forward as settled.

## Before it is done

Run the adversarial-review skill against the reproduction, the causal chain, the
ruled-out causes, and every confirmed-versus-hypothesis label. A finding that breaks
the cause reopens the investigation. Do not write around it.

Attach the document to the defect's card, creating one where none exists.
