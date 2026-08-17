# MongoDB over Postgres

Greenfield wedding-planning SaaS. We chose MongoDB with Mongoose as the primary database over Postgres with Prisma — per product-owner preference, not technical necessity.

**Considered Options**

- Postgres + Prisma — strongest relational integrity, migrations, and multi-document transactions; would have been the obvious default for a data model with many cross-references.
- MongoDB + Mongoose — chosen. Wedding-centric documents (tasks, expenses, vendors) map naturally to collections and embedding; the app's write patterns are single-collection, so limited multi-document transactions are rarely needed.

**Consequences**

- No SQL joins; cross-collection reads are composed in the API layer.
- Schema validation lives in Mongoose rather than database constraints; the API is the only writer, which mitigates this.
- Swapping to Postgres later would require a rewrite of the data layer, not just the driver.
