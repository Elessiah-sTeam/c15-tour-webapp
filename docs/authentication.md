# Authentication Flow

This repository now includes a complete front-end authentication flow with login and registration.

## What was added

- A new registration page at `/register`.
- A link from the login page to the registration page.
- A link from the registration page back to login.
- Automatic login after registration when the API returns a `token`.
- A success notice on the login page when registration completes without returning a token.

## Pages

### `/login`

- Submits credentials to `POST /auth/login`.
- Stores the returned token through the existing auth context.
- Redirects to `/` on success.
- Shows an inline error when authentication fails.

### `/register`

- Collects `username`, `password`, and password confirmation.
- Validates that both passwords match before calling the API.
- Submits the payload to `POST /auth/register`.
- If the API returns a token, the user is logged in immediately.
- Otherwise, the user is redirected to `/login` with a success notice.

## UI notes

- The registration screen reuses the same visual language as the login screen.
- Both pages share the same card layout and footer link styling.

## Verification

- `npm run lint`
- `npm run build`

