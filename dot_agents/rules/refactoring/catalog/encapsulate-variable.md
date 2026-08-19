# Encapsulate Variable

**Smells:** Global Data, Mutable Data
**Inverse:** none
**Improves:** maintainability: every access runs through a function, giving one point to observe, validate, or redirect

## When to apply

- Widely-accessed mutable data needs to move, change shape, or gain validation. Data
  cannot be refactored in place the way functions can (no delegating stub), so the
  move starts by wrapping access; then the data can migrate behind the functions.
- Module-level mutable state is read and written from many places; wrapping it makes
  every touch visible, greppable, and interceptable (logging a rogue write is one
  edit).
- You want to narrow update rights: expose a getter widely, keep the setter close.

## When not to apply

- Immutable data needs none of this: a frozen exported constant can be copied and
  referenced freely; wrapping it adds ceremony with nothing to guard.
- The variable is local to a function or small scope. Encapsulation earns its
  indirection with reach; a local temp has none.

## Mechanics

1. Write a getter and, if writes are legitimate, a setter for the variable.
2. Replace each direct reference with the function calls, testing as you go.
3. Restrict direct access: module-privatize the variable so the compiler or module
   system rejects stragglers.
4. Consider having the getter return a copy or frozen view when callers must not
   mutate the innards through the reference.

## Example

Before: anyone can reassign or mutate the config from anywhere:

```js
export let config = { retries: 3, baseUrl: "https://api.example.com" };
```

After: reads are copies; updates go through one door:

```js
let config = { retries: 3, baseUrl: "https://api.example.com" };

export function getConfig() {
  return { ...config };
}
export function updateConfig(patch) {
  config = { ...config, ...patch };
}
```

## House-rule interactions

- `coding_style.md`: inject side-effecting or replaceable dependencies:
  encapsulation is the way station, not the destination. Once access runs through
  functions, prefer passing the value or an interface into the consumers that need it
  over leaving them to reach for the module.
- `engineering_judgment.md`: narrows future bugs: unmediated global writes are the
  widest bug surface there is; each access point removed shrinks it.
