import { requireUser } from "@/lib/auth/current-user";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireUser();
  return <AppShell profile={profile}>{children}</AppShell>;
}
