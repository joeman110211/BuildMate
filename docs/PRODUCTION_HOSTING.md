# BuildPair production hosting

BuildPair is designed to run from one small Linux server with the website and Expo Router API routes hosted together.

## Production shape

- `https://www.buildpair.co.uk` is the canonical public address.
- `https://buildpair.co.uk` redirects to `www`.
- Caddy terminates HTTPS and renews certificates automatically.
- The Expo web application and API routes run in the `app` container on port 3000.
- The application container is not exposed directly to the public internet.
- `/downloads/*` is served directly by Caddy from the local `downloads/` directory.
- Search engine indexing is deliberately disabled during the quiet live-test stage with the `X-Robots-Tag: noindex, nofollow` response header. Remove that header when BuildPair is ready for normal public indexing.

## Recommended server

For the early live-testing phase use one Ubuntu LTS VPS with at least:

- 2 vCPU
- 2 GB RAM
- 40 GB SSD
- a public IPv4 address

The provider is intentionally not hard-coded into the project. The same stack can be moved to another VPS later without changing BuildPair's application architecture.

## Chromebook role

The Acer Chromebook is the BuildPair control centre, not the public production server. Use it for:

- GitHub and release control
- SSH access to the production server
- encrypted credential backup
- database/admin tooling
- deployment checks
- monitoring and logs
- APK release management

Do not keep production secrets in the Git repository or in unencrypted notes/files.

## One-time server setup

1. Create an Ubuntu LTS VPS and add an SSH key.
2. Install Git and Docker Engine with the Docker Compose plugin.
3. Clone the BuildPair repository to `/opt/buildpair`.
4. Copy `.env.example` to `/opt/buildpair/.env.production` and fill in the production values.
5. Protect it:

   ```bash
   chmod 600 /opt/buildpair/.env.production
   ```

6. At the domain/DNS provider, point these records to the server public IP:

   - `A` record for `@`
   - `A` record for `www`

7. Allow inbound TCP ports 22, 80 and 443. Allow UDP 443 for HTTP/3. Restrict SSH to your own IP where practical.
8. Run the deployment:

   ```bash
   cd /opt/buildpair
   bash scripts/deploy-production.sh
   ```

Caddy will request the public TLS certificates once the DNS records resolve to the server.

## Production environment values

At minimum, `.env.production` must contain the live values already used by BuildPair, including:

- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_API_URL=https://www.buildpair.co.uk`
- `CLERK_SECRET_KEY`
- `DATABASE_URL`
- Stripe keys/price IDs when billing is enabled
- `GEMINI_API_KEY`
- `RESEND_API_KEY`
- Cloudinary credentials
- `APP_URL=https://www.buildpair.co.uk`

Keep `BUILDPAIR_PREVIEW_DATA_ENABLED=false` for a real public marketplace.

## Android downloads

When an APK is approved for testing, place it on the production server at:

```text
/opt/buildpair/downloads/buildpair-android.apk
```

It will then be available from:

```text
https://www.buildpair.co.uk/downloads/buildpair-android.apk
```

Android can install a directly distributed APK after the user permits installation from that browser/source.

## iPhone/iPad

For early testing, iPhone users can use the BuildPair web app at `www.buildpair.co.uk`.

A normal public iOS native-app download should later point to the Apple App Store. TestFlight is the appropriate route for pre-release native iOS testing. A raw IPA is not a practical equivalent of Android's public APK download for ordinary users.

## Updating production

Once a change is merged to `main`, SSH to the server and run:

```bash
cd /opt/buildpair
bash scripts/deploy-production.sh
```

The script fast-forwards to the latest `main`, rebuilds the containers, restarts the stack and verifies the application health endpoint.

## Going fully public

The quiet-launch configuration deliberately prevents search-engine indexing. When the app is ready for discovery, remove this line from `infra/production/Caddyfile` and redeploy:

```text
X-Robots-Tag "noindex, nofollow"
```

At that point add the normal SEO/sitemap/search-console work as a separate launch task.
