import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility function", () => {
  // Example test to satisfy vitest setup
  it("should merge class names correctly", () => {
    const result = cn("text-red-500", "bg-blue-500");
    expect(result).toBe("text-red-500 bg-blue-500");
  });
});
