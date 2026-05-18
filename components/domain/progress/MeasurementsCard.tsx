"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { addMeasurement, deleteMeasurement } from "@/lib/actions/measurements";
import { format } from "date-fns";

type Metric = "bodyweight" | "body_fat" | "waist" | "chest" | "arm" | "thigh";
type MeasurementUnit = "kg" | "lb" | "cm" | "in" | "percent";

interface Measurement {
  id: string;
  value: number;
  unit: string;
  measured_at: string;
  note: string | null;
}

const METRIC_LABELS: Record<Metric, string> = {
  bodyweight: "Bodyweight",
  body_fat: "Body fat %",
  waist: "Waist",
  chest: "Chest",
  arm: "Arm",
  thigh: "Thigh",
};

const METRIC_DEFAULT_UNIT: Record<Metric, MeasurementUnit> = {
  bodyweight: "kg",
  body_fat: "percent",
  waist: "cm",
  chest: "cm",
  arm: "cm",
  thigh: "cm",
};

interface MeasurementsCardProps {
  metric: Metric;
  initialMeasurements: Measurement[];
}

export function MeasurementsCard({ metric, initialMeasurements }: MeasurementsCardProps) {
  const [measurements, setMeasurements] = useState(initialMeasurements);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [addPending, startAddTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();

  const latest = measurements.at(-1);
  const unit = METRIC_DEFAULT_UNIT[metric];

  function handleAdd() {
    const num = parseFloat(value);
    if (Number.isNaN(num) || num <= 0) {
      toast.error("Enter a valid number.");
      return;
    }
    startAddTransition(async () => {
      const result = await addMeasurement({
        metric,
        value: num,
        unit,
        note: notes || undefined,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setMeasurements((prev) => [
        ...prev,
        {
          id: result.data.id,
          value: num,
          unit,
          measured_at: new Date().toISOString(),
          note: notes || null,
        },
      ]);
      setValue("");
      setNotes("");
      setOpen(false);
      toast.success("Measurement saved.");
    });
  }

  function handleDelete(id: string) {
    startDeleteTransition(async () => {
      const result = await deleteMeasurement(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setMeasurements((prev) => prev.filter((m) => m.id !== id));
      toast.success("Measurement deleted.");
    });
  }

  const unitLabel = unit === "percent" ? "%" : unit;

  return (
    <div className="p-4 rounded-lg bg-card border border-border">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{METRIC_LABELS[metric]}</div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs text-primary gap-1">
              <Plus size={14} />
              Add entry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add {METRIC_LABELS[metric]}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="meas-value">
                  Value ({unitLabel})
                </Label>
                <Input
                  id="meas-value"
                  type="number"
                  step="0.1"
                  min="0"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={`e.g. 78.5`}
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <Label htmlFor="meas-notes">Notes (optional)</Label>
                <Input
                  id="meas-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Morning, fasted…"
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" size="sm">
                  Cancel
                </Button>
              </DialogClose>
              <Button size="sm" onClick={handleAdd} disabled={addPending}>
                {addPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {latest ? (
        <div className="mt-2">
          <div className="font-mono text-2xl">
            {latest.value}{" "}
            <span className="text-base text-muted-foreground">{unitLabel}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {format(new Date(latest.measured_at), "MMM d, yyyy")}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mt-2">No entries yet.</p>
      )}

      {measurements.length > 1 && (
        <div className="mt-3 space-y-1 border-t border-border pt-3">
          {[...measurements].reverse().slice(1).map((m) => (
            <div key={m.id} className="flex items-center justify-between">
              <span className="font-mono text-sm">
                {m.value} {unitLabel}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(m.measured_at), "MMM d")}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(m.id)}
                  disabled={deletePending}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Delete measurement"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
