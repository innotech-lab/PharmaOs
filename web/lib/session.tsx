"use client";

import { createContext, useContext } from "react";
import type { CurrentUser } from "./api";

// Le compte connecté, chargé une fois par la barre latérale et partagé avec les pages.
export const SessionContext = createContext<CurrentUser | null>(null);

export function useCurrentUser() {
  return useContext(SessionContext);
}

export function canManage(user: CurrentUser | null) {
  return user?.role === "OWNER" || user?.role === "MANAGER";
}
