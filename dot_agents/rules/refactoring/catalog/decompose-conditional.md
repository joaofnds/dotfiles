# Decompose Conditional

**Smells:** Long Function, Comments
**Inverse:** none
**Improves:** readability — the conditional states *why* it branches and *what* each branch means, not how

## When to apply

- A conditional's test or branches are long enough that the reader parses mechanics
  instead of reading intent. Naming the pieces turns `if (many clauses) { many lines }`
  into a sentence.
- The condition encodes a domain question — "is this peak season", "does this order
  qualify" — that deserves a name reusable beyond this one spot.
- Comments annotate the test or the branches ("// summer rates apply") — each comment
  is a function name waiting to be extracted.

## When not to apply

- The conditional is already a sentence: a short test with short branches gains
  nothing from three one-line functions and the jumps between them.
- The branches share so much state with the surrounding function that extraction
  produces signatures worse than the inline code — reshape the data first.

## Mechanics

1. Extract the condition into a function named as the question it answers (Extract
   Function). Run the tests.
2. Extract the then-branch into a function named for its outcome; repeat for the
   else-branch. Test after each.
3. If the result is a value selection, consider collapsing to a ternary over the two
   named calls.

## Example

Before — the reader simulates the calendar math:

```js
if (date.month >= 6 && date.month <= 9 && !holidays.includes(date)) {
  charge = quantity * summerRate;
} else {
  charge = quantity * regularRate + winterServiceFee;
}
```

After:

```js
charge = isSummer(date) ? summerCharge(quantity) : regularCharge(quantity);
```

## House-rule interactions

- `coding_style.md` — comments default to zero: branch-labelling comments are this
  refactoring not yet performed; the extracted names replace them.
- `coding_style.md` — boring control flow: the `if` stays a plain `if` — the
  refactoring simplifies what it coordinates, not the control structure itself.
- `coding_style.md` — Beck's ordering: three named functions are added elements
  bought by intent-revelation; for a conditional already legible, the purchase fails
  and "When not to apply" governs.
