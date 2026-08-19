# Remove Middle Man

**Smells:** Middle Man
**Inverse:** Hide Delegate
**Improves:** maintainability: the server stops mirroring its delegate's API, so the delegate can grow without dragging the server along

## When to apply

- The server's surface is mostly forwards: every new feature on the delegate demands a
  matching forward, and the server has become a shadow copy of another interface. Let
  clients talk to the delegate directly.
- The forwarding layer no longer hides anything: clients already know the delegate
  exists and what it does; the indirection is ceremony without information hiding.
- Direction against Hide Delegate is settled by proportion and churn: hiding pays
  while it decouples clients from a changing structure; it stops paying when the
  server's maintenance is dominated by keeping forwards in sync.

## When not to apply

- The forwards carry logic: access checks, defaults, translation. That is not a
  middle man; it is a boundary doing work, and exposing the delegate would bypass it.
- The delegate's interface or ownership is unstable; re-coupling every client to it
  re-creates the problem Hide Delegate solved. The pair of refactorings is a dial, not
  a doctrine: move only as far toward exposure as the churn justifies.

## Mechanics

1. Add an accessor on the server that returns the delegate.
2. For each forwarding method: migrate its callers to
   `server.delegate.feature(...)`, testing per method, then delete the forward.
3. Keep any forward that turns out to carry logic: its survivors mark real boundary
   behavior, now easier to see.

## Example

Before: `Shipment` forwards its whole carrier API:

```js
class Shipment {
  #carrier;
  trackingUrl() { return this.#carrier.trackingUrl(); }
  eta() { return this.#carrier.eta(); }
  rates() { return this.#carrier.rates(); }
}
```

After: clients use the carrier; `Shipment` keeps only what is its own:

```js
class Shipment {
  #carrier;
  get carrier() { return this.#carrier; }
}
shipment.carrier.eta();
```

## House-rule interactions

- `coding_style.md`: Tell, Don't Ask pulls toward Hide Delegate; this refactoring
  is the counterweight for when forwarding has become pure ceremony. The rule's target
  is decision-making on others' internals: a client *reading* a stable, public
  delegate is not that failure.
- `engineering_judgment.md`: code is a liability: N forwarding methods are N
  maintenance points; when they carry no logic, deletion is the win.
