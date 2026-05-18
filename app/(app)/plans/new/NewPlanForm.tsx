"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPlan } from "@/lib/actions/plans";

export function NewPlanForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  function handleSubmit(fd: FormData) {
    setErrors({});
    startTransition(async () => {
      const r = await createPlan(fd);
      if (!r.ok) {
        toast.error(r.error);
        if (r.fieldErrors) setErrors(r.fieldErrors);
        return;
      }
      toast.success("Plan created");
      router.push(`/plans/${r.data.id}/edit`);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          required
          placeholder="PPL · 6-day"
          className="mt-1"
          maxLength={120}
        />
        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name[0]}</p>}
      </div>
      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={1000}
          className="mt-1 flex w-full rounded-md border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating…" : "Create plan"}
      </Button>
    </form>
  );
}
