"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteExercise } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

export function DeleteExerciseButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete "${name}"? This action can be undone by an admin.`)) return;
    startTransition(async () => {
      const result = await deleteExercise(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`"${name}" deleted.`);
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
      onClick={handleDelete}
      disabled={pending}
    >
      <Trash2 className="size-4" />
      <span className="sr-only">Delete {name}</span>
    </Button>
  );
}
