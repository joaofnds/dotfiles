# Replace Superclass with Delegate

**Inverse:** none
**Improves:** resilience: the class exposes only what it means, so no new caller can lean on inherited operations that never applied

## When to apply

- The class inherited for implementation convenience, not kind: the classic
  Stack-extends-List, where callers can `insertAt(3, …)` into the middle of a stack
  because the parent's whole API came along with the reuse. Holding the parent as a
  field keeps the reuse and drops the false interface.
- Superclass functions make no sense on the subclass: the is-a claim is false, and
  every inherited-but-inapplicable operation is a bug surface.
- The child depends on parent internals (protected fields, override timing): the
  Insider Trading coupling that delegation forces through a public interface.

## When not to apply

- The is-a relationship is genuine and the whole parent interface applies:
  delegation would replace one `extends` with a page of forwarding methods that mirror
  the parent (manufacturing a Middle Man). Inheritance is the simpler mechanism when
  it tells the truth.
- Performance-critical inner loops where the extra indirection is a measured cost.

## Mechanics

1. Add a field holding an instance of the former superclass.
2. Find every use of a superclass feature, by the class itself or by any caller,
   implicit ones such as iteration and property writes included, and create a
   forwarding method to the field for each feature used. Test as each group lands.
3. Find code that relies on the class being its superclass, such as a parameter of the
   superclass type, a type check (`instanceof`, `Array.isArray`), or indexing.
   Removing `extends` breaks each, so change it to use the forwards first, or stop.
4. Remove the `extends`; construction now creates the delegate instance. Run the
   tests.
5. Retiring a forward some caller uses changes that caller's behavior, so make it a
   separate change after the refactoring.

## Example

Before: a stack that is accidentally a full array:

```js
class Stack extends Array {}
// no caller splices yet, but stack.splice(1, 2) would work
```

After: the interface tells the truth:

```js
class Stack {
  #items = [];
  push(...items) { return this.#items.push(...items); }
  pop() { return this.#items.pop(); }
  get length() { return this.#items.length; }
}
```

## House-rule interactions

- `engineering.md`: composition over inheritance: this is the recovery
  move for inheritance adopted as a shortcut; the house default would not have taken
  the shortcut.
- `core.md`: leverage the type system: the shrunken public surface turns
  "callers shouldn't use `splice`" from a convention into a checked fact.
- `core.md`: Tell, Don't Ask: once the separate change retires the forwards the
  role never meant, the delegate's API is what the role offers, not what the
  implementation happens to contain.
