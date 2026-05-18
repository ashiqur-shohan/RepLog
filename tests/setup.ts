import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// ---------------------------------------------------------------------------
// Mock next/navigation
// ---------------------------------------------------------------------------
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Mock next/font/google
// ---------------------------------------------------------------------------
vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "mock-font", className: "" }),
  Geist_Mono: () => ({ variable: "mock-font-mono", className: "" }),
  Inter: () => ({ variable: "mock-font", className: "" }),
}));
