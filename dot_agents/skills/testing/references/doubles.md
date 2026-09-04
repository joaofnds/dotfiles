# Doubles and verification

Which double fits a collaborator, how to verify, and when a framework mock is
allowed. The short version: prefer real collaborators; where I/O or unmanaged
dependencies make that impossible, write a Fake; framework mocks on our own code
are banned.

Contents: the taxonomy; verification styles; owning the seam; the Fake contract;
DI injection; the mock escape hatch; the I/O boundary; smells.

## The taxonomy (Meszaros)

Precise names for precise roles. Name the double after its role: a double that
returns one canned answer is a Stub even if its type looks like a Fake; a double
that records calls but returns no meaningful state is a Spy. Calling everything
"mock" makes tests incomprehensible.

| Double | Purpose | Stateful? | Verifies interaction? |
|---|---|---|---|
| **Dummy** | Passed to satisfy a signature; never invoked. | No | No |
| **Stub** | Returns canned answers to queries. | No | No |
| **Fake** | Working implementation with a shortcut (in-memory store, fixed clock). Deterministic. | Yes | Optional: may spy |
| **Spy** | Records interactions for later inspection; may return canned answers. | Yes | Yes, after the fact |
| **Mock** | Pre-programmed with expectations; fails the test itself when the protocol is wrong. | Yes | Yes, eager, built in |

We lean overwhelmingly on Fakes. A Fake that captures the requests it received is
a Fake-plus-Spy, not a Mock. The line we do not cross is pre-programmed
expectations: no double that fails the test from the inside because "you called me
in the wrong order." That interaction coupling is fragile.

## Three verification styles (Khorikov)

Prefer the earliest style that expresses the observable contract without hiding a
boundary interaction that is itself the contract:

1. **Output-based**: assert on the return value. Purest; survives any refactor
   except a return-type change.
2. **State-based**: assert on state afterward, read back through the real
   repository or a Fake's captured state.
3. **Communication-based**: assert on the interaction via a spy or mock. Most
   fragile, most coupled to implementation.

Reaching for `toHaveBeenCalledWith` on code you own couples the test to a call
shape you chose, not a contract a client depends on: the test breaks when the
service computes a field differently, adds one, or renames the method, none of
which change behavior. Rewrite the verification around the return value, the
persisted state, or the emitted event.

## Own the seam (GOOS)

The most load-bearing rule in this skill: application and domain tests do not
double third-party classes directly. Wrap the third party in an interface you own
(`HTTPClient`, `Clock`, `IDGenerator`, `UserProvider`, `TokenProvider`, `KVStore`,
`Queue`), give
it a real adapter and a Fake, and let tests see only your interface. Never patch
the library's own function. A focused adapter contract test may use a thin
third-party Spy when the outbound call itself is the observable contract; see the
escape hatch below.

Corollary: when application tests repeatedly mock someone else's class, the seam
wants an owned port. Extract it, adapter-wrap the library, fake the port.

## Fakes are first-class production-style code

A reusable, stateful Fake gets a named type and is shared where several tests use
the seam. A one-test constant Stub may stay local; do not promote every canned
value into a class. A shared stateful Fake satisfies all of:

- **Implements the real interface**, with a compile-time check. The Fake is a
  second valid implementation of the contract, same as the production adapter.
- **Stateful when the role is stateful.** `FakeClock` holds a moment;
  `InMemoryUserRepository` holds users; `FakeHTTPClient` holds queued responses
  and captured requests.
- **Deterministic.** No wall clock, no randomness, no network. A fixed moment, an
  incrementing ID.
- **Explicit seed methods.** `addResponse(r)`, `seedUser(user)`, `failNext(n)`.
  The test arranges state through named domain-level verbs, not by poking fields.
- **A `reset()` method**, called in the per-test setup hook. A Fake that cannot
  be reset leaks state between tests.
- **Captures inputs for optional inspection.** `requests[]`, `sent[]`. This is
  how a Fake plays the Spy role when the test asserts on an outbound call.

## Injection: through DI only

Fakes enter through the dependency graph: a constructor parameter, a container
override, a module decoration. Never import-time module replacement, which is
invisible at the test's call site, breaks local reasoning, and couples to build
tooling.

## The narrow mock escape hatch

A framework mock (generated or inline, any anonymous record-and-return spy from a
mocking library) is allowed only when all four hold:

1. The adapter itself is the subject of a focused contract test.
2. The interface is owned by a third-party library we do not control.
3. The test asserts that a call happened with specific arguments because that
   call is the boundary contract.
4. The mock has zero state beyond what the interaction assertion reads.

Typical legal uses: a queue client's `.add()` received the job payload we
constructed; a logger received a structured event. The moment the mock needs
`if args.x then return y`, a state machine, a queue of responses, or two
interdependent methods, it has outgrown its role: write a Fake.

## Fake at the I/O boundary, not every class boundary

The London reflex, isolate the class and mock every collaborator, couples the
test to internal structure: four mocks and four `wasCalledWith` assertions that
break on any restructuring. The classical shape uses real value objects and
helpers with Fakes only at the I/O seams, so the test breaks if and only if the
behavior breaks.

## Smells at this layer

- A third-party type mocked in an application or domain test: wrap it, own the
  interface, fake the port.
- A type you own, mocked: write a Fake.
- A mock with state or branching inside: it has outgrown its role; replace with a
  Fake.
- `mock.method.wasCalledWith(...)` on your own code: verify by return value or
  state.
- A "fake" that is actually a Stub (no state, no seeds, no reset): rename it, or
  upgrade it when tests need more.
- A Fake without `reset()`: state will leak; add it.
- A Fake injected by module replacement: inject through DI.
- Inventing "the wrong method was called" as a failure mode: Mock territory; not
  for our own code.
