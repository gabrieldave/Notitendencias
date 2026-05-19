import type { User } from "@/db/schema";
import { auth } from "@/auth";
import { syncPremiumPlanFromSubscriber } from "@/lib/radar-access";

export type PublicUser = Pick<User, "id" | "email" | "name" | "plan" | "status" | "role">;

export async function getOptionalSessionUser(): Promise<PublicUser | null> {
  const session = await auth();
  const u = session?.user;
  if (!u?.id || !u.email) return null;
  if (u.status !== "active") return null;

  const plan = await syncPremiumPlanFromSubscriber(u.id, u.email);

  return {
    id: u.id,
    email: u.email,
    name: u.name ?? null,
    plan,
    status: u.status,
    role: u.role,
  };
}
