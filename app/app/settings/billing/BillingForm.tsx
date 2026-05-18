"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createCheckoutSession, createPortalSession } from "@/lib/actions/billing";

export function BillingForm({ action }: { action: "checkout" | "portal" }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const result =
        action === "checkout"
          ? await createCheckoutSession()
          : await createPortalSession();

      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      window.location.href = result.data.url;
    });
  }

  if (action === "checkout") {
    return (
      <Button className="w-full" onClick={handleSubmit} disabled={pending}>
        {pending ? "Redirecting…" : "Upgrade to Pro — $5/mo"}
      </Button>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {/* Cancel is handled inside the Stripe portal */}
      <Button variant="outline" onClick={handleSubmit} disabled={pending}>
        {pending ? "…" : "Cancel plan"}
      </Button>
      <Button variant="ghost" className="bg-muted" onClick={handleSubmit} disabled={pending}>
        {pending ? "…" : "Manage billing"}
      </Button>
    </div>
  );
}
