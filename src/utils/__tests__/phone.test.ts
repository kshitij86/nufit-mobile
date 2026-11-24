import { formatPhone, nationalDigits, phonePlaceholder, phoneProblem, toE164 } from "../phone";

test("an Indian mobile number becomes E.164 and reads with a space in the middle", () => {
  const national = nationalDigits("91", "98765 43210");
  expect(phoneProblem("91", national)).toBeNull();
  expect(toE164("91", national)).toBe("+919876543210");
  expect(formatPhone("91", national)).toBe("+91 98765 43210");
});

test("for India, a pasted +91 or leading 0 is dropped, as on the sign-up form", () => {
  expect(nationalDigits("91", "+91 98765 43210")).toBe("9876543210");
  expect(nationalDigits("91", "098765 43210")).toBe("9876543210");
});

test.each([
  ["", "Enter your mobile number."],
  ["98765", "Enter all 10 digits of your mobile number."],
  ["1234567890", "Enter a valid Indian mobile number."],
])("Indian number %p: %s", (national, message) => {
  expect(phoneProblem("91", national)).toBe(message);
});

test("another country code is kept, and a domestic leading 0 is dropped", () => {
  const national = nationalDigits("44", "07700 900123");
  expect(phoneProblem("44", national)).toBeNull();
  expect(toE164("44", national)).toBe("+447700900123");
  expect(formatPhone("44", national)).toBe("+44 7700900123");
});

test("only India gets an example number as the placeholder", () => {
  expect(phonePlaceholder("91")).toBe("98765 43210");
  expect(phonePlaceholder("44")).toBe("Mobile number");
});

test("numbers outside India must fit E.164's 15 digits", () => {
  expect(phoneProblem("1", "555")).toBe("Enter a valid mobile number.");
  expect(phoneProblem("1", "2025550123")).toBeNull();
  expect(phoneProblem("123", "1234567890123")).toBe("Enter a valid mobile number.");
});
