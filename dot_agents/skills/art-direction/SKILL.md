---
name: art-direction
description: Develop or implement a distinctive visual direction for new or substantially redesigned UI.
---

<!-- Vendored from Anthropic's frontend-design skill; owned copy, local edits win on
     re-sync. Keep this name distinct from the upstream skill's: skillOverrides keys
     match by name (`instruction-external-facts.md` §Harness mechanics), so sharing it would let "frontend-design": "off" disable this copy. -->

# Art Direction

**Wrong skill if:** the change is a scoped fix, or the work must preserve an established visual system → follow `coding-style-frontend.md` and open no new direction.

Approach this as the design lead at a small studio known for giving every client a visual identity that could not be mistaken for anyone else's. This client has already rejected proposals that felt templated, and is paying for a distinctive point of view: make deliberate, opinionated choices about palette, typography, and layout that are specific to this brief, and take one real aesthetic risk you can justify.

`coding-style-frontend.md` owns the convention floor: tokens, spacing scale, icon set,
component primitives, the accessibility floor, responsive breakpoints. Don't restate it
here and don't relitigate it: this skill decides taste, that file decides correctness.

## Ground it in the subject

If the brief does not pin down the product, audience, and page's single job, ask for the
missing requirement or route a broad goal to `/discuss`. Do not invent product scope.
Use confirmed user preferences and the subject's own materials, instruments, artifacts,
and vernacular to make the visual direction specific.

## Design principles

For web designs, the hero is a thesis. Open with the most characteristic thing in the subject's world, in whatever form makes sense for it: a headline, an image, an animation, a live demo, an interactive moment. Be deliberate with your choice: a big number with a small label, supporting stats, and a gradient accent is the template answer, only use if that's truly the best option.

Typography carries the personality of the page. Pair the display and body faces deliberately, not the same families you would reach for on any other project, and set a clear type scale with intentional weights, widths, and spacing. Make the type treatment itself a memorable part of the design, not a neutral delivery vehicle for the content.

Structure is information. Structural devices, numbering, eyebrows, dividers, labels, should encode something true about the content, not decorate it. Many generic designs use numbered markers (01 / 02 / 03), but that's only appropriate if the content actually is a sequence - like a real process or a typed timeline where order carries information the reader needs. Question if choices like numbered markers actually make sense before incorporating them.

Leverage motion deliberately. Think about where and if animation can serve the subject: a page-load sequence, a scroll-triggered reveal, hover micro-interactions, ambient atmosphere. An orchestrated moment usually lands harder than scattered effects; choose what the direction calls for. Scattered extra animation is itself a tell that the design was AI-generated.

Match complexity to the vision. Maximalist directions need elaborate execution; minimal directions need precision in spacing, type, and detail.

Copy is design material, and generic copy makes a design feel as templated as generic type
does. **When the work involves writing or revising interface copy, labels, headlines, empty
states, errors, button text, read `~/.agents/skills/art-direction/references/writing.md`
before writing it. Skip it when the brief supplies final copy and you're only setting it.**

## Calibration: what the defaults look like right now

AI-generated design clusters around two families. Both are legitimate for some briefs, but
they arrive regardless of subject, so they are defaults rather than choices.

**The editorial cluster**: (1) a warm cream background (near #F4F1EA) with a high-contrast serif display and a terracotta accent; (2) a near-black background with a single bright acid-green or vermilion accent; (3) a broadsheet-style layout with hairline rules, zero border-radius, and dense newspaper-like columns.

**The SaaS-template cluster**, and the one our own stack falls into by default: Inter or
Poppins throughout, a purple-to-blue gradient hero, `rounded-2xl` cards in a three-column
feature grid, centered everything, untouched shadcn grays and default-state buttons, Lucide
icons used as decoration, a vague aspirational headline. Reaching for shadcn/ui and Tailwind,
which `coding-style-frontend.md` prescribes, puts you one step from this look. Those
components are the right floor; their defaults are not a direction.

*(Both lists are calibration by observation, not measurement, against Opus 5 /
Fable 5 defaults. Re-look on a
model swap, or when a design you didn't steer lands outside both clusters.)*

Where the brief pins down a visual direction, follow it exactly: the brief's own words always win, including when it asks for one of these looks. Where it leaves an axis free, don't spend that freedom on a default.

## Process: brainstorm, critique, ratify

Work in two passes. First, brainstorm a short design plan based on the human's design brief: create a compact token system with color, type, layout, and signature. Color: describe the palette as 4–6 named hex values. Type: the typefaces for 2+ roles (a characterful display face that's used with restraint, a complementary body face, and a utility face for captions or data if needed). Layout: a layout concept, using one-sentence prose descriptions and ASCII wireframes to ideate and compare. Signature: the single unique element this page will be remembered by that embodies the brief in an appropriate way.

Then review that plan against the brief. Revise any choice that could fit an unrelated
subject, and any choice that landed in a cluster above without the brief asking for it.

**Write the direction to a file, then get it ratified.** Write it with **Status**
`Draft`, show the user the tokens and the signature, and ask for an explicit go-ahead;
on their go-ahead change **Status** to `Ratified YYYY-MM-DD`. Keep low-value iteration
private. A direction that exists only in this conversation is lost at the context
boundary, and `/plan` cites files, not chat.

Write the direction as a doc titled "<feature> design" and attach it with `--doc` to the feature's card;
given no card, create one in the column matching the work's stage. Six headings:

- **Status**: `Ratified YYYY-MM-DD`, or `Draft` when the user hasn't approved it. `/plan` and `/build` treat a `Draft` as a proposal, not a constraint.
- **Subject**: the concrete subject, its audience, the page's single job.
- **Tokens**: the palette hex values, the type roles and families, the layout concept, the signature element.
- **Rejected**: directions considered and dropped, each with the reason.
- **Tried**: a running log across passes: what was built, what didn't work, what not to retry.
- **Verify**: copy the three checks below into the file verbatim, so the building session inherits them.

During an authorized implementation task, build from that file and derive every color and
type decision from its tokens.

## Verify what you built

Self-agreement is not verification: rereading your own code and concluding it matches the
plan proves nothing. Render it and look:

1. Serve the page and screenshot it, at desktop width and at 320px.
2. Read each screenshot against the file's **Tokens** section, one line at a time. A palette value that never appears, a display face that silently fell back, a signature element that reads as ordinary; each is a defect, not a nuance.
3. Walk the page against `coding-style-frontend.md` §6 in full: visible focus and reduced motion, plus the items a palette or a signature element can break: color as the sole carrier of meaning, accessible names on icon-only controls, hit-target size.

Fix what the screenshots show, then re-shoot. **If you cannot render in this environment,
say so plainly and mark the direction unverified**; never report visual work as done on the
strength of the code alone.

## Restraint and self-critique

Spend your boldness in one place. Let the signature element be the one memorable thing, keep everything around it quiet and disciplined, and cut any decoration that does not serve the brief. Append what you tried to the file's **Tried** section as you go, so a later pass reads it instead of rediscovering the same dead end.
