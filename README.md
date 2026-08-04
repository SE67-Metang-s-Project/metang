# Me_Tang

CMU student emergency loan system. Next.js 16 + Drizzle + Neon Postgres, deployed on Vercel.

## CMU Entra login

The app uses the OAuth 2.0 authorization-code flow with a client secret to sign in with a
CMU account. The client secret and access token are used only on the server. The browser
receives an encrypted, HTTP-only cookie containing the CMU BasicInfo response; access and
refresh tokens are not stored in the cookie.

1. Register the web redirect URI `http://localhost:8080/api/auth/callback` in Entra.
2. Add the delegated permission `Mis.Account.Read.Me.Basicinfo` from CMU API.
3. Copy `.env.example` to `.env` and enter the application ID, client secret, and a random
   `SESSION_SECRET` of at least 32 characters. For example, generate one with
   `openssl rand -base64 32`.
4. Start the development server on the port used by the registered callback:

   ```bash
   npm run dev
   ```

   This uses Infisical when its CLI is installed; otherwise Next.js loads the teammate's
   local `.env` file as usual.

Open <http://localhost:8080> and select **เข้าสู่ระบบด้วย CMU Account**.

For deployment, replace both localhost URLs in `CALLBACK_URL` and `LOGOUT_URL`, register the
production callback URI in Entra, and use HTTPS.
