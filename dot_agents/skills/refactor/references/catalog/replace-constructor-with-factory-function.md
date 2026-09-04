# Replace Constructor with Factory Function

**Smells:** Mysterious Name
**Inverse:** none
**Improves:** maintainability: creation gets a describable name and the freedom to evolve behind it

## When to apply

- Constructors are constrained where functions are not: they must return an instance
  of their own class, carry the class's name rather than a descriptive one, and can't
  choose among implementations. When creation logic outgrows those limits, returning
  a subtype or cached instance, picking a variant, a factory function is the shape
  that allows it.
- Call sites read poorly: `new Employee(name, "E")` says less than
  `createEngineer(name)`, especially when a type-code argument selects what kind of
  thing is really being made.
- Construction must be passed around as a value (a callback, a registry entry);
  `new`-bound constructors compose awkwardly where plain functions slot in.

## When not to apply

- Plain construction with clear arguments needs no wrapper: `new Money(amount,
  currency)` is already honest; a factory adds a synonym and an indirection.
- The factory would exist only to hide dependency wiring that constructor injection
  states better (see the house rule below: factories adapt frameworks to clean
  constructors, not replace explicit dependencies).

## Mechanics

1. Write the factory function; its body simply calls the current constructor.
2. Migrate callers from `new` to the factory, testing as you go.
3. Restrict the constructor's visibility as far as the language allows, so the
   factory is the sanctioned door.
4. Evolve the factory freely: dispatch to subtypes, validate, cache, behavior the
   constructor could never host.

## Example

Before: a type code steers construction:

```js
const eng = new Employee(name, "E");
const mgr = new Employee(name, "M");
```

After: each creation states what it creates:

```js
function createEngineer(name) { return new Employee(name, "E"); }
function createManager(name) { return new Employee(name, "M"); }

const eng = createEngineer(name);
```

## House-rule interactions

- `the style skill`: framework-agnostic constructors: "use factory methods or DI
  module declarations to adapt the framework's container into the clean constructor";
  this refactoring is that rule's prescribed tool, with the constructor staying pure
  and the factory absorbing the mess.
- `the style skill`: Beck's ordering: the factory is an added element; plain
  constructions keep `new` (per "When not to apply") because a synonym reveals no
  additional intent.
