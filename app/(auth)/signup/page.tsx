import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "Create your account" };

export default function SignupPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-center">Create your account</h1>
      <p className="text-sm text-muted-foreground text-center mt-1">
        Track your home workouts in seconds.
      </p>
      <div className="mt-8">
        <SignupForm />
      </div>
      <p className="text-center text-sm text-muted-foreground mt-6">
        Have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
