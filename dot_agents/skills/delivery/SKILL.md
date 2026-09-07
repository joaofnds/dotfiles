---
name: delivery
description: Governs how work leaves a session, the commit message, the releasable trunk, and the documents other people read. Use before committing or before writing a document others read.
---

# Delivery

## Commits

Write the message after reading the staged diff. It describes that diff and the
reason for it, for an engineer who has a clone of the repository and nothing else,
no card, no issue tracker, no document on your machine, and nobody to ask. That
reader understands the change from the subject, the body, and the diff alone. The
subject is lowercase and imperative. Where the repository uses a subject format of
its own, such as Conventional Commits, write that format. Many commits need no body,
because the subject already says why.

Put in the body what that reader needs and cannot get from the diff. Where the diff
settles a question that had more than one answer, say why this answer, and name a
rejected one where they would otherwise repeat it, with what ruled it out. Where a
measurement decided it, give the numbers and the machine they ran on. Where an edit
grows a file, say what the new lines replaced, or that they replaced nothing. Where
an ADR in the repository carries the reasoning, name its path instead of repeating
it.

Cite only what that reader can reach, a path or a commit hash in the repository, or
a URL that opens for anyone who can clone it, an RFC, a standard, a vendor advisory,
a pull request or issue in the repository's own forge. State what a card, an issue
tracker, a local document, a transcript, or a path on your machine holds, since none
of those reach them.

Leave out the session's own account of the work, how long it took, what you tried
first, how many reviewers, runs, tests, or files were involved, and that the checks
pass, since that reader acts on none of it. The body stops when it has said what the
diff cannot show, and its length follows the decision rather than the diff.

## Every commit leaves main releasable

Small commits to main, everything in version control, and a schema change
compatible in both directions through the transition, because a deploy is not
atomic and a code rollback does not revert a migration. Done means released.

## Documents

Records of decisions and of the domain are kept: ADRs, C4 documents, the
glossary. A document or comment that exists to excuse bad code is deleted and
the code fixed. No document narrates its own history or edits. That belongs in
the commit message.

Documentation, pull request reviews, issue replies, and announcements are read
by someone who wasn't here and may own the code in question. Give the reasons,
describe the system rather than the person, and say what it means for the
software's user.
