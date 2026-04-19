# 02 — Mocking and Roles

What test doubles we use, what we don't, and why. Read the gatekeeper (`00-index.md`) first.

This module answers three questions:
1. What kind of double is the right one for this collaborator?
2. How do we verify — on the output, on the state, or on the interaction?
3. When is a framework mock allowed, and when is it banned?

The short version: **prefer real collaborators. Where I/O or unmanaged dependencies make that impossible, write a Fake. Framework mocks on your own code are banned.**

---

## 1. The test double taxonomy (Meszaros)

Precise names for precise roles. Use the right word and the test reads correctly. Substitute the wrong one and the test grows a defect that's hard to name.

| Double | Purpose | Stateful? | Verifies interaction? |
|---|---|---|---|
| **Dummy** | Passed to satisfy a signature; never invoked. | No | No |
| **Stub** | Returns canned answers to queries. | No | No |
| **Fake** | Working implementation with a shortcut (in-memory store, fixed clock, test-signed token). Deterministic. | Yes | Optional — may spy |
| **Spy** | Records interactions for later inspection. May return canned answers. | Yes | Yes (after the fact) |
| **Mock** | Pre-programmed with expectations; fails the test itself if the protocol is wrong. | Yes | Yes (eager, built-in) |

We lean overwhelmingly on **Fakes**. Some Fakes also spy — a Fake that captures the list of requests it received is a Fake-plus-Spy, not a Mock. The line we don't cross is pre-programmed expectations: we do not build doubles that fail the test from the inside because "you called me in the wrong order." Interaction coupling of that kind is fragile (§3 below).

Name your double after its role. A double that returns one canned user is a **Stub**, not a **Fake**, even if its type looks similar to one. A double that records calls but doesn't return meaningful state is a **Spy**. Calling everything "mock" is how tests become incomprehensible.

---

## 2. Three styles of verification (Khorikov)

Three ways a test can know the code worked. Prefer them in this order, always:

