# ERP Bridge Security

## Authentication

- JWT bearer tokens signed with `JWT_SECRET`.
- Login requires organization name, email, and password.
- Inactive or suspended users cannot authenticate.
- Passwords are hashed with bcryptjs and never returned to clients.

## Organization Isolation

Users are linked to an organization. Admin member operations are scoped to the
current administrator's organization. A user cannot manage another organization's
members.

## Roles

- `ADMIN`: manage organization members and full project operations.
- `PROJECT_MANAGER`: manage migration projects and workflows.
- `CONSULTANT`: configure mappings and validate data.
- `VIEWER`: read-only access where enforced.

## Member Administration

Administrators can view member ID, name, email, role, and status. They can reset a
member password or delete a member account. Plaintext passwords are intentionally
not visible to administrators; reset is the secure replacement workflow. An admin
cannot delete their own account or another administrator through the member API.

## Connector Credentials

Live connector passwords are encrypted at rest with the configured
`CONNECTOR_ENCRYPTION_KEY`. Database credentials must be supplied through secure
environment variables in deployment environments.

## Deployment Rules

- Never commit `.env`, API keys, JWT secrets, or database passwords.
- Use HTTPS in production.
- Use least-privilege database accounts.
- Keep `FRONTEND_ORIGIN` restricted to the deployed frontend origin.
- Review Docker and npm dependency advisories before production deployment.
