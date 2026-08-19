# Move Statements into Function

**Smells:** Duplicated Code
**Inverse:** Move Statements to Callers
**Improves:** maintainability: code that always accompanies a call gets one home inside it

## When to apply

- Every caller of a function repeats the same statements immediately before or after
  the call. The repetition means those statements are part of the called behavior and
  belong inside it.
- The statements and the function only make sense together: executing one without the
  other would be a bug. Fusing them makes the pairing unbreakable.
- Direction against Move Statements to Callers is settled by uniformity: statements all
  callers repeat move in; statements only some callers want move out.

## When not to apply

- Any current or plausible caller needs the function *without* the surrounding
  statements: moving them in forces that caller to get behavior it must then undo.
- The repeated statements are coincidentally identical but serve different purposes per
  caller; fusing them welds together knowledge that should evolve separately.

## Mechanics

1. If the repeated statements are not adjacent to the call, use Slide Statements to
   bring them next to it at each call site.
2. If the target function is called by anything that must not gain the statements,
   stop: the move is wrong, or the function needs splitting first.
3. Move the statements into the function body (when the change is non-trivial, extract
   call-plus-statements into a fresh function, migrate callers to it, then rename).
4. Run the tests after each call site is migrated.

## Example

Before: every caller stamps the audit entry itself:

```js
audit.push({ action: "refund", at: clock.now() });
issueRefund(payment);

audit.push({ action: "refund", at: clock.now() });
issueRefund(chargeback);
```

After:

```js
function issueRefund(payment) {
  audit.push({ action: "refund", at: clock.now() });
  gateway.refund(payment);
}
issueRefund(payment);
issueRefund(chargeback);
```

## House-rule interactions

- `engineering_judgment.md`: DRY is about knowledge, not code: move the statements
  in only when they encode the same rule at every call site; identical lines serving
  different purposes stay put.
- `coding_style.md`: Beck's ordering: no element is added here; the win is pure
  duplication removal, the second criterion.
