import type { Metadata } from "next";
import Link from "next/link";
import { ForgotForm } from "./ForgotForm";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-center">Reset your password</h1>
      <p className="text-sm text-muted-foreground text-center mt-1">
        We'll send a link to your inbox.
      </p>
      <div className="mt-8">
        <ForgotForm />
      </div>
      <p className="text-center text-sm text-muted-foreground mt-6">
        <Link href="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
