import type { Metadata } from "next";
import "./globals.css";
import "./cast-overrides.css";
import "./lore.css";
import "./lore-reader-dark.css";
import "./roleplay-visuals.css";
import { RoleplayVisuals } from "@/components/roleplay-visuals";

export const metadata: Metadata = {
  title: "Bitterroot — An Interactive Saga",
  description: "Enter a persistent dark-fantasy world of survival, freedom, and remembered consequences.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<RoleplayVisuals /></body></html>;
}
