import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BreviAI — AI Meeting Notes & Action Items",
  description:
    "Upload or record meetings, get transcripts, summaries, and action items automatically.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <script
          id="fetch-protection"
          dangerouslySetInnerHTML={{
            __html: `(function(){
              try {
                if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
                  var _orig = window.fetch.bind(window);
                  var _curr = _orig;
                  try {
                    Object.defineProperty(window, 'fetch', {
                      get: function() { return _curr; },
                      set: function(v) { _curr = (typeof v === 'function') ? v : _orig; },
                      configurable: true,
                      enumerable: true
                    });
                  } catch (e) {}
                }
              } catch (err) {}
            })();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
