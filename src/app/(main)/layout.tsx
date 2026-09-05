import NavBar from "@/components/NavBar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50">
      <NavBar />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
