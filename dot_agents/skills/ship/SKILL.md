---
name: ship
description: Carry a directed push, release, deploy, or pull request through the project's documented route and observe the outcome. Use only when João has directed the shipping step; it never runs on its own initiative.
---

# Ship

Shipping is where a change becomes visible to others and hard to take back. It runs
only on João's typed direction, and only the step he directed: a push is not a
release, a pull request is not a merge.

Find the project's route before acting: README, CONTRIBUTING, Makefile, CI
configuration, deploy scripts. Use that route, not a generic equivalent. A route you
can't find is a question for João, with what you looked at.

Then watch it land: the pipeline's status, the deployed version, the pull request's
checks. A push you didn't see accepted isn't shipped. Report what is now live, for
whom, and anything the route did that you didn't expect.
