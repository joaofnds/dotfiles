# Remove Flag Argument

**Smells:** Mysterious Name, Long Parameter List
**Inverse:** none
**Improves:** readability: the call site says which behavior it wants instead of encoding it as a bare literal

## When to apply

- Callers pass a literal boolean (or a mode string) that selects which behavior the
  function performs: `book(customer, true)`. The call site is unreadable without the
  signature, and the function interior branches on the flag from top to bottom.
  Explicit functions per behavior fix both.
- The flag fans out: it is passed down through layers so some inner function can
  branch on it; every layer's signature carries a bit only the bottom uses.
- More than one flag multiplies variants, `send(msg, true, false)`, a combinatorial
  sign the function is several functions sharing a name.

## When not to apply

- The boolean is *data*, not a mode switch: it flows from the caller's own input
  (`isPremium` read off the account) rather than being a literal decision at the call
  site. Fowler's razor: a flag chosen as a literal by the caller is a mode; a value
  computed from state is data.
- The set of behaviors is open-ended or caller-composed: explicit functions per
  combination would explode; a typed options object states each choice by name
  instead.

## Mechanics

1. Create one explicit function per flag value; implement them by delegating to the
   original with the flag fixed (or use Decompose Conditional to split its body).
2. Migrate every caller that passes a literal to the matching explicit function,
   testing as you go.
3. When no literal-passing callers remain, restrict or remove the flagged original;
   callers that pass computed values may keep a (renamed, documented) variant: per
   "When not to apply," theirs was never a flag.

## Example

Before: what does `true` do?

```js
reserveSeat(passenger, true);

function reserveSeat(passenger, isPremium) {
  if (isPremium) assignCabin(passenger, "front");
  else assignCabin(passenger, "standard");
}
```

After:

```js
reservePremiumSeat(passenger);

function reservePremiumSeat(p) { assignCabin(p, "front"); }
function reserveStandardSeat(p) { assignCabin(p, "standard"); }
```

## House-rule interactions

- `coding_style.md`: comments default to zero: `book(customer, true /* premium */)`
  is the flag argument confessing; the explicit function name replaces the comment.
- `coding_style.md`: leverage the type system: where variants must stay one
  entry point, a union of named option values beats a bare boolean: the compiler
  then documents and checks what `true` never could.
