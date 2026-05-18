import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh grid place-items-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 mb-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            <div className="w-12 h-12 rounded-lg bg-primary grid place-items-center font-mono text-xl font-semibold text-primary-foreground">
              R
            </div>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
