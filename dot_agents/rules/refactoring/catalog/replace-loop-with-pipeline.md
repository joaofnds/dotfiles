# Replace Loop with Pipeline

**Smells:** Loops
**Inverse:** none
**Improves:** readability — the transformation reads as named stages instead of accumulated bookkeeping

## When to apply

- The loop is a disguised filter, map, or both: it walks a collection, skips some
  items, transforms others, and collects results. A pipeline states those stages
  directly — each stage says what survives or what it becomes.
- The loop's control variables (index, accumulator array, found-flag) exist only to
  simulate what pipeline operations do natively.
- Follow-up pressure helps decide: pipelines compose with Extract Function per stage,
  and stages can be reordered or removed as single edits.

## When not to apply

- The translation needs contortions — carrying multi-value state through `reduce`,
  index gymnastics across stages, side effects buried in a `map`. A pipeline that must
  be decoded is worse than the loop it replaced; the house's boring-control-flow rule
  decides against it.
- The loop early-exits on a condition pipelines express poorly in this codebase's
  idiom, or interleaves side effects with transformation (write the side effect as a
  loop; pipeline the pure part).
- Measured hot paths where the intermediate collections are a demonstrated cost.

## Mechanics

1. Create a variable for the loop's source collection.
2. Migrate one behavior at a time from the loop's top into a pipeline stage on that
   variable — each skip becomes a `filter`, each derivation a `map`. Run the tests
   after each stage.
3. When the loop body is empty, delete it and assign or return the pipeline's result.

## Example

Before — bookkeeping obscures a two-stage transformation:

```js
const names = [];
for (const member of members) {
  if (member.active) {
    names.push(member.name.toUpperCase());
  }
}
```

After:

```js
const names = members
  .filter((m) => m.active)
  .map((m) => m.name.toUpperCase());
```

## House-rule interactions

- `coding_style.md` — boring control flow cuts both ways: it prefers a plain
  pipeline over loop bookkeeping, and a plain loop over a clever pipeline. The rule
  outranks any preference for functional style — if the pipeline needs a comment, the
  loop wins.
- `coding_style.md` — Beck's ordering: the pipeline wins only on reveals-intent;
  when a colleague would read the loop faster, the refactoring has no purchase.
