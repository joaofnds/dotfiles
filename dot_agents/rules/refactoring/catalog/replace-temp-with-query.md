# Replace Temp with Query

**Smells:** Long Function, Mutable Data
**Inverse:** none
**Improves:** readability — the computation gets a name callable from anywhere, unblocking further extraction

## When to apply

- A temp holds a computed value that later code reads; extracting the computation into
  a function removes the temp from every extraction boundary. This is the classic
  unblocking move before Extract Function — temps anchor code to their scope, queries
  do not.
- The same calculation-and-temp appears in sibling functions; as a query it is written
  once.
- Inside a class, where fields give the query its inputs for free, the move is at its
  cheapest and most natural.

## When not to apply

- The temp snapshots a value that later mutates — re-running the computation would see
  different data. A query must return the same answer at every call site the temp
  served; if it cannot, the temp is doing real work.
- The computation is expensive and demonstrated hot; a query recomputes per call.
  Measure before conceding this, and prefer restoring a cache deliberately over
  keeping an incidental temp.
- The variable is assigned more than once — that is Split Variable's case, not this
  one.

## Mechanics

1. Check the temp is computed once and its computation has no side effects.
2. Make the temp `const` and run the tests — this proves nothing reassigns it.
3. Extract the computation into a function; name it for the value, not the steps.
4. Replace each read of the temp with a call, testing as you go; delete the temp.

## Example

Before — `basePrice` pins the logic inside this function:

```js
class Order {
  get total() {
    const basePrice = this.quantity * this.unitPrice;
    if (basePrice > 1000) return basePrice * 0.95;
    return basePrice;
  }
}
```

After — the query is available to every method and extraction:

```js
class Order {
  get basePrice() {
    return this.quantity * this.unitPrice;
  }
  get total() {
    if (this.basePrice > 1000) return this.basePrice * 0.95;
    return this.basePrice;
  }
}
```

## House-rule interactions

- `coding_style.md:15` — move understanding out of your head: the named query
  persists what the temp only held locally.
- `engineering_judgment.md:38` — make the change easy, then make the easy change:
  this refactoring is usually the "make it easy" half performed so Extract Function
  can follow.
