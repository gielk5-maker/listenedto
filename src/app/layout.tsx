import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ListenedTo",
  description: "Track and rate the albums you've listened to.",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

// Draait synchroon vóór React hydration — zelfde patroon als next-themes
const themeScript = `(function(){try{var t={"amber":{"--accent":"#f59e0b","--accent-hover":"#fbbf24","--accent-dark":"#ea580c","--accent-text":"#0c0a09","--glow-1":"rgba(251,146,60,0.45)","--glow-2":"rgba(245,158,11,0.35)","--glow-3":"rgba(234,88,12,0.18)"},"red":{"--accent":"#ef4444","--accent-hover":"#f87171","--accent-dark":"#dc2626","--accent-text":"#ffffff","--glow-1":"rgba(239,68,68,0.45)","--glow-2":"rgba(220,38,38,0.35)","--glow-3":"rgba(185,28,28,0.18)"},"blue":{"--accent":"#3b82f6","--accent-hover":"#60a5fa","--accent-dark":"#1d4ed8","--accent-text":"#ffffff","--glow-1":"rgba(59,130,246,0.45)","--glow-2":"rgba(29,78,216,0.35)","--glow-3":"rgba(30,64,175,0.18)"},"yellow":{"--accent":"#eab308","--accent-hover":"#facc15","--accent-dark":"#ca8a04","--accent-text":"#0c0a09","--glow-1":"rgba(234,179,8,0.45)","--glow-2":"rgba(202,138,4,0.35)","--glow-3":"rgba(161,110,3,0.18)"},"purple":{"--accent":"#a855f7","--accent-hover":"#c084fc","--accent-dark":"#7e22ce","--accent-text":"#ffffff","--glow-1":"rgba(168,85,247,0.45)","--glow-2":"rgba(126,34,206,0.35)","--glow-3":"rgba(107,33,168,0.18)"},"green":{"--accent":"#22c55e","--accent-hover":"#4ade80","--accent-dark":"#15803d","--accent-text":"#0c0a09","--glow-1":"rgba(34,197,94,0.45)","--glow-2":"rgba(21,128,61,0.35)","--glow-3":"rgba(20,83,45,0.18)"}};var id=localStorage.getItem("theme")||"green";if(t[id]){var v=t[id];var r=document.documentElement;for(var k in v)r.style.setProperty(k,v[k]);}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  );
}