1. **Output-based** — the function returns a value; assert on the value. Purest. Survives any refactor except changing the return type.
2. **State-based** — the system mutates state; assert on the state afterward (read it back through the real repository, inspect a Fake's captured state).
3. **Communication-based** — the code calls a collaborator; assert on the interaction via a spy or mock. Most fragile, most coupled to implementation, hardest to refactor around.

```
[BAD] — communication-based verification on our own code
    test "creates user":
        mockRepo = inlineMock()
        service = new UserService(mockRepo)

        service.create("joao")

        assert mockRepo.save.wasCalledWith({ name: "joao", role: "default" })   // coupled to call shape
```

This test breaks the moment the service computes `role` differently, adds a field, or renames `save()`. None of those are changes in behavior.

```
[GOOD] — state-based verification through a Fake that implements the real interface
    test "creates user":
        users = new InMemoryUserRepository()             // Fake of our own repo interface
        service = new UserService(users)

        created = service.create("joao")

        assert users.findById(created.id) == created     // verified through the public API
```

```
[BEST] — output-based verification when the method returns the value
    test "creates user with a defaulted role":
        service = new UserService(new InMemoryUserRepository())

        created = service.create("joao")

        assert created.role == "default"
```

If you're reaching for `toHaveBeenCalledWith` on code you own, you've coupled the test to a call sequence you chose — not a contract the client depends on. Rewrite the verification around the return value, the persisted state, or the emitted event.

---

## 3. Only mock types you own (GOOS)

**Never stand up a Stub, Spy, Mock, or Fake directly for a third-party class.** Wrap the third-party in an interface *you* own, then fake your interface.

This is the single most load-bearing rule in this document. It's why we have `HTTPClient` (our interface), with `RealHTTPClient` (adapter wrapping the library) and `FakeHTTPClient` (deterministic in-memory double) — instead of patching the library's `fetch` function. Same for `Clock`, `IDGenerator`, `UserProvider`, `TokenProvider`, `KVStore`, `Queue`. The third-party library sits behind *our* interface; tests only ever see our interface.

```
[BAD] — mocking a third-party library directly
    test "fetches a pokemon":
        librarySpy = replaceModule("third-party-http-lib", {
            get: (url) => { return { status: 200, body: { name: "pikachu" } } }
        })

        service = new PokemonService()                   // wires to third-party lib internally

        result = service.getByName("pikachu")

        assert result.name == "pikachu"
        assert librarySpy.get.wasCalledWith("https://pokeapi.co/api/v2/pokemon/pikachu")
```

Every library upgrade becomes a test-rewrite project. Every API shape change cascades across every test that touched that library. The library's idioms are baked into the test suite.

```
[GOOD] — wrap the library in an owned interface; fake that interface
    interface HTTPClient:
        get(url, options?) -> Response
        post(url, options?) -> Response
        ...

    class RealHTTPClient implements HTTPClient:
        constructor(realLibrary) { ... }                 // adapter around the third party

    class FakeHTTPClient implements HTTPClient:
        requests  = []
        responses = []

        addResponse(response):       responses.push(response)
        reset():                     requests.clear(); responses.clear()

        get(url, options?):
            requests.push({ method: "GET", url, options })
            return responses.shift() or error("no response queued")

    test "fetches a pokemon":
        http = new FakeHTTPClient()
        http.addResponse({ status: 200, body: { name: "pikachu" } })
        service = new PokemonService(http)

        result = service.getByName("pikachu")

        assert result.name == "pikachu"
        assert http.requests[0].url == "https://pokeapi.co/api/v2/pokemon/pikachu"
```

The consequence: when the third-party API changes, one adapter class changes and every test keeps working. When the domain needs grow, we extend *our* interface. The test suite knows nothing about the library.

Corollary: if you find yourself writing a "light" mock of someone else's class, stop. That's the signal that an interface wants to be extracted. Extract it, adapter-wrap the library, fake the adapter.

---

## 4. Fakes are first-class production-style code

A Fake is not a one-line lambda scribbled inside a `beforeEach`. It is a class. It lives under a shared test directory and is imported by every test that touches the seam it covers.

A Fake must satisfy all of:

- **Implement the real interface.** The interface is the contract; the Fake is a second valid implementation of it, same as the production adapter. Compile-time check required.
- **Stateful when the role is stateful.** `FakeClock` holds a moment. `InMemoryUserRepository` holds users. `FakeHTTPClient` holds a queue of canned responses and a captured list of received requests.
- **Deterministic.** No wall-clock calls, no randomness, no network. A `FakeClock.now()` returns a fixed moment; an `IncrementalIdGenerator` counts up from 1.
- **Expose explicit seed methods.** `addResponse(r)`, `setNextStatus("down")`, `seedUser(user)`. The test arranges state through named, domain-level verbs — not by poking internal fields.
- **Expose a `reset()` method.** Called in `beforeEach`. Clears captured state and queued responses. A Fake that can't be reset will leak state between tests.
- **Capture inputs for optional inspection.** `requests[]`, `generatedIds[]`. This is how a Fake plays a Spy role when the test wants to assert on the outbound call.

```
class FakeEmailService implements EmailService:
    sent    = []                                         // Spy role: inputs captured
    failNextN = 0                                        // seed state

    reset():
        sent = []
        failNextN = 0

    failNext(n):                                         // seed method
        failNextN = n

    send(to, subject, body):                             // real interface
        if failNextN > 0:
            failNextN -= 1
            throw EmailError("simulated failure")
        sent.push({ to, subject, body })
```

```
[BAD] — inline anonymous stub, no state, no reset, no contract check
    test "sends a welcome email":
        service = new UserService({ send: (to, subj, body) => {} })   // not typed to interface

        service.register("joao@x.com")

        // no way to verify the email was sent or what it contained
```

```
[GOOD] — first-class Fake, shared, stateful, verifiable
    test "sends a welcome email":
        emails = new FakeEmailService()
        service = new UserService(emails)

        service.register("joao@x.com")

        assert emails.sent[0].to == "joao@x.com"
        assert emails.sent[0].subject == "Welcome"
```

---

## 5. Injection — through DI only, never through module patching

Fakes are injected through the dependency graph — a constructor parameter, a container override, a module decoration. Never by import-time module replacement.

- ✅ Pass the Fake to the constructor.
- ✅ Register the Fake in the test harness's DI module.
- ✅ Decorate the real binding with a Fake via a container override at harness setup.
- ❌ Replace the module at import time so that every consumer transparently gets the Fake.

Module patching is invisible at the test's call site. It violates encapsulation, makes the test impossible to reason about locally, and couples to a module resolution detail that changes with build tooling.

---

## 6. The narrow mock escape hatch

Framework mocks — generated or inline, any form of anonymous record-and-return spy produced by a mocking library — are allowed under **strict** conditions:

1. The interface is owned by a third-party library we don't control.
2. The test is asserting that **a call happened with specific arguments** — not that a value was transformed, not that a sequence of calls produced an outcome.
3. The mock has zero state beyond what the interaction assertion reads.

Typical legal uses: verifying that a queue client's `.add()` method was called with a job payload we constructed, or that a logger received a structured event. The call itself is the contract — the library is the unmanaged outside world, and we're verifying the boundary we hand data across.

The moment the mock needs `if args.x then return y`, a state machine, a queue of responses, or two interdependent methods, you have outgrown a mock. Write a Fake.

```
[LEGAL ESCAPE HATCH] — thin interaction verification on a third-party queue client
    test "enqueues a user-created job":
        queueClient = inlineSpy({ add: () => {} })       // mock of third-party Queue.add()
        service = new UserCreatedPublisher(queueClient)

        service.publish(userCreatedEvent)

        assert queueClient.add.wasCalledWith("user.created", userCreatedEvent, anyJobOptions())
```

```
[OUT OF BOUNDS] — mocking our own domain interface
    test "creates user":
        repoSpy = inlineSpy({ save: () => {} })          // ❌ our own UserRepository — must be a Fake
        service = new UserService(repoSpy)

        service.create("joao")

        assert repoSpy.save.wasCalledWith({ name: "joao" })
```

---

## 7. The unit-is-a-behavior corollary

The London-school reflex is: "isolate the class — mock every collaborator around it." We don't. The classical view (Khorikov) is that the **unit** is a unit of *behavior*, not a unit of *structure*. One behavior may span a service, a value object, and a couple of pure helpers; testing them together is still a unit test as long as it's fast and hits no I/O.

So when deciding what to fake: **fake at the I/O boundary, not at every class boundary.**

```
[BAD] — London reflex; every collaborator mocked, test is coupled to internal structure
    test "registers a user":
        repoMock     = inlineSpy()
        emailMock    = inlineSpy()
        hasherMock   = inlineSpy({ hash: (p) => "hashed:" + p })
        validatorMock = inlineSpy({ validate: () => true })
        service = new UserService(repoMock, emailMock, hasherMock, validatorMock)

        service.register("joao@x.com", "password")

        assert validatorMock.validate.wasCalledWith("joao@x.com", "password")
        assert hasherMock.hash.wasCalledWith("password")
        assert repoMock.save.wasCalledWith(matchUser({ email: "joao@x.com", passwordHash: "hashed:password" }))
        assert emailMock.send.wasCalledWith("joao@x.com", any(), any())
```

Five assertions, four mocks, zero confidence that anything works. Every refactor breaks at least one.

```
[GOOD] — classical; real value objects and helpers, Fake at the I/O seams only
    test "registers a user":
        users  = new InMemoryUserRepository()            // Fake at I/O boundary
        emails = new FakeEmailService()                  // Fake at I/O boundary
        service = new UserService(users, emails, realPasswordHasher, realEmailValidator)

        registered = service.register("joao@x.com", "password")

        assert users.findById(registered.id).email == "joao@x.com"
        assert emails.sent[0].to == "joao@x.com"
```

Two Fakes, two state assertions, real hasher and real validator. The test breaks if and only if the behavior breaks.

---

## 8. Smells that show up at this layer

- **Mocking a type you don't own.** Wrap it, own the interface, fake that.
- **Mocking a type you do own.** Write a Fake.
- **A mock with state or branching logic inside it.** It's outgrown its role. Replace with a Fake.
- **Assertions of the form `mock.methodName.wasCalledWith(...)` on your own code.** Rewrite the verification around return value or state.
- **A "fake" that is actually a Stub** (no state, no seeds, no reset). Name it a Stub. Or upgrade it to a Fake with seed methods if the tests need more.
- **A Fake with no `reset()` method.** State will leak between tests. Add reset.
- **A Fake injected by import-time module replacement.** Inject through DI instead; the Fake must be visible at the test's call site.
- **Inventing "the wrong method was called" as a failure mode.** That is Mock territory; we don't go there for our own code.
