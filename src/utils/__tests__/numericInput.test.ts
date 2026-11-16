import { decimalInput, wholeNumberInput } from "../numericInput";

test("decimalInput keeps only a decimal number", () => {
  expect(decimalInput("31.5")).toBe("31.5");
  expect(decimalInput("31,5")).toBe("31.5");
  expect(decimalInput("abc")).toBe("");
  expect(decimalInput("3a1.b5")).toBe("31.5");
  expect(decimalInput("31.5 in")).toBe("31.5");
  expect(decimalInput("1.2.3")).toBe("1.23");
  expect(decimalInput("-4e2")).toBe("42");
  expect(decimalInput(".")).toBe(".");
});

test("wholeNumberInput keeps only digits", () => {
  expect(wholeNumberInput("32")).toBe("32");
  expect(wholeNumberInput("32 yrs")).toBe("32");
  expect(wholeNumberInput("3.5")).toBe("35");
  expect(wholeNumberInput("abc")).toBe("");
});
