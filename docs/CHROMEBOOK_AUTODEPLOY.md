# BuildPair Chromebook automatic test hosting

BuildPair can host its private test build from the Chromebook without manual `git pull`, `npm ci` and restart commands after every change.

The Chromebook supervisor keeps one Cloudflare Quick Tunnel alive, runs the BuildPair web/API server, checks `origin/main` roughly every two minutes, validates new revisions, rebuilds the app and restarts only the application process. The tunnel remains running during normal code updates, so the temporary public test URL stays the same until the Chromebook Linux session or tunnel itself restarts.

## One-time installation

Open the Chromebook Linux Terminal and run:

```bash
cd ~/buildpair 2>/dev/null || cd ~/BuildPair
git pull --ff-only origin main
chmod +x scripts/chromebook-supervisor.sh scripts/chromebook-status.sh scripts/install-chromebook-autodeploy.sh
bash scripts/install-chromebook-autodeploy.sh install
bash scripts/chromebook-status.sh
```

The installer creates and starts a user-level systemd service named `buildpair-host.service`.

## What happens after that

While Chromebook Linux is running:

1. the Cloudflare Quick Tunnel remains alive,
2. BuildPair remains running on port 3000,
3. GitHub `main` is checked roughly every two minutes,
4. unchanged revisions do nothing,
5. dependency installation only runs when required,
6. new revisions run TypeScript checks and unit tests,
7. a passing revision is built and made live automatically,
8. a failed revision is recorded and not repeatedly retried, and
9. the previous working revision is restored when a new build fails validation.

Normal pushes to `main` therefore do **not** require somebody to type deployment commands on the Chromebook.

## Check status and get the current URL

```bash
cd ~/buildpair 2>/dev/null || cd ~/BuildPair
bash scripts/chromebook-status.sh
```

The public URL is also stored at:

```bash
cat ~/.cache/buildpair-host/public-url
```

Service logs:

```bash
journalctl --user -u buildpair-host.service -n 100 --no-pager
```

Follow logs live:

```bash
journalctl --user -u buildpair-host.service -f
```

## Restart the host manually

Normally this is unnecessary. If the Chromebook lost connectivity or the tunnel needs replacing:

```bash
bash scripts/install-chromebook-autodeploy.sh restart
```

A service/tunnel restart can produce a new `trycloudflare.com` address. Run `bash scripts/chromebook-status.sh` to see the current one.

## Remove automatic hosting

```bash
bash scripts/install-chromebook-autodeploy.sh uninstall
```

## Chromebook limitations

The Chromebook still needs to be powered on, online and awake with its Linux environment running. ChromeOS does not let a user-level Linux service wake a shut-down or suspended Chromebook from the internet.

This is deliberately private-test infrastructure. BuildPair's later public production host should be independent of the Chromebook.
