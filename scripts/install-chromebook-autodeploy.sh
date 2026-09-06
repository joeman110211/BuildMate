#!/usr/bin/env bash
set -Eeuo pipefail

# Installs BuildPair automatic deploys for the existing Chromebook runtime:
# PM2 runs BuildPair, and the named Cloudflare tunnel is managed separately.
# This installer only adds a user-level systemd timer that checks GitHub and
# deploys new main revisions safely.

ACTION="${1:-install}"
REPO_DIR="${BUILDPAIR_REPO_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
SYSTEMD_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
SERVICE_FILE="$SYSTEMD_DIR/buildpair-autodeploy.service"
TIMER_FILE="$SYSTEMD_DIR/buildpair-autodeploy.timer"
OLD_HOST_SERVICE="$SYSTEMD_DIR/buildpair-host.service"
DEPLOY_SCRIPT="$REPO_DIR/scripts/deploy-chromebook.sh"

require_systemd_user() {
  if ! command -v systemctl >/dev/null 2>&1; then
    echo "systemctl is not available in this Linux environment." >&2
    exit 1
  fi
  if ! systemctl --user show-environment >/dev/null 2>&1; then
    echo "The user systemd session is not available. Open the Chromebook Linux Terminal and run this installer there." >&2
    exit 1
  fi
}

install_timer() {
  require_systemd_user
  cd "$REPO_DIR"
  git config core.fileMode false
  mkdir -p "$SYSTEMD_DIR"

  # Remove the superseded Quick-Tunnel supervisor if it was installed.
  systemctl --user disable --now buildpair-host.service >/dev/null 2>&1 || true
  rm -f "$OLD_HOST_SERVICE"

  cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=BuildPair Chromebook automatic deploy
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
WorkingDirectory=$REPO_DIR
Environment=BUILDPAIR_REPO_DIR=$REPO_DIR
ExecStart=/usr/bin/env bash $DEPLOY_SCRIPT
TimeoutStartSec=20min
Nice=10
EOF

  cat > "$TIMER_FILE" <<'EOF'
[Unit]
Description=Check GitHub for BuildPair updates

[Timer]
OnBootSec=2min
OnUnitActiveSec=2min
RandomizedDelaySec=15s
Persistent=true
Unit=buildpair-autodeploy.service

[Install]
WantedBy=timers.target
EOF

  systemctl --user daemon-reload
  systemctl --user enable --now buildpair-autodeploy.timer

  echo
  echo "BuildPair automatic deployment is enabled."
  echo "The Chromebook will check origin/main roughly every two minutes while Linux is running."
  echo "Existing PM2 and Cloudflare services are left in place."
  echo
  systemctl --user --no-pager --full status buildpair-autodeploy.timer || true
}

show_status() {
  require_systemd_user
  systemctl --user --no-pager --full status buildpair-autodeploy.timer || true
  echo
  systemctl --user --no-pager --full status buildpair-autodeploy.service || true
  echo
  /usr/bin/env bash "$REPO_DIR/scripts/chromebook-status.sh" || true
}

run_now() {
  require_systemd_user
  systemctl --user start buildpair-autodeploy.service
  systemctl --user --no-pager --full status buildpair-autodeploy.service || true
}

uninstall_timer() {
  require_systemd_user
  systemctl --user disable --now buildpair-autodeploy.timer >/dev/null 2>&1 || true
  systemctl --user stop buildpair-autodeploy.service >/dev/null 2>&1 || true
  systemctl --user disable --now buildpair-host.service >/dev/null 2>&1 || true
  rm -f "$SERVICE_FILE" "$TIMER_FILE" "$OLD_HOST_SERVICE"
  systemctl --user daemon-reload
  systemctl --user reset-failed >/dev/null 2>&1 || true
  echo "BuildPair automatic deployment has been removed. PM2 and Cloudflare were not touched."
}

case "$ACTION" in
  install) install_timer ;;
  status) show_status ;;
  run-now|run) run_now ;;
  uninstall|remove) uninstall_timer ;;
  *)
    echo "Usage: $0 {install|status|run-now|uninstall}" >&2
    exit 2
    ;;
esac
