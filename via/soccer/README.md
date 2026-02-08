World Cup Fan Passport
======================

The Problem
-----------

Fans want to publicly pledge allegiance to a unique World Cup 2026 team in a way that is cryptographically verifiable.  We need a solution where the pledge is signed by the fan's VIA wallet, making it tamper-proof and independently verifiable.

The Solution
------------

The app uses VIA ZTF to authenticate users via Keycloak with the ZTF plugin. WalletConnect settings and session data are extracted from the user profile.  Once authenticated, the user selects a team and signs a pledge message through their VIA wallet.  The signature is stored alongside the pledge data and can be verified by anyone using the public `/verify` page, without requiring authentication.

Architecture
------------

The app is implemented in TypeScript using Next.js and Tailwind CSS.  The source code can be found under `src/`.

The app is built on top of the ZTF step up auth tutorial.

The authentication leverages Keycloak and the WalletConnect session info is extracted from the Keycloak userinfo endpoint.  This gives the app access to the user's wallet for signing operations.

Pages requiring authentication (`/`, `/pick-team`, `/passport`) live under `src/app/(auth)/` and are wrapped by a `ZTFProvider`.  The public verification page (`/verify/[address]`) lives outside the auth route group and requires no login.

The signing logic is in `src/lib/signature.ts`.  A pledge message is serialized to JSON and signed via `personal_sign`.  Verification uses `ethers.utils.verifyMessage` to recover the signer address from the signature.

Passport data is stored in an in-memory map (`src/lib/store.ts`).  The API routes under `src/app/api/` handle team listing, passport creation, and passport retrieval.

Demo
----

[Watch the demo video](https://www.loom.com/share/f90db1c7676e48a384286d37fee86b35)

Setup
-----

Install dependencies:

```
bun install
```

Run the development server on port 80 (required for the ZTF redirect):

```
bun run dev -- -p 80
```

Open `http://localhost` in your browser.  You will be redirected to the VIA ZTF login page.  After authenticating with your VIA wallet, you can select a team, sign a pledge, and view your passport.
