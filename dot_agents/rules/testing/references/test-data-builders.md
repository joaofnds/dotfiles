# Test Data Builders and Object Mothers

Read this when fixture setup obscures the behavior under test.

## Builders

Shared fixtures are instantiated Builder classes (`new UserBuilder({ banned: true }).build()`,
or a named variant `new UserBuilder().banned().build()`), not loose `makeX(overrides?)`
factory functions imported directly. The builder takes a `Partial<T>` over sensible
defaults, via its constructor or a `with(partial)` method, so an arbitrary field needs no
per-field setter and a new field on the type is a single edit; add a named method (like
`banned()`) only for a meaningful variant. One construction point per fixture. (Distinct
from entity construction, which takes a props object and no builder: see
coding-style-typescript.md §3.)

Use a Builder when a fixture has many irrelevant fields or when several tests vary the
same shape. Give every field a sensible default so each test names only the values that
matter.

```
test "cannot promote a banned user":
    user = new UserBuilder().banned().build()

    assert throws(() => users.promoteToAdmin(user))
```

Keep construction inline while one or two fields suffice. A Builder introduced before
repetition is another API to maintain.

## Object Mothers

Use named factories for a small, finite set of domain fixtures such as `Users.admin()`
or `Users.banned()`. Switch to a Builder when variants combine or the list grows.

Mothers may delegate to Builders. Both exist to hide irrelevant setup, not to hide the
state that makes the behavior meaningful.
