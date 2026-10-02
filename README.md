# metang

CMU student emergency loan system. Next.js 16 + Prisma + Supabase Postgres. Vercel hosts a demo
only; the client receives the source code and the database schema.

## CMU Entra login

The app uses the OAuth 2.0 authorization-code flow with a client secret to sign in with a
CMU account. The client secret and access token are used only on the server. The browser
receives an encrypted, HTTP-only cookie containing the CMU BasicInfo response; access and
refresh tokens are not stored in the cookie.

1. Register the web redirect URI `http://localhost:8080/metang/api/auth/callback` in Entra. For
   federated sign-out, also register `http://localhost:8080/metang/login` (see
   [docs/CMU-ENTRA-SSO.md](docs/CMU-ENTRA-SSO.md)).
2. Add the delegated permission `Mis.Account.Read.Me.Basicinfo` from CMU API.
3. Copy `.env.example` to `.env` and enter the application ID, client secret, and a random
   `SESSION_SECRET` of at least 32 characters. For example, generate one with
   `openssl rand -base64 32`.
4. Start the development server on the port used by the registered callback:

   ```bash
   npm run dev
   ```

   This needs `INFISICAL_ENV` set in `.env`; it stops without it. With the Infisical CLI it runs
   under `infisical run --env <INFISICAL_ENV>`. Without the CLI it uses the values in the local
   `.env`. `npm run dev-normal` skips this wrapper.

Open <http://localhost:8080> and select **เข้าสู่ระบบด้วย CMU Account**.

For another host, set `CALLBACK_URL` to `https://<host>/<sub path>/api/auth/callback` and register
it in Entra, and use HTTPS. The app overwrites `post_logout_redirect_uri` in `LOGOUT_URL` with
`<origin>/<sub path>/login`, so register that address for federated sign-out. `<sub path>` is
`PUBLIC_SUBPATH` (`/metang` by default). See [docs/CMU-ENTRA-SSO.md](docs/CMU-ENTRA-SSO.md).

## Documents

Developers: [docs/documentation/developer-guide.en.md](docs/documentation/developer-guide.en.md) (Thai: [developer-guide.th.md](docs/documentation/developer-guide.th.md)). Client IT staff: [docs/documentation/maintenance-guide.en.md](docs/documentation/maintenance-guide.en.md) (Thai: [maintenance-guide.th.md](docs/documentation/maintenance-guide.th.md)).
