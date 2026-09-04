# Rename Field

**Smells:** Mysterious Name
**Inverse:** none
**Improves:** readability: the record's most-visible surface, its field names, speaks the domain's language

## When to apply

- A field name is abbreviated, borrowed from an old model, or simply wrong: readers
  translate `n`, `usrTyp`, or `data2` on every access.
- The domain vocabulary moved on: the business now says "subscription" where the code
  still says "contract", and every conversation about the code needs a glossary.
- A data structure is about to gain more users: names on widely-shared records pay
  compound interest, so fix them before the audience grows.

## When not to apply

- The field crosses a persistence or wire boundary you cannot migrate right now: a
  rename there is a schema/API change with its own coordination cost, not a local edit.
  Rename the in-memory field and translate at the boundary, or schedule the migration
  as its own task.
- The new name is different but not clearer, or fights the codebase's established
  idiom for that concept.

## Mechanics

1. For a narrowly-scoped record, rename the field and every accessor in one edit; run
   the tests, done.
2. For a widely-used record: encapsulate it first (Encapsulate Record), so all access
   runs through functions.
3. Rename the internal field; keep the accessors' old names forwarding. Run the tests.
4. Rename the accessors (Change Function Declaration's migration path), migrating
   callers gradually. Adjust constructors and serialization last, with their migration.

## Example

Before: one abbreviation, decoded at every use:

```js
const acct = { hldr: "Ana", bal: 1200 };
statement(acct.hldr, acct.bal);
if (acct.bal < 0) notifyOverdraft(acct.hldr);
```

After:

```js
const account = { holder: "Ana", balance: 1200 };
statement(account.holder, account.balance);
if (account.balance < 0) notifyOverdraft(account.holder);
```

## House-rule interactions

- `engineering-judgment.md`: name things in the domain's language: misaligned
  field names cause misaligned models, and this refactoring is the repair.
- `coding-style.md`: domain models keep schemas and wire formats out: when the
  stored or serialized name must stay, the translation belongs at the boundary mapper,
  not as a permanently wrong domain name.
- `coding-style.md`: surgical execution: rename the field the task establishes is
  wrong; a vocabulary sweep across the model is its own agreed task.
