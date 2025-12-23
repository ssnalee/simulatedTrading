"use client";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function Displayed() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [hover, setHover] = useState(false);

  // 클라이언트에서만 렌더링
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isLight = theme === "light";

  // 이미지 선택
  const imgSrc = isLight
    ? hover
      ? "/images/light_active.png"
      : "/images/light.png"
    : hover
    ? "/images/dark_active.png"
    : "/images/dark.png";

  return (
    <button
      onClick={() => setTheme(isLight ? "dark" : "light")}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        border: "none",
        background: "transparent",
        padding: 0,
        cursor: "pointer",
      }}
    >
      <Image src={imgSrc} alt="theme-toggle" width={30} height={30} />
    </button>
  );
}
