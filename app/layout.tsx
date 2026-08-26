import type { Metadata } from "next";
import "./globals.css";
import "./cast-overrides.css";
import "./lore.css";

export const metadata: Metadata = {
  title: "Bitterroot — An Interactive Saga",
  description: "Enter a persistent dark-fantasy world of survival, freedom, and remembered consequences.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
