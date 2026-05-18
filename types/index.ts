// Shared / cross-feature types live here.
//
// Per-feature types should stay colocated with their feature (e.g. inside
// `lib/actions/exercises.ts` or `components/domain/<feature>/types.ts`).
// Promote a type here only when it's referenced from three or more places.

export type Brand<T, B extends string> = T & { readonly __brand: B };
export type Uuid = Brand<string, "Uuid">;
export type Iso8601 = Brand<string, "Iso8601">;
