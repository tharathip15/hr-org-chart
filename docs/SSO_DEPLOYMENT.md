# HR Silent SSO Deployment

## Entra

- The HR app is single-tenant.
- Register these exact HR SPA redirect URIs for Preview and Production:
  - `https://hr-org-chart-two.vercel.app/`
  - `https://hr-org-chart-tharathipi-1965-pfig.vercel.app/`
- `PFIG.HR.Admin` and `PFIG.Portal.Admin` are enabled for Users/Groups.

## Vercel

- `MICROSOFT_TENANT_ID`, `MICROSOFT_CLIENT_ID`, and `MICROSOFT_CLIENT_SECRET`
  exist in Preview and Production. `MICROSOFT_CLIENT_SECRET` is server-only and
  is required for the server-side Microsoft Graph sync; browser PKCE and silent
  SSO do not use it.
- A sensitive, server-only, 32+ character `HR_SESSION_SECRET` exists separately
  in Preview and Production. Never expose it with a public prefix or commit its
  value.
- `VITE_HR_ENABLED` is set as intended for each environment.
- Existing Supabase and Blob variables remain unchanged.

## Deployment order

Deploy in this order: HR Preview -> HR Production -> Portal Preview -> Portal Production.

## Silent SSO behavior

For a `prompt=none` silent login, `login_required`, `interaction_required`,
`consent_required`, and unexpected silent failures all continue as an anonymous
Viewer without a blocking overlay or redirect loop.

## Smoke tests

1. Open HR directly in a clean session and confirm anonymous viewing.
2. Open HR with `?pfig_sso=1` while signed in to Portal and confirm no visible
   Microsoft prompt.
3. Confirm an HR/Portal Admin can perform a harmless save.
4. Confirm a Viewer receives `403` for a mutation.
5. Confirm a missing CSRF header receives `403`.
6. Sign out from HR and confirm Portal remains signed in.

## Rollback

Restore the previous HR deployment before restoring Portal. Keep the prior
deployment IDs until runtime logs and all smoke tests are clean.
