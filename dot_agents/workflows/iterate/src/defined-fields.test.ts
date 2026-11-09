import { describe, expect, test } from "bun:test";
import { definedFields, nonEmpty } from "./defined-fields.ts";

describe(definedFields.name, () => {
  test("drops the fields whose value is undefined", () => {
    expect(Object.keys(definedFields({ kept: 1, dropped: undefined }))).toEqual(["kept"]);
  });

  test("keeps falsy values that are defined", () => {
    expect(definedFields({ zero: 0, empty: "", no: false, nothing: null })).toStrictEqual({
      zero: 0,
      empty: "",
      no: false,
      nothing: null,
    });
  });
});

describe(nonEmpty.name, () => {
  test("keeps a value that has items", () => {
    expect(nonEmpty(["item"])).toEqual(["item"]);
  });

  test("turns an empty array into undefined", () => {
    expect(nonEmpty([])).toBeUndefined();
  });

  test("turns an empty string into undefined", () => {
    expect(nonEmpty("")).toBeUndefined();
  });

  test("keeps undefined as undefined", () => {
    expect(nonEmpty<string>(undefined)).toBeUndefined();
  });
});
