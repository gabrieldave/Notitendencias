import type { User } from "@/db/schema";
import { auth } from "@/auth";

export type PublicUser = Pick<User, "id" | "email" | "name" | "plan" | "status" | "role">;

export async function getOptionalSessionUser(): Promise<PublicUser | null> {
  const session = await auth();
  const u = session?.user;
  if (!u?.id || !u.email) return null;
  if (u.status !== "active") return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name ?? null,
    plan: u.plan,
    status: u.status,
    role: u.role,
  };
}
