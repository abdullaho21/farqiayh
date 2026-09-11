import type { Metadata } from "next";
import { AppProvider } from "@/components/app-provider";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Farqiah 2026 — Make your vote count",
    template: "%s · Farqiah 2026",
  },
  description:
    "A place for your group to decide. Vote in live polls, follow the results, and choose the finalists. No account needed.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          <SiteHeader />
          <main id="main" className="main-shell">
            {children}
          </main>
          <footer className="site-footer">
            <span>
              Farqiah <strong>2026</strong>
            </span>
            <span>Good choices start with everyone.</span>
          </footer>
        </AppProvider>
      </body>
    </html>
  );
}
