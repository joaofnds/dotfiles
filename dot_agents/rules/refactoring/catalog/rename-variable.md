# Rename Variable

**Smells:** Mysterious Name
**Inverse:** none
**Improves:** readability: the name answers the question the reader would otherwise chase through the code

## When to apply

- The name requires decoding: single letters outside tiny scopes, abbreviations that
  are not universal, or names describing the type (`str`, `arr`) instead of the
  meaning.
- The name is stale: the variable's purpose drifted during earlier edits and the name
  reports what it used to hold.
- Your own understanding just improved: you finally worked out what this value *is*.
  Renaming immediately is how that understanding gets persisted instead of lost.
- The wider the scope, the more the name matters: module-level and exported names
  deserve the most care.

## When not to apply

- Idiomatic short names in tight scopes: `i` in a three-line loop, `e` in a one-line
  handler, the conventional `_` for ignored values. Expanding these fights the
  language's idiom without informing anyone.
- The rename is taste, not clarity. A different-but-not-better name spends review
  attention and history noise for nothing.

## Mechanics

1. Establish the variable's scope; for module-level or exported names, find every
   reference (including dynamic ones: string keys, serialization).
2. Rename declaration and references in one pass for local scope; for wide scope,
   introduce the new name alongside, migrate references, then delete the old.
3. Run the tests. For a persisted or serialized name, the boundary translation changes
   with it; treat that as part of this edit, not a surprise for later.

## Example

Before: the reader must run the expression to learn what `x` is:

```js
const x = subs.filter((s) => s.expires - now() < WEEK);
for (const s of x) sendRenewalOffer(s);
```

After:

```js
const expiringSoon = subs.filter((s) => s.expires - now() < WEEK);
for (const sub of expiringSoon) sendRenewalOffer(sub);
```

## House-rule interactions

- `coding-style.md`: move understanding from your head into the code: "renaming
  ... is how the persistence happens." This refactoring is that rule's primary verb.
- `coding-style.md`: comments default to zero, and a clearer name is move 1 of the
  three moves to exhaust before writing one; many comments are renames in disguise.
- `coding-style.md`: preserve established idioms: the rule that protects `i`, `e`,
  and the codebase's existing conventions from well-meaning expansion.
