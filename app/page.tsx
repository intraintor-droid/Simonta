import { redirect } from "next/navigation";

// Root selalu diarahkan ke /dashboard (yang lalu diproteksi middleware ke /login
// jika belum terautentikasi) — bukan halaman marketing/publik.
export default function Home() {
  redirect("/dashboard");
}
