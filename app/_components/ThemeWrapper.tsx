"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { useEffect, useState } from "react";

function ThemeBodyWrapper({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const body = document.body;
    if (resolvedTheme === "dark") {
      body.classList.add("dark");
    } else {
      body.classList.remove("dark");
    }
  }, [resolvedTheme]);

  return <>{children}</>;
}

export default function ThemeWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <ThemeBodyWrapper>{children}</ThemeBodyWrapper>
    </ThemeProvider>
  );
}
