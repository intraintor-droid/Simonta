import { LoginForm } from "@/components/shared/login-form";
import { Landmark } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
            <Landmark className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">SIMONTA</h1>
          <p className="text-sm text-slate-500">
            Sistem Monitoring Pekerjaan
            <br />
            Kantor Pertanahan Kota Cimahi
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
