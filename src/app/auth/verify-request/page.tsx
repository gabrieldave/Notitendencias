import { redirect } from "next/navigation";

/** Magic link deshabilitado: solo Google OAuth. */
export default function VerifyRequestPage() {
  redirect("/login");
}
