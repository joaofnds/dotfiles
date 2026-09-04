# Hide Delegate

**Smells:** Message Chains, Insider Trading
**Inverse:** Remove Middle Man
**Improves:** maintainability: clients stop knowing the server's object graph, so the graph can change without touching them

## When to apply

- Clients walk a chain, `person.department.manager`, to reach what they need. Every
  client that walks it is coupled to the intermediate structure; when `department`
  reorganizes, they all break. A delegating method on the first object absorbs the
  change.
- The navigated relationship is an implementation detail the client has no business
  knowing (which object owns which); hiding it keeps the knowledge where it belongs.
- Direction against Remove Middle Man is settled by counting: a few navigations hidden
  behind meaningful methods is delegation working; a server that forwards nearly its
  whole surface has flipped into the Middle Man smell.

## When not to apply

- The chain is stable, local, and walked in one place: a single `a.b.c` in one
  function is not worth a forwarding layer. The trigger is many clients, or a
  structure that changes.
- Hiding would bloat the server with forwards for every delegate feature; when you
  feel that pressure, the answer may be moving the behavior itself (Move Function),
  not forwarding it.

## Mechanics

1. For each delegate feature the client uses, create a delegating method on the
   server.
2. Migrate clients from the chain to the server's method, testing as you go.
3. If no client navigates to the delegate anymore, remove the server's accessor for
   it: the delegate becomes fully private structure.

## Example

Before: every caller knows managers live on departments:

```js
const boss = employee.department.manager;
```

After: callers ask the employee; the structure is private:

```js
class Employee {
  #department;
  get manager() { return this.#department.manager; }
}
const boss = employee.manager;
```

## House-rule interactions

- `coding-style.md`: Tell, Don't Ask, "the corollary to the Law of Demeter":
  chain-walking is asking for internals and deciding for them; this refactoring is the
  named cure the rule points at.
- `coding-style.md`: Beck's ordering: each forwarding method is an added element,
  bought by decoupling clients from structure, which is why the count matters, and
  why the balance point with Remove Middle Man is judged per relationship, not by
  doctrine.
