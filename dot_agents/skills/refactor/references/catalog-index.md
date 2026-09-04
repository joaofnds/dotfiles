# Refactoring catalog: index

Fowler, *Refactoring*, 2nd edition (2018): its 24 smells (ch. 3) and its 66-refactoring
catalog, snapshotted 2026-07 ([refactoring.com/catalog](https://refactoring.com/catalog/)
is the convenience mirror, not the authority). Smell and refactoring names are used
verbatim from that edition; nothing outside it may be cited. Before citing a
refactoring in a finding, read its linked document under `catalog/` in this directory: it carries the
mechanics, the example, and the house-rule interactions the finding must honor.

## Smells

- **Mysterious Name**: a name that forces reading the body or call sites to learn what it is.
- **Duplicated Code**: the same knowledge expressed in more than one place.
- **Long Function**: a function whose intent drowns in its implementation.
- **Long Parameter List**: enough parameters that call sites are hard to write and read.
- **Global Data**: mutable state assignable from anywhere in the codebase.
- **Mutable Data**: a value updated in place, so no reader can trust what it holds.
- **Divergent Change**: one module edited for several unrelated kinds of change.
- **Shotgun Surgery**: one logical change forcing small edits across many modules.
- **Feature Envy**: a function more interested in another module's data or functions than its own.
- **Data Clumps**: the same group of values traveling together through signatures and records.
- **Primitive Obsession**: domain concepts carried as bare strings and numbers.
- **Repeated Switches**: the same conditional dispatch duplicated in several places.
- **Loops**: an imperative loop obscuring what a declarative pipeline would state.
- **Lazy Element**: a structure that no longer pays for the indirection it adds.
- **Speculative Generality**: flexibility built for a future that never arrived.
- **Temporary Field**: a field meaningful only in certain circumstances.
- **Message Chains**: a client navigating object to object to reach what it needs.
- **Middle Man**: a class whose methods mostly forward somewhere else.
- **Insider Trading**: modules trading in each other's internals instead of public interfaces.
- **Large Class**: one class holding too many fields and responsibilities.
- **Alternative Classes with Different Interfaces**: interchangeable classes with mismatched signatures.
- **Data Class**: fields and accessors with the behavior living elsewhere.
- **Refused Bequest**: a subclass using little of what its parent provides.
- **Comments**: prose deodorizing code that should explain itself.

## Refactorings

- **[Extract Function](catalog/extract-function.md)**: turn a fragment you must read into a call whose name states its intent.
- **[Inline Function](catalog/inline-function.md)**: remove an indirection whose name adds nothing over its body.
- **[Extract Variable](catalog/extract-variable.md)**: name a subexpression to break up an opaque expression.
- **[Inline Variable](catalog/inline-variable.md)**: remove a variable whose name says no more than the expression it holds.
- **[Change Function Declaration](catalog/change-function-declaration.md)**: rename a function or reshape its parameter list.
- **[Combine Functions into Class](catalog/combine-functions-into-class.md)**: group functions operating on shared data into a class around it.
- **[Combine Functions into Transform](catalog/combine-functions-into-transform.md)**: fold scattered derivations into one transform that returns enriched data.
- **[Split Phase](catalog/split-phase.md)**: separate code handling two concerns into sequential phases with an explicit intermediate.
- **[Move Function](catalog/move-function.md)**: relocate a function to the module whose data and neighbors it actually works with.
- **[Move Field](catalog/move-field.md)**: relocate a field to the record it belongs with.
- **[Move Statements into Function](catalog/move-statements-into-function.md)**: pull statements repeated at every call into the callee.
- **[Move Statements to Callers](catalog/move-statements-to-callers.md)**: push statements out to callers when they no longer belong to every call.
- **[Slide Statements](catalog/slide-statements.md)**: reorder statements so related code sits together.
- **[Split Loop](catalog/split-loop.md)**: give a loop doing two jobs one loop per job.
- **[Replace Loop with Pipeline](catalog/replace-loop-with-pipeline.md)**: express a loop as a filter/map/reduce pipeline.
- **[Remove Dead Code](catalog/remove-dead-code.md)**: delete code no execution path reaches.
- **[Split Variable](catalog/split-variable.md)**: give each distinct purpose its own variable instead of reusing one.
- **[Rename Field](catalog/rename-field.md)**: align a record field's name with the domain.
- **[Rename Variable](catalog/rename-variable.md)**: align a variable's name with what it holds.
- **[Replace Derived Variable with Query](catalog/replace-derived-variable-with-query.md)**: compute a derivable value on demand instead of storing it.
- **[Change Reference to Value](catalog/change-reference-to-value.md)**: treat a shared mutable object as an immutable value.
- **[Change Value to Reference](catalog/change-value-to-reference.md)**: share one object when every holder must see its updates.
- **[Replace Magic Literal](catalog/replace-magic-literal.md)**: give a meaning-bearing literal a name.
- **[Encapsulate Variable](catalog/encapsulate-variable.md)**: route access to data through functions before moving or restricting it.
- **[Encapsulate Record](catalog/encapsulate-record.md)**: replace a bare record with an object that controls access to it.
- **[Encapsulate Collection](catalog/encapsulate-collection.md)**: expose add/remove operations and a read-only view instead of the raw collection.
- **[Replace Primitive with Object](catalog/replace-primitive-with-object.md)**: grow a primitive-carried concept into its own type.
- **[Replace Temp with Query](catalog/replace-temp-with-query.md)**: replace a stored intermediate with a function that computes it.
- **[Extract Class](catalog/extract-class.md)**: split a class doing two classes' jobs.
- **[Inline Class](catalog/inline-class.md)**: fold a class that stopped pulling its weight into its user.
- **[Hide Delegate](catalog/hide-delegate.md)**: give clients a method instead of a path through a delegate.
- **[Remove Middle Man](catalog/remove-middle-man.md)**: let clients call the delegate directly when forwarding dominates.
- **[Decompose Conditional](catalog/decompose-conditional.md)**: extract a conditional's test and branches into named functions.
- **[Consolidate Conditional Expression](catalog/consolidate-conditional-expression.md)**: unify separate checks that share one result.
- **[Replace Nested Conditional with Guard Clauses](catalog/replace-nested-conditional-with-guard-clauses.md)**: return early on special cases and keep the main path unindented.
- **[Replace Conditional with Polymorphism](catalog/replace-conditional-with-polymorphism.md)**: move per-type branches into per-type implementations.
- **[Introduce Special Case](catalog/introduce-special-case.md)**: model a recurring special value as an object carrying the common responses.
- **[Introduce Assertion](catalog/introduce-assertion.md)**: state an assumed invariant so violations fail loudly.
- **[Replace Control Flag with Break](catalog/replace-control-flag-with-break.md)**: use break or return instead of a variable steering the loop.
- **[Replace Error Code with Exception](catalog/replace-error-code-with-exception.md)**: signal failure with an exception instead of a returned code.
- **[Replace Exception with Precheck](catalog/replace-exception-with-precheck.md)**: test a condition the caller can check instead of catching.
- **[Replace Inline Code with Function Call](catalog/replace-inline-code-with-function-call.md)**: swap re-implemented logic for a call to the existing function.
- **[Substitute Algorithm](catalog/substitute-algorithm.md)**: replace a convoluted algorithm wholesale with a clearer one.
- **[Separate Query from Modifier](catalog/separate-query-from-modifier.md)**: split a function that both returns a value and has side effects.
- **[Parameterize Function](catalog/parameterize-function.md)**: merge near-identical functions into one taking the difference as a parameter.
- **[Remove Flag Argument](catalog/remove-flag-argument.md)**: replace a behavior-selecting argument with explicit functions.
- **[Preserve Whole Object](catalog/preserve-whole-object.md)**: pass the object instead of values unpacked from it.
- **[Replace Parameter with Query](catalog/replace-parameter-with-query.md)**: drop a parameter the callee can derive itself.
- **[Replace Query with Parameter](catalog/replace-query-with-parameter.md)**: pass a value in rather than have the callee reach out for it.
- **[Remove Setting Method](catalog/remove-setting-method.md)**: delete the setter of a field that must not change after construction.
- **[Replace Constructor with Factory Function](catalog/replace-constructor-with-factory-function.md)**: construct through a function free of constructor limitations.
- **[Replace Function with Command](catalog/replace-function-with-command.md)**: reify a complex function as an object whose fields replace its locals.
- **[Replace Command with Function](catalog/replace-command-with-function.md)**: collapse a command object that earns no keep back into a function.
- **[Return Modified Value](catalog/return-modified-value.md)**: return the updated value so data flow is visible to the caller.
- **[Introduce Parameter Object](catalog/introduce-parameter-object.md)**: group a recurring clump of parameters into one structure.
- **[Pull Up Method](catalog/pull-up-method.md)**: move duplicated subclass methods into the superclass.
- **[Pull Up Field](catalog/pull-up-field.md)**: move duplicated subclass fields into the superclass.
- **[Pull Up Constructor Body](catalog/pull-up-constructor-body.md)**: move shared construction steps into the superclass constructor.
- **[Push Down Method](catalog/push-down-method.md)**: move a method only some subclasses need into those subclasses.
- **[Push Down Field](catalog/push-down-field.md)**: move a field only some subclasses need into those subclasses.
- **[Extract Superclass](catalog/extract-superclass.md)**: factor the shared behavior of sibling classes into a common parent.
- **[Collapse Hierarchy](catalog/collapse-hierarchy.md)**: merge a class and parent that no longer differ enough to stay apart.
- **[Remove Subclass](catalog/remove-subclass.md)**: replace a subclass too small for its cost with a field on the parent.
- **[Replace Subclass with Delegate](catalog/replace-subclass-with-delegate.md)**: swap inheritance for a composed delegate that can vary and combine.
- **[Replace Superclass with Delegate](catalog/replace-superclass-with-delegate.md)**: hold the former parent as a delegate instead of inheriting misfit behavior.
- **[Replace Type Code with Subclasses](catalog/replace-type-code-with-subclasses.md)**: turn a type code into subclasses so behavior can attach per type.

## Smell → candidate refactorings

- **Mysterious Name** → Change Function Declaration, Rename Variable, Rename Field
- **Duplicated Code** → Extract Function, Slide Statements, Pull Up Method, Replace Inline Code with Function Call
- **Long Function** → Extract Function, Replace Temp with Query, Introduce Parameter Object, Preserve Whole Object, Replace Function with Command, Decompose Conditional, Replace Conditional with Polymorphism, Split Loop
- **Long Parameter List** → Replace Parameter with Query, Preserve Whole Object, Introduce Parameter Object, Remove Flag Argument, Combine Functions into Class
- **Global Data** → Encapsulate Variable
- **Mutable Data** → Encapsulate Variable, Split Variable, Slide Statements, Extract Function, Separate Query from Modifier, Remove Setting Method, Replace Derived Variable with Query, Change Reference to Value
- **Divergent Change** → Split Phase, Move Function, Extract Function, Extract Class
- **Shotgun Surgery** → Move Function, Move Field, Combine Functions into Class, Combine Functions into Transform, Split Phase, Inline Function, Inline Class
- **Feature Envy** → Move Function, Extract Function
- **Data Clumps** → Extract Class, Introduce Parameter Object, Preserve Whole Object
- **Primitive Obsession** → Replace Primitive with Object, Replace Type Code with Subclasses, Extract Class, Introduce Parameter Object
- **Repeated Switches** → Replace Conditional with Polymorphism
- **Loops** → Replace Loop with Pipeline
- **Lazy Element** → Inline Function, Inline Class, Collapse Hierarchy
- **Speculative Generality** → Collapse Hierarchy, Inline Function, Inline Class, Change Function Declaration, Remove Dead Code
- **Temporary Field** → Extract Class, Move Function, Introduce Special Case
- **Message Chains** → Hide Delegate, Extract Function, Move Function
- **Middle Man** → Remove Middle Man, Inline Function, Replace Superclass with Delegate, Replace Subclass with Delegate
- **Insider Trading** → Move Function, Move Field, Hide Delegate, Replace Subclass with Delegate, Replace Superclass with Delegate
- **Large Class** → Extract Class, Extract Superclass, Replace Type Code with Subclasses
- **Alternative Classes with Different Interfaces** → Change Function Declaration, Move Function, Extract Superclass
- **Data Class** → Encapsulate Record, Remove Setting Method, Move Function, Extract Function, Split Phase
- **Refused Bequest** → Push Down Method, Push Down Field, Replace Subclass with Delegate, Replace Superclass with Delegate
- **Comments** → Extract Function, Change Function Declaration, Introduce Assertion
