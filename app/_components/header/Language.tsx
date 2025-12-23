"use client";

import { useRouter, usePathname } from "next/navigation";

export default function LanguageSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLang = pathname.endsWith("/ko") ? "ko" : "en";

  const getButtonClass = (lang: "en" | "ko") =>
    `px-3 py-1 rounded ${
      currentLang === lang
        ? "bg-blue-500 text-white"
        : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
    }`;

  return (
    <div className="flex space-x-2">
      <button onClick={() => router.push("/en")} className={getButtonClass("en")}>
        EN
      </button>
      <button onClick={() => router.push("/ko")} className={getButtonClass("ko")}
      >
        KO
      </button>
    </div>
  );
}
