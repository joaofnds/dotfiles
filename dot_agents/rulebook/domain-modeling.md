# Domain modeling

Naming things in the domain's language is in `engineering.md` under
Understanding the Problem. The project glossary is in `AGENTS.md` under Where things
live. The clause on domain-driven design for code is in `coding-style/core.md` under
Architectural Principles & Layering.

- **Model with whoever answers for the domain, in rounds, never alone.** Bring the
  candidate model to them with what you heard that does not fit it, a term used two
  ways, a phrase everyone works around, a correction an expert made in passing, and
  take their answer into the model before the next round, because a model built
  alone encodes the modeler's guess where the domain had an answer, and a model
  shown to them finished gets approved instead of modeled. The glossary side of
  this is in the shape skill under Settle the language. *(See: knowledge-crunching,
  making-implicit-concepts-explicit)*
- **The model and the code are one thing.** A change to the model changes the code
  that expresses it, and a change the code forces on the model goes back to the
  glossary and to the next round, because a model the code no longer expresses
  guides nobody. A model is judged by its usefulness, never by its truth, so a
  better one found late still goes in. Where taking it in widens a directed task,
  that is scope growth, and the Acting section of `AGENTS.md` owns the ask. *(See:
  model-driven-design, hands-on-modelers)*
- **Settle contexts and their relations before any tactical pattern.** One term
  used two ways is first a vocabulary mismatch for the round to settle. Where both
  meanings survive the round because two parts of the business need different
  models, give each its own bounded context and write the relation between them
  into the project's design records beside the glossary, as a context map. Choose
  each relation by the cost of integrating, an anti-corruption layer where the
  upstream model would corrupt yours and conformance where following it is cheaper.
  An aggregate drawn across two contexts is wrong in both. *(See: bounded-context,
  context-map)*
- **Spend the modeling effort on the core domain.** The core is the part that
  sets this business apart, the reason the software is worth writing. It is often
  misnamed, so test a candidate by what the business is uniquely good at, never by
  what is hardest or by what an outage would cost, since a commodity the business
  cannot run without is still a commodity. It gets the model, the rounds, and the
  refactoring. A supporting subdomain, specific to this business and not what sets it
  apart, gets a lighter model. A generic subdomain, one every business in the field
  needs the same way, gets the simplest thing that works, bought where a fit exists
  and fitting it costs less than writing it. *(See: core-domain, generic-subdomain)*
