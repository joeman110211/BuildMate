#!/usr/bin/env bash
set -Eeuo pipefail

# Installs the BuildPair Chromebook self-updating test host as a user-level
# systemd service. Once enabled, the Chromebook Linux environment keeps a
# Cloudflare Quick Tunnel alive and checks origin/main for updates roughly
# every two minutes.
#
# Usage:
#   bash scripts/install-chromebook-autodeploy.sh install
#   bash scripts/install-chromebook-autodeploy.sh status
#   bash scripts/install-chromebook-autodeploy.sh restart
#   bash scripts/install-chromebook-autodeploy.sh uninstall

ACTION="${1:-install}"
REPO_DIR="${BUILDPAIR_REPO_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
SYSTEMD_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
SERVICE_FILE="$SYSTEMD_DIR/buildpair-host.service"
SUPERVISOR="$REPO_DIR/scripts/chromebook-supervisor.sh"
OLD_SERVICE="$SYSTEMD_DIR/buildpair-autodeploy.service"
OLD_TIMER="$SYSTEMD_DIR/buildpair-autodeploy.timer"

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

install_service() {
  require_systemd_user
  cd "$REPO_DIR"

  # Chrome/Linux can report executable-bit-only changes for shell scripts.
  # BuildPair invokes these scripts explicitly with bash, so file mode changes
  # are irrelevant and should not block automatic deploys.
  git config core.fileMode false

  mkdir -p "$SYSTEMD_DIR"

  # Remove the older timer-based deploy setup if it was installed previously.
  systemctl --user disable --now buildpair-autodeploy.timer >/dev/null 2>&1 || true
  rm -f "$OLD_SERVICE" "$OLD_TIMER"

  cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=BuildPair Chromebook self-updating test host
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=$REPO_DIR
Environment=BUILDPAIR_REPO_DIR=$REPO_DIR
Environment=BUILDPAIR_CHECK_INTERVAL_SECONDS=120
ExecStart=/usr/bin/env bash $SUPERVISOR
Restart=always
RestartSec=10
TimeoutStopSec=20
Nice=10

[Install]
WantedBy=default.target
EOF

  systemctl --user daemon-reload
  systemctl --user enable --now buildpair-host.service

  echo
  echo "BuildPair Chromebook hosting is enabled."
  echo "Normal pushes to main will be checked automatically about every two minutes."
  echo "The public test URL stays the same until the Cloudflare tunnel/Linux session restarts."
  echo
  systemctl --user --no-pager --full status buildpair-host.service || true
}

show_status() {
  require_systemd_user
  systemctl --user --no-pager --full status buildpair-host.service || true
  echo
  if [[ -f "$REPO_DIR/scripts/chromebook-status.sh" ]]; then
    /usr/bin/env bash "$REPO_DIR/scripts/chromebook-status.sh" || true
  fi
}

restart_service() {
  require_systemd_user
  systemctl --user restart buildpair-host.service
  sleep 2
  systemctl --user --no-pager --full status buildpair-host.service || true
}

uninstall_service() {
  require_systemd_user
  systemctl --user disable --now buildpair-host.service >/dev/null 2>&1 || true
  systemctl --user disable --now buildpair-autodeploy.timer >/dev/null 2>&1 || true
  rm -f "$SERVICE_FILE" "$OLD_SERVICE" "$OLD_TIMER"
  systemctl --user daemon-reload
  systemctl --user reset-failed >/dev/null 2>&1 || true
  echo "BuildPair Chromebook automatic hosting has been removed."
}

case "$ACTION" in
  install) install_service ;;
  status) show_status ;;
  restart) restart_service ;;
  uninstall|remove) uninstall_service ;;
  *)
    echo "Usage: $0 {install|status|restart|uninstall}" >&2
    exit 2
    ;;
esac
