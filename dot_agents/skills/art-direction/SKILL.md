---
name: art-direction
description: Develops a visual direction for new or substantially redesigned interface work, deciding palette, typography, layout, and the one element the page is remembered by, and checking each choice against the defaults a model reaches for unprompted. Use when the work opens a visual direction. A scoped fix inside an established system follows the style skill's frontend rules instead.
---

# Art direction

Work as the design lead of a studio whose clients come for an identity that could not
be mistaken for anyone else's. This one has already rejected proposals that felt
templated. Make choices specific to this brief, and take one real risk you can defend.

The style skill's frontend file owns the floor: the tokens, the spacing scale, the
icon set, the component primitives, the accessibility rules, the breakpoints. This
skill decides taste and that file decides correctness, so do not relitigate it here.

This skill's name stays distinct from any bundled skill covering the same ground,
because a settings override matches on the name and a shared name would let one
entry disable this copy. The review-instructions skill's external-facts reference
records the behavior under Harness mechanics.

## Ground it in the subject

Where the brief does not pin down the product, the audience, and the page's single
job, ask for what is missing. Do not invent product scope. The subject's own
materials, its instruments and its vocabulary, are what make a direction specific
rather than plausible.

## The choices

Open with the most characteristic thing in the subject's world, in whatever form
suits it: a headline, an image, a live demonstration, a moment of motion. A large
number with a small label over a gradient is the template answer, and it is only
right where it is genuinely the best one.

Pair display and body faces deliberately, not the pair you would reach for on any
other project, and set a scale with intentional weights and spacing. The type
treatment is part of the design rather than a neutral vehicle for the words.

Numbering, eyebrows, dividers, and labels say something true about the content.
Numbered markers belong on a real sequence and nowhere else.

Use one orchestrated moment of motion rather than effects scattered across the page.
Scattered animation is itself a tell.

A maximalist direction needs elaborate execution. A minimal one needs precision in
spacing, type, and detail.

Generic words make a design feel as templated as generic type does. Read
[references/writing.md](references/writing.md) before writing interface copy, and
skip it where the brief supplies the final words and you are only setting them.

## The defaults to design against

Machine-generated design clusters, and the clusters arrive whatever the subject is,
which makes them defaults rather than choices. One is editorial: a warm cream ground
with a high-contrast serif and a terracotta accent, or near-black with a single acid
accent, or a broadsheet of hairline rules and dense columns. The other is the template
software look, and it is where this stack lands unsteered: one geometric sans
throughout, a purple-to-blue gradient hero, rounded cards in a three-column grid,
everything centered, untouched component-library grays, icons as decoration, and an
aspirational headline with no object.

The component library the frontend rules prescribe is the right floor, and its defaults
are not a direction.

Where the brief names a direction, follow it exactly, including when it asks for one of
these looks. Where it leaves an axis free, spend that freedom on something else.

These clusters are observation rather than measurement. Look again on a model change,
or when a design you did not steer lands outside both.

## How to work

Draft a compact plan first: four to six named colors, the faces for display, body, and
any utility role, a layout concept in a sentence and a rough sketch, and the single
element the page will be remembered by.

Then review that plan against the brief before building anything. Revise any choice
that would suit an unrelated subject, and any choice that landed in a cluster above
without the brief asking for it.

## Write the direction down, and get it ratified

Write the direction as a document on the feature's card, by the board skill's route.
A direction that exists only in this conversation is gone when the session ends, and
a later session reads files rather than chat.

It carries its status, draft until João approves it and the date of his approval
after, so a later session can tell a proposal from a constraint. It carries the
subject, its audience, and the page's single job. It carries the tokens: the palette's
values, the type roles and their families, the layout concept, the signature element.
It carries the directions you considered and dropped, each with its reason. And it
carries a running log of what was tried across passes, appended as you go, so the next
pass reads it instead of rediscovering the same dead end.

Show João the tokens and the signature, and ask for an explicit go-ahead. Keep the
low-value iteration to yourself. An implementation task then builds from that document
and derives every color and type decision from its tokens.

## Verify what you built

Rereading your own code and concluding it matches the plan proves nothing. Render it
and look.

Serve the page and capture it at desktop width and at the narrowest width the frontend
rules require. Read each capture against the document's tokens, one line at a time. A
palette value that never appears, a display face that silently fell back, a signature
element that reads as ordinary: each is a defect rather than a nuance. Then walk the
page against the frontend accessibility rules, particularly the ones a palette or a
signature element can break: color carrying meaning alone, an icon-only control with
no accessible name, a hit target too small.

Fix what the captures show, then capture again. Where you cannot render in this
environment, say so plainly and mark the direction unverified. Never report visual
work as done on the strength of the code alone.

## Spend the boldness once

Let the signature element be the one memorable thing, keep what surrounds it quiet and
disciplined, and cut any decoration that does not serve the brief.
