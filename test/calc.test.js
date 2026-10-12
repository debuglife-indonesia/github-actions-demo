import { describe, expect, it } from "vitest";
import { add, multiply, subtract } from "../src/calc.js";

describe("calc", () => {
  it("menjumlahkan dua angka positif", () => {
    expect(add(2, 2)).toBe(4);
  });

  it("menjumlahkan angka negatif", () => {
    expect(add(-3, 5)).toBe(2);
  });

  it("mengurangi dua angka", () => {
    expect(subtract(10, 4)).toBe(6);
  });

  it("mengalikan dua angka", () => {
    expect(multiply(3, 7)).toBe(21);
  });
});
