# Inline Variable

**Smells:** Lazy Element
**Inverse:** Extract Variable
**Improves:** readability: deletes a name that only echoes its expression

## When to apply

- The variable's name says no more than the expression it holds: `const items =
  cart.items` renames nothing and costs a line plus an indirection every reader must
  resolve.
- The variable stands in the way of a neighboring refactoring: a temp blocking Extract
  Function's boundary, or one about to be superseded by Replace Temp with Query.
- Direction against Extract Variable is settled by demonstrated pain: inline when the
  name is noise, extract when the expression is opaque. If applying one would just
  invite the other back, neither is justified: leave the code alone.

## When not to apply

- The name carries domain meaning the expression lacks: `base * 0.12` is not
  self-evidently `cityTax`, and deleting the name deletes the explanation.
- The expression is expensive or effectful and the variable exists to evaluate it
  exactly once; inlining multiplies evaluations and can change behavior.
- The variable is reassigned along the way: that is not a simple alias. Apply Split
  Variable first, then reassess what remains.

## Mechanics

1. Confirm the right-hand side has no side effects and the variable is assigned
   exactly once.
2. Replace one use of the variable with the expression. Run the tests.
3. Repeat for each remaining use.
4. Delete the declaration and run the tests again.

## Example

Before: `itemCount` restates `cart.items.length`:

```js
function canCheckout(cart) {
  const itemCount = cart.items.length;
  return itemCount > 0 && !cart.frozen;
}
```

After:

```js
function canCheckout(cart) {
  return cart.items.length > 0 && !cart.frozen;
}
```

## House-rule interactions

- `the doctrine skill`: code is a liability: a variable that explains nothing
  is a line of maintenance with no value. Delete it.
- `the style skill`: Beck's ordering: the removal is a fewest-elements win, valid
  precisely because no intent is lost; when intent would be lost, the case belongs to
  Extract Variable instead.
