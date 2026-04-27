import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ShopNow — Pakistan's Favorite Online Store",
  description: "Shop the latest electronics, fashion, home appliances and more at the best prices. Fast delivery all over Pakistan.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full flex flex-col`}>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: "12px",
              background: "#1a1a1a",
              color: "#fff",
              fontSize: "14px",
            },
            success: {
              iconTheme: { primary: "#E40046", secondary: "#fff" },
            },
          }}
        />
      </body>
    </html>
  );
}
