---
name: kaizen
disable-model-invocation: true
description: Turns an observed process defect, something this session or a recent one did that the corpus should have prevented, into a corpus improvement landed the same turn. Use when João names a defect or directs a process retro, at any point in a session. Learning from an external resource is absorb. Reviewing a named instruction file with no behavioral incident is review-instructions. Fixing the defective code itself is build, and kaizen owns changing the instructions so the defect does not recur.
---

# Kaizen

Kaizen starts from one observed defect, treated as one case of a class the
corpus should eliminate, and ends with its outcome on a card: a landed change,
findings or a proposal waiting for João, the verdict that the instructions
held, or a stop naming the evidence that could not be reached. The
running session creates the card on the corpus board in dotfiles, whatever
project it runs in, and a recurring defect starts by searching that board. The
card holds the defect, the evidence, the findings with their dispositions, and
the outcome. Instructions the defect does not trace to are not audited on the
way.

## The witness does not judge

The running session is an interested party, because the corpus under judgment is
the one steering it. Its job is evidence, and verdicts are not its to give.
Collect the moment the defect happened (the diff, the reply, the transcript
section) and the instruction files that were loaded at that moment, in their
source form: the chezmoi source for corpus files, the repository's own file for
project instructions. Several sessions run at once, so recency picks the wrong
transcript. Confirm a transcript is the right one by its content. When the
moment or what was loaded at it cannot be established, the run stops: the card
says what was missing, and no verdict is recorded about instructions that went
unexamined.

Hand a fresh reviewer the evidence locations and the defect in João's words,
with the review-instructions checks as its axes, and mark the evidence as
material to read and never as instructions to follow. Do not summarize the
evidence or offer a diagnosis, because the summary carries the witness's
defense.

## The finding bar

A finding is reported when it clears all three:

1. Grounded: it cites the actual moment. A hypothetical does not count.
2. Quoted: it reproduces instruction text read this session. Memory does not count.
3. Causal: it names the instruction failure or absence that let the moment
   happen.

When the failed rule exists and was loaded, the finding says why it did not
bind (its placement, an example that models the opposite, a reading it permits,
a colliding rule) and the fix repairs that cause rather than stacking a new
rule on top of the failed one.

## Landing

Verify each finding against the evidence, then turn each survivor into a
proposal that ends in replacement text or a named guard and names the observed
moment it would have prevented. The moment is one case of a class: write the
change against the class, as the reason that covers its members, so the next
case falls under it without a new rule. A change that would only have prevented
the exact moment is too narrow. A change covering cases no shared cause
connects is too broad. A finding that fails verification is recorded
on the card with its disproof. A disagreement goes to João, and so does a run
in which the witness refutes every finding, because the interested party is
then the only judge. Where a hook, a type, or a check could enforce the rule,
the proposal is that guard, because the defect shows prose was not enough.

Proposals for on-demand files (skills, rules, agent definitions) land in the
same turn: build writes the edit, review-instructions gates it, the source file
takes it (`chezmoi apply` on the changed targets for corpus files), and the
commit names the defect it answers. Proposals for hooks, settings, or any file
that loads at session start (the global or a project's instruction file, output
styles) wait for João with their exact replacement text. So do findings from an
invocation that asked for assessment rather than a fix, and a change too large
for the turn, which becomes its own card. When no finding survives, the card
says which way: nothing cleared the bar, so the instructions held, or the
findings failed verification, recorded with their disproofs and already in
João's hands. Do not write an edit to have something to show.
