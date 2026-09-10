import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ORBITEX Exchange",
  description: "ORBITEX crypto exchange platform",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
