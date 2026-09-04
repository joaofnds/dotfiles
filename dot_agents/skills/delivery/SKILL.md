---
name: delivery
description: Governs how work leaves a session, the commit message, the releasable trunk, and the documents other people read. Use before committing or before writing a document others read.
---

# Delivery

## Commits

Write the message after reading the staged diff. It describes that diff and the
reason for it. The subject is lowercase and imperative. The body says why. Where
the repository uses a subject format of its own, such as Conventional Commits,
write that format.

## Every commit leaves main releasable

Small commits to main, everything in version control, and a schema change
compatible in both directions through the transition, because a deploy is not
atomic and a code rollback does not revert a migration. Done means released,
and releasing is João's direction to give.

## Documents

Records of decisions and of the domain are kept: ADRs, C4 documents, the
glossary. A document or comment that exists to excuse bad code is deleted and
the code fixed. No document narrates its own history or edits. That belongs in
the commit message.

Documentation, pull request reviews, issue replies, and announcements are read
by someone who wasn't here and may own the code in question. Give the reasons,
describe the system rather than the person, and say what it means for the
software's user.
