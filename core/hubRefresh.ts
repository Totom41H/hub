let refreshCallback: (() => void) | null = null;

export function configureHubRefresh(
  callback: () => void
) {
  refreshCallback = callback;
}

export function notifyHubChange() {
  refreshCallback?.();
}