# Golf Homes International Web

SvelteKit site for Golf Homes International.

## Developing

Install dependencies from the workspace root, then start the web app:

```sh
pnpm install
pnpm dev
```

For local development, copy `.env.example` to `.env.local`. Local and preview builds should use the Sanity `development` dataset:

```dotenv
PUBLIC_SANITY_PROJECT_ID=s88o8sjb
PUBLIC_SANITY_DATASET=development
```

## Vercel Environments

The Vercel project should keep production and preview pointed at different Sanity datasets:

- Production:
  - `PUBLIC_SANITY_PROJECT_ID=s88o8sjb`
  - `PUBLIC_SANITY_DATASET=production`
- Preview:
  - `PUBLIC_SANITY_PROJECT_ID=s88o8sjb`
  - `PUBLIC_SANITY_DATASET=development`

With the Vercel CLI, after logging in and linking the project, add or update them with:

```sh
printf 'production\n' | vercel env add PUBLIC_SANITY_DATASET production
printf 'development\n' | vercel env add PUBLIC_SANITY_DATASET preview
printf 's88o8sjb\n' | vercel env add PUBLIC_SANITY_PROJECT_ID production
printf 's88o8sjb\n' | vercel env add PUBLIC_SANITY_PROJECT_ID preview
```

## Building

To create a production version of your app:

```sh
pnpm build
```

You can preview the production build with `pnpm preview`.

The root `vercel.json` contains the Vercel build command for the workspace.
