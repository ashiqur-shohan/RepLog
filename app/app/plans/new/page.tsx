import { NewPlanForm } from "./NewPlanForm";

export default function NewPlanPage() {
  return (
    <div className="px-5 md:px-8 py-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight">New plan</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Give it a name. You'll add days and exercises next.
      </p>
      <div className="mt-6">
        <NewPlanForm />
      </div>
    </div>
  );
}
