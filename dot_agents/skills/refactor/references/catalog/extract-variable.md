# Extract Variable

**Smells:** Comments, Long Function
**Inverse:** Inline Variable
**Improves:** readability: names the steps of a dense expression at the point of use

## When to apply

- An expression is dense enough that the reader must mentally evaluate it to know what
  it means. Naming its sub-parts turns evaluation into reading.
- The same subexpression appears several times inside one function: name it once and
  read the name thereafter.
- You are about to write a comment above an expression. The comment's subject is
  usually the variable name trying to get out.
- A named intermediate also gives a debugger or a log statement something to grab:
  a secondary benefit, never the sole justification.

## When not to apply

- The name would say no more than the expression: `nights * rate` named `product`
  clarifies nothing and costs a line. That case belongs to Inline Variable, and the
  direction between the two is settled by which pain the current code demonstrates.
- The name deserves a wider audience than this one body. When the concept has meaning
  beyond the expression's immediate context, use Extract Function instead, so every
  caller gets the name rather than just this function.
- The expression has side effects: hoisting it into a variable changes evaluation
  order and count, which is a behavior change, not a refactoring.

## Mechanics

1. Confirm the expression is free of side effects.
2. Declare an immutable variable (`const`) named for what the value means in the
   domain, assigned the subexpression.
3. Replace the occurrence with the name. If the subexpression appears more than once,
   replace one occurrence at a time.
4. Run the tests.

## Example

Before: one expression, three ideas:

```js
function total(booking) {
  return booking.nights * booking.rate * (booking.nights > 7 ? 0.85 : 1) +
    booking.nights * booking.rate * 0.12;
}
```

After:

```js
function total(booking) {
  const base = booking.nights * booking.rate;
  const longStayFactor = booking.nights > 7 ? 0.85 : 1;
  const cityTax = base * 0.12;
  return base * longStayFactor + cityTax;
}
```

## House-rule interactions

- `the style skill`: boring control flow: expression-level cleverness is exactly
  what this refactoring dismantles, and a rewrite into named steps is the sanctioned fix
  for code that would otherwise need a *what* comment.
- `the style skill`: comments default to zero; a clearer name is move 1 of the
  three moves to exhaust before writing one, and this refactoring is how an expression
  gets that name.
- `the style skill`: Beck's ordering: the added element is bought by
  intent-revelation at the point of use.
