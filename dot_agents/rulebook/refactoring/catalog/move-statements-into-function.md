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
2. If any caller of the target function does not already run the statements, stop,
   since the move would add them to that caller. The move is wrong, or the function
   needs splitting first.
3. With a single call site, cut the statements from it, paste them into the body, run
   the tests, and skip the remaining steps.
4. With several, extract the statements plus the call at one site into a new function
   with a temporary, greppable name (Extract Function). Replace the statements plus
   the call at every other site with a call to it, testing after each. Moving the
   statements straight into the body would run them twice at every site not yet
   migrated.
5. Inline the original function into the new one (Inline Function) and rename the new
   one to the original's name. Run the tests.

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

- `engineering.md`: DRY is about knowledge, not code: move the statements
  in only when they encode the same rule at every call site; identical lines serving
  different purposes stay put.
- `core.md`: Beck's ordering: no element is added here; the win is pure
  duplication removal, the second criterion.
