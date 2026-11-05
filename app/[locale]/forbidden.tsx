import { AccessDenied } from "@/components/features/access/access-denied";

/** Rendered (with HTTP 403) whenever a page or layout calls `forbidden()`. */
export default function Forbidden() {
  return <AccessDenied />;
}
