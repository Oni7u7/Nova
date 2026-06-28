This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
#hola que tas haciendo
## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

crea el .env.local y coloca lo siguiente:# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://oittuodrnoapoesvfxsh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pdHR1b2Rybm9hcG9lc3ZmeHNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MDAxMjcsImV4cCI6MjA5ODA3NjEyN30.jx1hMFGYqST8PqgopTuXcnytvCdIi644lUbGLVSFbQs
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pdHR1b2Rybm9hcG9lc3ZmeHNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjUwMDEyNywiZXhwIjoyMDk4MDc2MTI3fQ.jUNVNpHatbVfgyXcQ5oIH4K6kizvm1_M2UnLIsTAEeQ

# Auth
JWT_SECRET=a9f35ae54844cc5e35b6c3ffeb70197a0da4939d4a483549010cd62abfd64e3dae2749a08fd2fb4a3a48ce59fd160312e3376edbcbcbdc0cd7d2fa33dc0e579d

# Encriptación wallets Stellar
ENCRYPTION_MASTER_KEY=adbe760ec80cb74692ce8a1126ef809841236d5a553825190e17a699f5bcfd5b

# Stellar
STELLAR_NETWORK=testnet
USDC_ASSET_CODE=USDC
USDC_ISSUER=GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
ANCHOR_HOME_DOMAIN=testanchor.stellar.org

# App URL
NEXT_PUBLIC_APP_URL=https://nova-xi-one.vercel.app