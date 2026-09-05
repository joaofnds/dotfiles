# Replace Exception with Precheck

**Smells:** Duplicated Code
**Inverse:** none
**Improves:** readability: an expected condition reads as a decision, not as recovered failure

## When to apply

- Callers catch an exception for a condition they could have tested first, and the
  same try/catch appears wherever the call is made. Exceptions are for the
  exceptional; using one as an expected branch makes every reader ask what *actually*
  failed, and scatters catch-boilerplate that a plain check retires.
- The callee offers (or can offer) a cheap, race-free way to ask before acting:
  a `has`/`can`/`isAvailable` query, a bounds check, a lookup with a default.
- The catch block implements business logic: the "error" path is really a normal
  path wearing exception clothes.

## When not to apply

- The check-then-act pair would race: filesystem, network, concurrent state can
  change between the test and the action. There, attempting and handling the failure
  is the *correct* pattern; the precheck would add a lie about safety.
- The condition truly is exceptional: rare, unforeseeable, unactionable locally.
  Converting genuine failure paths into prechecks litters main-line code with
  handling for things that never happen (the mirror image of this refactoring:
  Replace Error Code with Exception).
- No test the caller can run is cheaper or clearer than handling the outcome.

## Mechanics

1. Identify or create the query that answers what the catch was discovering.
2. At one call site, add the precheck and put the catch block's logic in its branch;
   keep the try/catch temporarily. Run the tests.
3. Remove the try/catch: the exception path should now be unreachable there; if the
   callee throws for other reasons, let those propagate as real failures.
4. Repeat per call site.

## Example

Before: a full pool is an expected Tuesday, not a failure:

```js
let conn;
try {
  conn = pool.acquire();
} catch (e) {
  conn = createStandaloneConnection();
}
```

After:

```js
const conn = pool.hasAvailable()
  ? pool.acquire()
  : createStandaloneConnection();
```

## House-rule interactions

- `coding-style.md`: boring control flow: an expected branch dressed as
  exception handling is control flow by clever mechanism; the precheck restores the
  plain `if`.
- `coding-style.md`: defensive networking still governs the racy cases: for
  remote or concurrent resources, bounded attempts with failure translation remain
  correct, per "When not to apply."
