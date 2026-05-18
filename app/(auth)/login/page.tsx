import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-center">Welcome back</h1>
      <p className="text-sm text-muted-foreground text-center mt-1">Sign in to keep your streak alive.</p>
      <div className="mt-8">
        <LoginForm searchParamsPromise={searchParams} />
      </div>
      <p className="text-center text-sm text-muted-foreground mt-6">
        Don't have an account?{" "}
        <Link href="/signup" className="text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
