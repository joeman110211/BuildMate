# BuildPair Chromebook automatic deploys

BuildPair staging can keep itself synced with `origin/main` while the Chromebook Linux environment is powered on, online and running.

The deployment script already protects itself with a file lock, validates the required environment, refuses dirty/diverged working trees, runs TypeScript and unit checks, builds the web app, restarts PM2, verifies local/public health and readiness, and rolls back a failed revision.

## One-time installation

From the BuildPair repository on the Chromebook:

```bash
cd /home/jloveridge1102/BuildPair
git pull --ff-only origin main
bash scripts/install-chromebook-autodeploy.sh install
```

This installs a user-level systemd timer. While Chromebook Linux is running it checks GitHub roughly every two minutes. If `main` has changed, `scripts/deploy-chromebook.sh` performs the guarded deployment. If nothing changed, it exits without rebuilding.

## Check it

```bash
bash scripts/install-chromebook-autodeploy.sh status
```

Recent deployment output is available through:

```bash
journalctl --user -u buildpair-autodeploy.service -n 100 --no-pager
```

The currently deployed revision can also be checked with:

```bash
curl -s https://staging.buildpair.co.uk/api/health
```

The `releaseSha` value should match the Git commit that staging is serving.

## Remove it

```bash
bash scripts/install-chromebook-autodeploy.sh uninstall
```

## Limits

This does not wake a powered-off or suspended Chromebook and cannot start a stopped ChromeOS Linux environment from the internet. Once Linux is running, however, normal pushes to `main` no longer require somebody to sit at the Chromebook and manually run the deploy command.
