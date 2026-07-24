# Pull Up Constructor Body

**Smells:** Duplicated Code
**Inverse:** none
**Improves:** maintainability — shared construction happens in one place, so a new invariant is enforced once

## When to apply

- Sibling subclass constructors repeat the same setup — assigning the same fields,
  running the same validation — before doing their own specific work. The common
  prefix belongs in the superclass constructor, reached by `super(...)`.
- A construction invariant must hold for every subclass; enforcing it per subclass
  invites the one that forgets.

## When not to apply

- The common statements are not a *prefix* — they must run after subclass-specific
  work, and the language fixes `super()` to run first. Then extract the common part
  into a superclass method the subclass constructors call at the right moment
  (Extract Function), which is this refactoring's documented fallback.
- The constructors share little; hoisting one assignment while everything else stays
  local buys almost nothing — weigh it against leaving construction flat.
- Factory functions, not constructors, build these objects in this codebase — apply
  the same de-duplication to the factories instead.

## Mechanics

1. Ensure the superclass has a constructor; give subclass constructors `super()`
   calls if they lack them.
2. Slide the common statements to the top of each subclass constructor (Slide
   Statements), just after `super()`.
3. Move the common statements into the superclass constructor, adding parameters for
   the values they need; pass those through `super(...)`. Run the tests per subclass.
4. For common logic that cannot lead, use the fallback from "When not to apply."

## Example

Before — both constructors stamp the same fields:

```js
class Engineer extends Employee {
  constructor(name, level) {
    super();
    this.name = name; this.hiredOn = today();
    this.level = level;
  }
}
```

After — shared setup rises; the subclass keeps its own:

```js
class Employee {
  constructor(name) { this.name = name; this.hiredOn = today(); }
}
class Engineer extends Employee {
  constructor(name, level) {
    super(name);
    this.level = level;
  }
}
```

## House-rule interactions

- `coding_style.md:34` — explicit construction: the hoisted constructor keeps mapping
  properties explicitly; the pull-up must not morph into a bulk-assign convenience.
- `engineering_judgment.md:41` — DRY over knowledge: the shared prefix is one
  construction rule; subclass-specific steps that merely look similar stay below.
