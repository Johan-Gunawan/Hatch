import { describe, expect, it } from "vitest";
import { sanitizeLlmJson } from "./sanitize-llm-json.js";

describe("sanitizeLlmJson", () => {
  it("passes through clean JSON unchanged", () => {
    expect(sanitizeLlmJson('{"a":1}')).toBe('{"a":1}');
  });

  it("strips triple-backtick fences with a json language tag", () => {
    expect(sanitizeLlmJson('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("strips plain triple-backtick fences", () => {
    expect(sanitizeLlmJson('```\n[{"a":1}]\n```')).toBe('[{"a":1}]');
  });

  it("strips stray single backticks", () => {
    expect(sanitizeLlmJson('`{"a":1}`')).toBe('{"a":1}');
  });

  it("normalizes smart quotes to straight quotes", () => {
    expect(sanitizeLlmJson("{“a”:1}")).toBe('{"a":1}');
  });

  it("drops leading and trailing prose around the JSON payload", () => {
    expect(sanitizeLlmJson('Here is the JSON:\n{"a":1}\nLet me know if you need more.')).toBe(
      '{"a":1}'
    );
  });

  it("parses cleanly after sanitizing", () => {
    const raw = '```json\n{"a": "b", "c": ["d"]}\n```';
    expect(JSON.parse(sanitizeLlmJson(raw))).toEqual({ a: "b", c: ["d"] });
  });

  it("escapes a literal newline inside a string value", () => {
    const raw = '{"description":"Line one\nLine two"}';
    expect(JSON.parse(sanitizeLlmJson(raw))).toEqual({
      description: "Line one\nLine two",
    });
  });

  it("escapes literal tabs and carriage returns inside string values", () => {
    const raw = '{"a":"x\ty","b":"p\rq"}';
    expect(JSON.parse(sanitizeLlmJson(raw))).toEqual({ a: "x\ty", b: "p\rq" });
  });

  it("leaves structural whitespace between tokens untouched", () => {
    const raw = '{\n  "a": "b"\n}';
    expect(JSON.parse(sanitizeLlmJson(raw))).toEqual({ a: "b" });
  });

  it("does not double-escape an already-escaped newline", () => {
    const raw = '{"a":"line one\\nline two"}';
    expect(JSON.parse(sanitizeLlmJson(raw))).toEqual({ a: "line one\nline two" });
  });
});
