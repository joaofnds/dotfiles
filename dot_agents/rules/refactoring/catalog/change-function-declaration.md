# Change Function Declaration

**Smells:** Mysterious Name, Alternative Classes with Different Interfaces, Speculative Generality, Comments
**Inverse:** none
**Improves:** readability: makes the most-read line of a function, its signature, say what it does

## When to apply

- The name states the how or the when instead of the what, or forces readers into the
  body to learn the purpose. A good name makes the call site self-explanatory.
- A parameter exposes more than the function needs (a whole user where an id would do)
  or less (three unpacked fields where the object would do). Reshaping the signature is
  how the function's coupling gets changed.
- Sibling functions that should be interchangeable have drifted into different
  signatures; aligning the declarations is the first step toward unifying them.
- A parameter is no longer used. A speculative parameter is dead weight at every call
  site.

## When not to apply

- The declaration is a published interface you do not control every caller of. Use the
  migration path below and keep the old declaration delegating until callers are gone,
  or leave it alone when the boundary is contractual.
- The new name is different but not clearer. Renames spend history and review
  attention; spend them when the name is wrong, not merely not-yours.

## Mechanics

Simple path: all callers in reach:

1. Change the declaration: name, parameter set, or both.
2. Update every caller. Run the tests.

Migration path: callers many, remote, or unknown:

1. Extract the body into a new function with the target name and signature.
2. Have the old function delegate to the new one. Run the tests.
3. Migrate callers one at a time, testing after each.
4. Delete the old function once no caller remains; if it cannot be deleted, mark it
   deprecated and stop there.

## Example

Before: neither the name nor the parameters explain anything:

```js
function calc(u, list) {
  return list.filter((m) => m.userId === u.id && !m.read).length;
}
```

After:

```js
function unreadCount(user, messages) {
  return messages.filter((m) => m.userId === user.id && !m.read).length;
}
```

## House-rule interactions

- `engineering-judgment.md`: name things in the domain's language: the declaration
  is where domain vocabulary either lands in the code or does not.
- `coding-style.md`: the `Impl`-suffix ban is this refactoring's naming bar stated
  for classes: a name must say what a thing *is*, and a non-name fails even when it
  compiles.
- `coding-style.md`: surgical execution: rename what the task touches; a repo-wide
  vocabulary sweep is its own task, agreed to explicitly.
