# Extract Function

**Smells:** Long Function, Duplicated Code, Comments
**Inverse:** Inline Function
**Improves:** readability: replaces a block you must read with a name you can trust

## When to apply

- The deciding test is intent versus implementation, not length: when you have to read a
  block to learn *what* it does, extract it and name it after that what. A one-line
  fragment earns extraction when its name says more than its code.
- You are about to write a comment explaining a block. The comment's text is usually the
  function name trying to get out.
- The same fragment appears in more than one place. Extract once, then replace every
  other occurrence with a call (Replace Inline Code with Function Call).
- A function has grown past what fits in one read. Extracting its coherent sub-steps
  turns the body into a table of contents.

## When not to apply

- You cannot find a name clearly better than the code itself. A fragment with no
  articulable intent gains nothing from a function boundary: the indirection costs the
  reader a jump and reveals nothing, so under Beck's ordering the added element buys
  nothing.
- The fragment touches so many locals that the extracted signature would be noisier than
  the inline code. Restructure first (Split Variable, Replace Temp with Query) or leave
  it alone.
- The surrounding function is long but linear: a narrative of unrepeated steps that
  reads top to bottom. Extraction that only shortens, without isolating a nameable idea,
  trades one readable page for five fragments.

## Mechanics

1. Choose the fragment and draft the name first: after what the fragment achieves, not
   how it works. If no name comes, stop: see "When not to apply."
2. Create the new function with that name and move the fragment into it.
3. Turn each local the fragment reads into a parameter. If the fragment assigns one
   local that is used afterwards, return it. Several assigned locals mean the boundary
   is wrong: pick a smaller fragment, or apply Split Variable first.
4. Replace the original fragment with a call to the new function.
5. Run the tests.
6. Search for duplicates of the extracted fragment elsewhere and replace each with a
   call, testing after each replacement.

## Example

Before: the total computation must be read to be understood:

```js
function emailReceipt(order) {
  let total = 0;
  for (const item of order.items) total += item.price * item.qty;
  send(order.customer.email, `Receipt: ${order.id}`, `You paid ${total}.`);
}
```

After: `orderTotal` states the what; the loop becomes a detail:

```js
function emailReceipt(order) {
  send(order.customer.email, `Receipt: ${order.id}`, `You paid ${orderTotal(order)}.`);
}

function orderTotal(order) {
  let total = 0;
  for (const item of order.items) total += item.price * item.qty;
  return total;
}
```

## House-rule interactions

- `coding-style.md`: comments default to zero, and extraction is move 2 of the three
  moves that must be exhausted before writing one. A block you were about to comment is
  this refactoring's primary trigger.
- `coding-style.md`: Beck's ordering ranks fewest-elements fourth. Extraction adds
  an element, so it is admissible only when it buys intent-revelation or removes
  duplication; extraction for length alone does not clear the bar.
- `coding-style.md`: surgical execution: extract within the code the task touches;
  do not sweep through adjacent functions extracting opportunistically.
