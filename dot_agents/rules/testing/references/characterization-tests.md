# Characterization Tests

Use characterization tests when untested legacy code must be held stable before its
contract can be changed.

1. Exercise representative input through the public API.
2. Observe the actual values, errors, and events.
3. Write a test for that observed behavior, even when it is wrong.
4. Refactor while the characterization test stays green.
5. Change the contract and test together in a separate, deliberate step.

Mark known-wrong behavior with an issue or TODO and replace the test when the real
contract takes over. Characterization tests are not a greenfield TDD substitute.
