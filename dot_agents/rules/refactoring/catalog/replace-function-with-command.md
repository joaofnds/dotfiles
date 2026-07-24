# Replace Function with Command

**Smells:** Long Function
**Inverse:** Replace Command with Function
**Improves:** maintainability — a function too tangled to decompose in place gains fields for its locals and methods for its steps

## When to apply

- A function is so complex that Extract Function keeps failing on it — every fragment
  needs half the locals, so every extraction drags a parameter train. As a command
  object, the locals become fields and the fragments become parameterless private
  methods; decomposition finally proceeds.
- The operation genuinely needs a lifecycle the function form cannot give:
  accumulated state across staged execution, or inspection of intermediate results.
- This is the heavyweight option and the last resort: reach for it only when plain
  Extract Function has demonstrably failed on the function's local-variable tangle.

## When not to apply

- **The default is a function** — `coding_style.md:8` bars introducing a class to
  house what a function can express; most long functions yield to ordinary extraction
  well before a command is warranted.
- Undo, queueing, or scheduling are *anticipated* rather than required — building
  command infrastructure for them now is speculative generality; the refactoring back
  (Replace Command with Function) is exactly what happens to unused lifecycles.
- Direction against Replace Command with Function is settled by demonstrated need:
  the command earns its class only while the fields-instead-of-parameters mechanics
  are doing visible work.

## Mechanics

1. Create a class named for the operation; its constructor takes the function's
   parameters into fields.
2. Move the function's body into an `execute` method; run the tests.
3. Promote each local variable that blocks decomposition into a field.
4. Now decompose freely: Extract Function on `execute`'s fragments becomes trivial,
   since shared state travels as fields.

## Example

Before — every helper would need five parameters:

```js
function score(candidate, medicalExam, scoringGuide) {
  let result = 0; let certificationGrade = "regular";
  // dozens of lines mutating result and certificationGrade …
  return result;
}
```

After — locals are fields; steps are methods:

```js
class Scorer {
  constructor(candidate, medicalExam, scoringGuide) { /* …into fields */ }
  execute() {
    this.result = 0;
    this.scoreSmoking();
    this.scoreCertification();
    return this.result;
  }
}
```

## House-rule interactions

- `coding_style.md:8` — do not introduce classes solely to satisfy structure: the
  command must be evidenced by failed extraction attempts or a required lifecycle,
  never by a preference for objects.
- `engineering_judgment.md:26` — match complexity to the problem: the command sits at
  the top of a gradient (inline → extracted functions → command); pick the lowest
  rung that works.
