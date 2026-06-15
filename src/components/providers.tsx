"use client";

// The app is dark-mode only. `data-theme="dark"` is pinned on <html> in the
// root layout, so there is no theme switching and no next-themes provider.
// This wrapper is kept as a single place to add future client-side providers.
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
