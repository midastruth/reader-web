# Environment Variables

The environment variables are used to configure the application. They can be set in the `.env` file or directly in bash when running the application.

Remember that you have to rebuild and restart the app for the changes to take effect since environment variables in Next.js are embedded at build time.

## Manifest

By default, the `/read/manifest/[base64url-encoded-manifest]` route is disabled in production for security reasons. Environment variables are therefore provided to enable it, as well as to configure the allowed domains for fetching the publication.

### MANIFEST_ROUTE_FORCE_ENABLE

Set to true to enable manifest route in production.

```bash
MANIFEST_ROUTE_FORCE_ENABLE=true
```

### MANIFEST_ALLOWED_DOMAINS

Comma-separated list of allowed domains for manifest URLs in production.

```bash
MANIFEST_ALLOWED_DOMAINS="publication-server.readium.org"
```

You can also use `*` to allow all domains.

## Book-aware backend

### NEXT_PUBLIC_BOOK_AWARE_URL

Browser-facing book-aware backend URL. Set this to the public backend origin (not the Next.js `/api/book-aware` proxy) so large EPUB uploads go directly to book-aware and do not hit Vercel function body limits.

```bash
NEXT_PUBLIC_BOOK_AWARE_URL="https://book-aware.example.com"
```

The book-aware backend must allow the frontend origin via CORS, for example:

```bash
BOOK_AWARE_CORS_ORIGIN="https://read.midaspenn.com"
```

## Assets

By default, the assets are fetched from the same domain as the application. An environment variable is therefore provided to configure the base path if needed.

### ASSET_PREFIX

Set the base path for assets (e.g., CDN URL or subdirectory).

```bash
ASSET_PREFIX="https://cdn.example.com"
```