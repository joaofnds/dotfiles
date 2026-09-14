---
name: visual-diff
disable-model-invocation: true
description: Reviews frontend commits or commit ranges with before/after screenshots, image diffs, and steps to try the changed screens. Runs only when explicitly invoked. Reviewing the code of the change is review-code.
---

# Visual diff

## Find the affected screens

Resolve a single commit to its first parent and itself. For `A..B`, compare the trees at `A` and `B`. Review those revisions even when the current checkout has other changes.

Read the diff and trace changed components, styles, and assets to their routes and callers. Choose the smallest set of screens and states that shows the distinct visual changes. For shared styles or components, sample representative callers and name those left unreviewed. Add responsive sizes or interaction states where the diff can change their appearance.

Record each affected surface as captured, represented by another capture, or blocked. Name changes with no rendered effect and why they need no screenshot. When none affect rendering, report that and finish without starting the app.

## Capture before and after

Use the project's existing app setup, fixtures, and browser tools. Run the two revisions from separate temporary checkouts without changing the active checkout. Reuse the capture sequence for both.

Start review servers in tool-managed sessions when available so they can be stopped through the returned handles.

Match the browser, viewport, pixel scale, route, scroll position, account role, data, and feature settings within each pair. Use stable test data and safe test accounts. Keep credentials and private data out of the review bundle. Wait for fonts, assets, and the target state to settle. Disable unrelated animation and mask unrelated live content consistently.

Capture a viewport with enough surrounding UI to locate the change. Use the same framing on both sides so page-height changes do not produce different image dimensions. Add a matched crop when a small change is hard to see, keeping the context screenshots too.

For a new or removed screen or state, capture the nearest meaningful predecessor or successor and explain the mismatch. Report startup, authentication, or data blockers against the affected surface and continue with the others.

Save the bundle in an existing ignored scratch directory, checked with `git check-ignore`, or in a temporary directory outside the repository.

## Make the diff

Use the repository's image-diff tool if it already produces a readable changed-pixel image. Otherwise run this skill's helper by its absolute path:

```bash
bash "<skill-directory>/scripts/image_diff.sh" \
  "<bundle>/before/01-screen.png" \
  "<bundle>/after/01-screen.png" \
  "<bundle>/diff/01-screen.png"
```

Keep the helper's default threshold unless rendering noise obscures the change, and report any override. If no diff tool is available, deliver the screenshots and name the missing diff.

Open each available before, after, and diff image. Check that they show the intended state and that the highlighted areas correspond to visible differences. Correct avoidable capture mismatches before describing the result, and report unavoidable ones as limitations. A changed region locates a difference, but does not establish that it is a defect.

## Guide the review

Write the review from [assets/review-template.md](assets/review-template.md). Give each capture a precise landmark and a concrete thing to inspect, such as whether the bottom-right Save button stays visible when the form grows. Screenshots alone support no functional claim, so separate what you observed from what you suggest the reader check. Link the report and the most useful available screenshot pair and diff in the reply.

Stop servers through their returned session handles, and report any that cannot be stopped that way. Preserve the bundle and temporary checkouts so the review can be reopened.
