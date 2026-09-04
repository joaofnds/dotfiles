# Replace Command with Function

**Smells:** Lazy Element, Speculative Generality
**Inverse:** Replace Function with Command
**Improves:** maintainability: an operation that needs no lifecycle sheds the class that pretended it did

## When to apply

- A command object's whole life is construct-then-execute: no staged execution, no
  inspected intermediates, no undo: the ceremony of a class wrapped around what is
  semantically one function call. Collapse it.
- The lifecycle the command was built for never arrived (queueing, undo,
  parameterized re-execution): speculative machinery now carried by every reader and
  call site.
- Direction against Replace Function with Command is settled the same way from either
  side: the class stays only while its fields-and-stages mechanics do demonstrable
  work.

## When not to apply

- The command's features are used: callers stage it, retry it, inspect it, or store
  it for later. Used lifecycle is not ceremony.
- The class is the codebase's uniform plugin surface: a family of interchangeable
  operations dispatched polymorphically. One member collapsing to a function breaks
  the family's shape; judge the family, not the member.

## Mechanics

1. Inline the command's private helper methods into its `execute` (Inline Function),
   so the whole operation reads in one place.
2. Turn `execute` into a plain function whose parameters are what the constructor
   took; fields become locals again. Run the tests.
3. Migrate each call site from construct-and-execute to the single call, testing as
   you go.
4. Delete the class.

## Example

Before: a class per arithmetic operation:

```js
class ChargeCalculator {
  constructor(customer, usage) { this.customer = customer; this.usage = usage; }
  execute() { return this.customer.rate * this.usage; }
}
const charge = new ChargeCalculator(customer, usage).execute();
```

After:

```js
function charge(customer, usage) {
  return customer.rate * usage;
}
```

## House-rule interactions

- `the style skill`: the house default is no class without demonstrated need; this
  refactoring is that rule executing in reverse on a class that lost (or never had)
  its justification.
- `the doctrine skill`: YAGNI: unused lifecycle hooks are the flexibility
  built for a future that never came; deleting them is the rule's enforcement arm.
- `the doctrine skill`: code is a liability: constructor, fields, and
  boilerplate all carried maintenance cost for what one signature now states.
