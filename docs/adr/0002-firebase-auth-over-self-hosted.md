# Firebase Auth over self-hosted identities

We chose Firebase Authentication as the identity provider for the Wedding Planner instead of self-hosted email/password with bcrypt + JWTs.

**Considered Options**

- Self-hosted auth — full control, no external dependency, but we would have to build password reset, Google OAuth, and (later) phone/SMS flows ourselves.
- Firebase Auth — chosen. Email/password and Google sign-in come out of the box; phone (SMS) auth can be enabled later with no rework. The API verifies Firebase ID tokens on every request instead of issuing its own JWTs.

**Consequences**

- A Firebase project is required for all environments; the web app uses the Firebase client SDK, the API uses the Admin SDK for token verification.
- User identity lives in Firebase; the API syncs a `users` document in MongoDB on first authenticated request.
- Hard to reverse: migrating identities off Firebase later would require a password-reset round-trip for every user.
