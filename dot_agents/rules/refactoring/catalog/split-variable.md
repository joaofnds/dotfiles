# Split Variable

**Smells:** Mutable Data
**Inverse:** none
**Improves:** readability: one name means one thing for its whole life

## When to apply

- A variable is assigned more than once for more than one purpose: first it holds the
  raw input, later the scaled result, later the formatted string. Each purpose deserves
  its own name, and each name can then be `const`.
- A parameter is reassigned inside the function body; readers checking the call site
  can no longer trust what the name refers to below the reassignment.
- A temp does double duty across two phases of a computation, often the same signal
  that Split Phase reads at larger scale.

## When not to apply

- The variable is a collecting variable: an accumulator in a loop, a string being
  built up. Repeated assignment *is* its single purpose; splitting it would be
  nonsense.
- The reassignment implements an algorithm's genuine state evolution (a `current`
  pointer walking a structure). One purpose, changing value: leave it.

## Mechanics

1. Rename the variable at its declaration and first assignment to a name for that
   first purpose; declare it `const`.
2. Update references up to (not past) the second assignment. Run the tests.
3. At the second assignment, declare a fresh variable named for the second purpose.
4. Repeat until every assignment starts a new, single-purpose variable.

## Example

Before: `size` means three different things:

```js
let size = files.reduce((s, f) => s + f.bytes, 0);
size = size / 1024;
size = `${size.toFixed(1)} KB`;
display(size);
```

After:

```js
const totalBytes = files.reduce((s, f) => s + f.bytes, 0);
const totalKb = totalBytes / 1024;
const label = `${totalKb.toFixed(1)} KB`;
display(label);
```

## House-rule interactions

- `coding_style.md`: move understanding from your head into the code: tracking
  which meaning a reused variable currently holds is exactly the volatile head-state
  that renaming into distinct constants persists.
- `coding_style.md`: Beck's ordering: three honest names beat one lying name on
  reveals-intent; the extra declarations are elements well spent.
