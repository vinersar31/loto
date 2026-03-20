import { expect, test, describe } from "bun:test";
import { calculateSimulation } from "./loto";

describe("calculateSimulation", () => {
  const mockHistory = Array.from({ length: 20 }, (_, i) => ({
    date: `2024-01-${i + 1}`,
    numbers: [1, 2, 3, 4, 5, 6],
    joker: 1,
  }));

  test("should include timestamp in simulation stats", () => {
    const stats = calculateSimulation("649", mockHistory, 5, 1, "random");
    expect(stats).not.toBeNull();
    if (stats) {
      expect(stats.timestamp).toBeDefined();
      expect(typeof stats.timestamp).toBe("number");

      const now = Date.now();
      expect(now - stats.timestamp).toBeLessThan(1000);
    }
  });

  test("consecutive simulations return new object references", () => {
    const stats1 = calculateSimulation("649", mockHistory, 5, 1, "random");
    const stats2 = calculateSimulation("649", mockHistory, 5, 1, "random");

    expect(stats1).not.toBe(stats2);
  });
});
