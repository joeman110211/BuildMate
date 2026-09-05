# BuildPair Chromebook test host

This is the zero-cost, pre-public testing setup for BuildPair. It runs the real Expo Router web/API server inside the Chromebook Linux development environment and exposes it through a Cloudflare Quick Tunnel.

It is intentionally for a handful of testers, not production. The Chromebook must remain powered on, awake, online, and the Linux environment must remain running.

## One-time Chromebook setup

### 1. Keep ChromeOS awake while testing

In ChromeOS open **Settings → System preferences → Power**.

- Set **While inactive and plugged in** to **Keep display on**.
- Turn **Sleep when lid is closed** off if the Chromebook may be closed while testing.
- Keep the Chromebook connected to power during test sessions.

### 2. Enable Linux

Open **Settings → About ChromeOS → Developers → Linux development environment → Set up**.

The Linux environment is Debian. Allocate enough Linux storage for the repository, Node dependencies and build output; around 20–30 GB is comfortable if the Chromebook has the space available.

### 3. Install base tools

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y git openssh-client curl nano tmux ca-certificates gnupg
```

### 4. Install Node.js 22

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x -o nodesource_setup.sh
sudo -E bash nodesource_setup.sh
sudo apt install -y nodejs
rm nodesource_setup.sh
node --version
npm --version
```

BuildPair requires Node 22.12 or newer.

### 5. Install cloudflared

```bash
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update
sudo apt install -y cloudflared
cloudflared --version
```

No Cloudflare account is required for the Quick Tunnel used by this test setup.

### 6. Clone BuildPair

```bash
cd ~
git clone https://github.com/joeman110211/BuildMate.git buildpair
cd ~/buildpair
npm ci
```

If `~/buildpair` already exists instead:

```bash
cd ~/buildpair
git pull --ff-only origin main
npm ci
```

### 7. Create the local environment file

```bash
cd ~/buildpair
cp .env.example .env.local
nano .env.local
```

For testing, use BuildPair's existing development/test credentials where possible. The launcher requires:

- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `DATABASE_URL`
- `GEMINI_API_KEY`
- `RESEND_API_KEY`
- `INVOICE_FROM_EMAIL`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Stripe values may remain blank during the current test phase. Keep `BUILDPAIR_PREVIEW_DATA_ENABLED=false`.

Do not commit `.env.local`. The repository ignores it.

## Start BuildPair

From the Linux Terminal:

```bash
cd ~/buildpair
git pull --ff-only origin main
npm ci
bash scripts/start-chromebook-test.sh
```

The script:

1. starts a free Cloudflare Quick Tunnel,
2. obtains the temporary `https://...trycloudflare.com` URL,
3. builds BuildPair using that URL,
4. starts the production-style Node web/API server,
5. checks `/api/health` and `/api/readiness`, and
6. prints the URL to share with testers.

The script automatically runs inside a tmux session named `buildpair-test`, so closing the Terminal window does not stop it as long as ChromeOS and its Linux environment remain awake and running.

Detach without stopping it with **Ctrl+B**, then **D**.

## Useful commands

Reattach to the running host:

```bash
tmux attach -t buildpair-test
```

Show the current public test URL:

```bash
cat ~/.cache/buildpair-test/public-url
```

Stop the test host:

```bash
tmux kill-session -t buildpair-test
```

View application logs:

```bash
tail -f ~/.cache/buildpair-test/app.log
```

View tunnel logs:

```bash
tail -f ~/.cache/buildpair-test/cloudflared.log
```

## Important limitations

A Quick Tunnel URL changes when the tunnel process restarts. That is acceptable for this small private test phase. Send testers the newly generated URL after a restart.

The site becomes unavailable if the Chromebook sleeps, shuts down, restarts, signs out in a way that stops Linux, loses internet access, or the Linux environment is stopped. A dark/dim display alone does not matter if ChromeOS itself remains awake.

Cloudflare Quick Tunnels are development/testing infrastructure only. They are not the later public BuildPair production architecture.
