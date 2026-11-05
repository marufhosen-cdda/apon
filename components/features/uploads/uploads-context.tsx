"use client";

import { createContext, useContext } from "react";

/** Whether Cloudinary is configured server-side (credentials themselves never reach the browser). */
const UploadsContext = createContext(false);

export function UploadsProvider({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  return <UploadsContext.Provider value={enabled}>{children}</UploadsContext.Provider>;
}

export const useUploadsEnabled = () => useContext(UploadsContext);
