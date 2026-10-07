import {
  formatDateInput,
  parseDateOfBirth,
  passwordProblem,
  phoneDigits,
  RegistrationForm,
  toRegisterRequest,
  validateRegistration,
} from "../registration";

const valid: RegistrationForm = {
  firstName: " Priya ",
  lastName: "Sharma",
  email: " priya@example.com ",
  phone: "98765-43210",
  dateOfBirth: "15/04/1992",
  gender: "female",
  password: "Str0ng!pass",
  passwordConfirm: "Str0ng!pass",
};
const today = new Date("2026-10-01T12:00:00Z");

test("a complete form has no errors and maps to the API shape", () => {
  expect(validateRegistration(valid, today)).toEqual({});
  expect(toRegisterRequest(valid)).toEqual({
    email: "priya@example.com",
    first_name: "Priya",
    last_name: "Sharma",
    phone_number: "+919876543210",
    date_of_birth: "1992-04-15",
    gender: "female",
    password: "Str0ng!pass",
    password_confirm: "Str0ng!pass",
  });
});

test("gender is optional", () => {
  expect(validateRegistration({ ...valid, gender: null }, today)).toEqual({});
  expect(toRegisterRequest({ ...valid, gender: null }).gender).toBeNull();
});

test("flags each invalid field", () => {
  const errors = validateRegistration(
    {
      firstName: "",
      lastName: " ",
      email: "priya@",
      phone: "",
      dateOfBirth: "31/02/1992",
      gender: null,
      password: "weak",
      passwordConfirm: "other",
    },
    today
  );
  expect(Object.keys(errors).sort()).toEqual(
    ["dateOfBirth", "email", "firstName", "lastName", "password", "passwordConfirm", "phone"].sort()
  );
});

test("phone input keeps the 10-digit mobile number, even when pasted with +91 or a leading 0", () => {
  expect(phoneDigits("98765-43210")).toBe("9876543210");
  expect(phoneDigits("+91 98765 43210")).toBe("9876543210");
  expect(phoneDigits("098765 43210")).toBe("9876543210");
  expect(phoneDigits("987654321099")).toBe("9876543210");
  // An 11th digit typed after a number starting with 91 is dropped, not treated as a +91 prefix.
  expect(phoneDigits("91234567890")).toBe("9123456789");
});

test("requires exactly 10 digits starting with 6-9", () => {
  expect(validateRegistration({ ...valid, phone: "98765" }, today).phone).toMatch(/10 digits/);
  expect(validateRegistration({ ...valid, phone: "5876543210" }, today).phone).toMatch(/valid Indian mobile/);
  expect(validateRegistration({ ...valid, phone: "6876543210" }, today).phone).toBeUndefined();
});

test("rejects a future date of birth and mismatched passwords", () => {
  const errors = validateRegistration({ ...valid, dateOfBirth: "02/10/2026", passwordConfirm: "Str0ng!pasS" }, today);
  expect(errors.dateOfBirth).toMatch(/future/);
  expect(errors.passwordConfirm).toMatch(/match/);
});

test.each([
  ["Sh0rt!", /8 characters/],
  ["str0ng!pass", /uppercase/],
  ["STR0NG!PASS", /lowercase/],
  ["Strong!pass", /number/],
  ["Str0ngpass", /special/],
])("password %s is rejected", (password, message) => {
  expect(passwordProblem(password)).toMatch(message);
});

test("date input helpers", () => {
  expect(formatDateInput("15041992")).toBe("15/04/1992");
  expect(formatDateInput("1504")).toBe("15/04");
  expect(parseDateOfBirth("29/02/2024")).toBe("2024-02-29");
  expect(parseDateOfBirth("29/02/2023")).toBeNull();
  expect(parseDateOfBirth("1992-04-15")).toBeNull();
});
