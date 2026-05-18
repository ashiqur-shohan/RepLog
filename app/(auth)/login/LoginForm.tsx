"use client";

import { useRouter } from "next/navigation";
import { use, useTransition, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithGoogle, signInWithPassword } from "@/lib/actions/auth";

export function LoginForm({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ next?: string }>;
}) {
  const router = useRouter();
  const sp = use(searchParamsPromise);
  // Same-origin guard: accept only paths starting with a single "/" — block
  // protocol-relative redirects like "//evil.com".
  const next = sp.next && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/dashboard";
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  function handleSubmit(formData: FormData) {
    setErrors({});
    startTransition(async () => {
      const result = await signInWithPassword(formData);
      if (!result.ok) {
        toast.error(result.error);
        if (result.fieldErrors) setErrors(result.fieldErrors);
        return;
      }
      router.replace(next);
      router.refresh();
    });
  }

  async function handleGoogle() {
    const result = await signInWithGoogle();
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    window.location.href = result.data.url;
  }

  return (
    <div className="space-y-3">
      <Button type="button" variant="outline" className="w-full" onClick={handleGoogle}>
        Continue with Google
      </Button>
      <div className="flex items-center gap-3 text-xs text-muted-foreground py-1">
        <div className="flex-1 h-px bg-border" />
        or with email
        <div className="flex-1 h-px bg-border" />
      </div>
      <form action={handleSubmit} className="space-y-3">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p id="email-error" className="text-xs text-destructive mt-1">
              {errors.email[0]}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password && (
            <p id="password-error" className="text-xs text-destructive mt-1">
              {errors.password[0]}
            </p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
