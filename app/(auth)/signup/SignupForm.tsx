"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithGoogle, signUpWithPassword } from "@/lib/actions/auth";

export function SignupForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  function handleSubmit(formData: FormData) {
    setErrors({});
    startTransition(async () => {
      const result = await signUpWithPassword(formData);
      if (!result.ok) {
        toast.error(result.error);
        if (result.fieldErrors) setErrors(result.fieldErrors);
        return;
      }
      toast.success("Check your inbox to confirm your email.");
      router.replace("/login");
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
          <Input id="email" name="email" type="email" autoComplete="email" required className="mt-1" />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email[0]}</p>}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="mt-1"
          />
          {errors.password && <p className="text-xs text-destructive mt-1">{errors.password[0]}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </Button>
        <p className="text-[11px] text-muted-foreground text-center">
          By signing up you agree to our{" "}
          <a className="underline">Terms</a> and <a className="underline">Privacy Policy</a>.
        </p>
      </form>
    </div>
  );
}
