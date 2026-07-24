# Slide Statements

**Smells:** Duplicated Code, Mutable Data
**Inverse:** none
**Improves:** readability — related lines sit together, so the reader holds one idea at a time

## When to apply

- Code that touches the same data is scattered through a function with unrelated
  statements interleaved. Gathering it lets the reader — and the next refactoring —
  treat it as a unit.
- Declare a variable just above its first use rather than at the top of the function;
  distance between declaration and use is state the reader must carry.
- As preparation: Extract Function, Split Phase, and Move Statements into Function all
  want their raw material contiguous first. Sliding is usually their step zero.

## When not to apply

- The slide would carry a statement across code that reads state it writes, writes
  state it reads, or writes state it also writes — the reorder changes behavior.
  Interference is the entire question; when in doubt, don't slide.
- Both statements perform external side effects (I/O, messaging): their relative order
  is observable behavior, and reordering it is a change, not a refactoring.
- The grouping you want reveals a bigger seam — if gathering the lines immediately begs
  extraction, plan the extraction and slide only what it needs.

## Mechanics

1. Identify the statement to move and its target position.
2. Check every statement it crosses for interference: shared reads and writes, and
   ordering-sensitive side effects. Any interference stops the slide.
3. Move the statement. Run the tests.
4. Slide in small hops when the distance is long — a failed hop then pinpoints the
   interfering pair instead of leaving you a large diff to bisect.

## Example

Before — the pricing lines are split by unrelated setup:

```js
const units = order.quantity;
let shipping = shippingFor(order.destination);
const unitPrice = catalog.priceOf(order.sku);
notifyPicker(order);
const subtotal = units * unitPrice;
```

After — pricing reads as one block:

```js
const units = order.quantity;
const unitPrice = catalog.priceOf(order.sku);
const subtotal = units * unitPrice;
let shipping = shippingFor(order.destination);
notifyPicker(order);
```

## House-rule interactions

- `engineering_judgment.md:36` — work in the smallest coherent steps: the hop-by-hop
  slide with a test after each move is this rule applied literally.
- `coding_style.md:14` — comments default to zero: a section comment labelling
  scattered code ("// pricing") is usually a slide that hasn't happened yet — gather
  the lines and the label becomes unnecessary or becomes a function name.
