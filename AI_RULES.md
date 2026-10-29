# Project Guidance

## Tech stack
- TypeScript across the workspace, using TypeScript 5.9.
- Node.js 24 runtime.
- pnpm workspaces for package management and monorepo orchestration.
- Express 5 for the API server.
- PostgreSQL for persistent relational data.
- Drizzle ORM for database schema and queries.
- Zod (`zod/v4`) for runtime validation; `drizzle-zod` for schemas derived from database models.
- Orval for generating API clients and schemas from the OpenAPI contract.
- esbuild for producing CommonJS bundles.
- Prettier for code formatting.

## Library and tooling rules
- Use **pnpm** for installing dependencies and running workspace scripts; do not use npm or yarn. Keep package manager changes compatible with the workspace configuration.
- Use **Express 5** for API routes and middleware. Keep HTTP concerns in the API server rather than placing them in database or shared-contract packages.
- Use **Drizzle ORM** for PostgreSQL schema definitions and database access. Do not introduce a second ORM or query builder.
- Use **Zod** at external input boundaries to validate request data. Prefer `drizzle-zod` when a validation schema should follow a Drizzle model.
- Treat the **OpenAPI specification** as the source of truth for API contracts. Regenerate clients and schemas with **Orval** instead of hand-editing generated files.
- Use **TypeScript** for application and tooling code; avoid adding plain JavaScript when a TypeScript equivalent fits.
- Use **esbuild** for production bundles and the existing workspace scripts for builds and typechecks; do not add another bundler without an explicit need.
- Run **Prettier** for formatting and follow the repository's existing style.
- Keep dependencies in the workspace package that owns their use; avoid duplicating dependencies across packages without a reason.
