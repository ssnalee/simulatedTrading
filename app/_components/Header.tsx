"use client";
import styled from "styled-components";
import Displayed from "./header/Displayed";
import Language from "./header/Language";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect } from "react";

export default function Header() {
  const t = useTranslations("trading");
  return (
    <header
      className="fixed w-full h-20 flex items-center justify-between px-12 
  bg-gray-800 text-white dark:bg-white dark:text-black"
    >
      <div></div>
      <div>{t("title.01")}</div>
      <div className="flex items-center gap-4">
        <Displayed />
        <Language />
        <button className="px-3 py-1 border rounded">{t("login")}</button>
      </div>
    </header>
  );
}
