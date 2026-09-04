# Inline Function

**Smells:** Lazy Element, Middle Man, Speculative Generality, Shotgun Surgery
**Inverse:** Extract Function
**Improves:** readability: removes a hop that costs the reader a jump and reveals nothing

## When to apply

- The body is as clear as the name. When the code says exactly what the name says, the
  function is indirection without revelation, and every reader pays a jump for nothing.
- A function does little but delegate to another. When forwarding dominates, inline the
  middle layer and let callers talk to the real work.
- A group of functions is badly factored. Inline them into one large function first,
  then re-extract along boundaries that reflect intent: inlining is how a factoring
  that went wrong gets unwound.
- Direction against Extract Function is settled by the current code's demonstrated
  pain, never by symmetry: inline when the name adds a hop, extract when the body hides
  an intent. If neither is demonstrably true, leave the code alone.

## When not to apply

- The name carries meaning the body does not: that is a function worth keeping. Decide
  by whether the name answers a question the body raises, not by taste; taste invites
  re-extraction next month.
- The method is overridden or dispatched to polymorphically: callers depend on the
  dispatch, not on this body.
- Recursion, or call sites where the transplanted body would need reworking beyond
  mechanical substitution. If inlining requires redesign, it is not this refactoring.

## Mechanics

1. Check the function is not overridden and not the target of polymorphic dispatch.
2. Find every caller.
3. Replace each call with the function's body, renaming locals as needed to fit the
   destination scope. Test after each replacement.
4. Delete the now-unused definition.
5. If a replacement turns out non-mechanical, stop and leave that call site; keeping
   the function alive for one awkward caller is usually a sign to stop entirely.

## Example

Before: `destinationCity` restates its one-line body:

```js
function shippingLabel(order) {
  return `${order.customer}: ${destinationCity(order)}`;
}

function destinationCity(order) {
  return order.destination.city;
}
```

After:

```js
function shippingLabel(order) {
  return `${order.customer}: ${order.destination.city}`;
}
```

## House-rule interactions

- `the doctrine skill`: code is a liability; the value is what code does, and
  a delegation layer does nothing. When in doubt, delete.
- `the style skill`: Beck's ordering: inlining removes an element, a win only while
  intent stays revealed. If the inlined body needs a comment to explain itself, the
  extraction was right and the inline is wrong.
- `the style skill`: surgical execution: inline the function the task demonstrates
  is hollow; do not sweep the module for every one-line function.
