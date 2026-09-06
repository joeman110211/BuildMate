#!/usr/bin/env bash
set -Eeuo pipefail

# Install a user-level systemd timer that keeps BuildPair staging synced with
# origin/main while the Chromebook Linux environment is running.
#
# Usage:
#   bash scripts/install-chromebook-autodeploy.sh install
#   bash scripts/install-chromebook-autodeploy.sh status
#   bash scripts/install-chromebook-autodeploy.sh uninstall

ACTION="${1:-install}"
REPO_DIR="${BUILDPAIR_REPO_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
SYSTEMD_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
SERVICE_FILE="$SYSTEMD_DIR/buildpair-autodeploy.service"
TIMER_FILE="$SYSTEMD_DIR/buildpair-autodeploy.timer"
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
  if [[ ! -x "$DEPLOY_SCRIPT" ]]; then
    chmod +x "$DEPLOY_SCRIPT"
  fi

  mkdir -p "$SYSTEMD_DIR"

  cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=BuildPair staging automatic deploy
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
WorkingDirectory=$REPO_DIR
Environment=BUILDPAIR_REPO_DIR=$REPO_DIR
ExecStart=/usr/bin/env bash $DEPLOY_SCRIPT
TimeoutStartSec=15min
Nice=10
EOF

  cat > "$TIMER_FILE" <<'EOF'
[Unit]
Description=Check GitHub for a new BuildPair staging revision

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

  echo "BuildPair automatic deployment is enabled."
  echo "It checks origin/main roughly every two minutes while Chromebook Linux is running."
  systemctl --user --no-pager status buildpair-autodeploy.timer || true
}

show_status() {
  require_systemd_user
  systemctl --user --no-pager status buildpair-autodeploy.timer || true
  echo
  systemctl --user --no-pager status buildpair-autodeploy.service || true
}

uninstall_timer() {
  require_systemd_user
  systemctl --user disable --now buildpair-autodeploy.timer >/dev/null 2>&1 || true
  rm -f "$SERVICE_FILE" "$TIMER_FILE"
  systemctl --user daemon-reload
  systemctl --user reset-failed >/dev/null 2>&1 || true
  echo "BuildPair automatic deployment has been removed."
}

case "$ACTION" in
  install) install_timer ;;
  status) show_status ;;
  uninstall|remove) uninstall_timer ;;
  *)
    echo "Usage: $0 {install|status|uninstall}" >&2
    exit 2
    ;;
esac
