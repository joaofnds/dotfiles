# Test Data Builders and Object Mothers

Read this when fixture setup obscures the behavior under test.

## Builders

Use a Builder when a fixture has many irrelevant fields or when several tests vary the
same shape. Give every field a sensible default so each test names only the values that
matter.

```
test "cannot promote a banned user":
    user = aUser().banned().build()

    assert throws(() => users.promoteToAdmin(user))
```

Keep construction inline while one or two fields suffice. A Builder introduced before
repetition is another API to maintain.

## Object Mothers

Use named factories for a small, finite set of domain fixtures such as `Users.admin()`
or `Users.banned()`. Switch to a Builder when variants combine or the list grows.

Mothers may delegate to Builders. Both exist to hide irrelevant setup, not to hide the
state that makes the behavior meaningful.
