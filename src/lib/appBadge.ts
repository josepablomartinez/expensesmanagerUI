// App-icon badge (the little number/dot on the home-screen icon) via the
// Badging API. Only installed PWAs can show one; everywhere else the call is
// missing or rejected, so every failure is swallowed -- the badge is a
// convenience, never something the app depends on.
export function setAppBadge(count: number) {
  try {
    if (count > 0) {
      void navigator.setAppBadge?.(count)?.catch(() => {});
    } else {
      void navigator.clearAppBadge?.()?.catch(() => {});
    }
  } catch {
    // Unsupported or blocked: nothing to do.
  }
}

export function clearAppBadge() {
  setAppBadge(0);
}
