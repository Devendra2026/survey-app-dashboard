import { Providers } from "@/components/provider/provider";
import type { Metadata } from "next";
import { Fira_Code, Fira_Sans, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const firaSans = Fira_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const firaCode = Fira_Code({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "SDV EDUTECH — Survey Dashboard",
  description: "SDV EDUTECH enterprise GIS property survey management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning={true}
      className={`${firaSans.variable} ${plusJakarta.variable} ${firaCode.variable} h-full overflow-hidden antialiased`}
    >
      <body className="flex h-full min-h-0 flex-col overflow-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
