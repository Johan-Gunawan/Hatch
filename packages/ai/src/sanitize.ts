// LLMs sometimes wrap JSON in markdown fences (```json ... ```), stray
// backticks, or smart quotes, and occasionally add prose before/after the
// payload even when asked for raw JSON. Strip all of that before JSON.parse.
export function sanitizeLlmJson(raw: string): string {
  let text = raw.trim().replace(/^﻿/, "");

  text = text.replace(/^```[a-z]*\s*/i, "").replace(/```\s*$/, "");
  text = text.replace(/^`+/, "").replace(/`+$/, "");

  text = text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

  const start = text.search(/[[{]/);
  const end = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
  if (start !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }

  text = escapeRawControlCharsInStrings(text);

  return text.trim();
}

// Multi-line field values (description, requirements, benefits) often come
// back with literal newline/tab bytes inside the JSON string instead of the
// escaped \n / \t form. A raw control character inside a string literal is
// invalid JSON and makes JSON.parse throw "Unterminated string" mid-payload.
// Walk the text tracking string/escape state and escape only the control
// characters that fall inside a string literal — structural whitespace
// between tokens is left untouched.
function escapeRawControlCharsInStrings(text: string): string {
  let result = "";
  let inString = false;
  let escapedNext = false;

  for (const ch of text) {
    if (!inString) {
      if (ch === '"') inString = true;
      result += ch;
      continue;
    }

    if (escapedNext) {
      result += ch;
      escapedNext = false;
      continue;
    }

    if (ch === "\\") {
      result += ch;
      escapedNext = true;
      continue;
    }

    if (ch === '"') {
      inString = false;
      result += ch;
      continue;
    }

    const code = ch.charCodeAt(0);
    if (code < 0x20) {
      if (ch === "\n") result += "\\n";
      else if (ch === "\r") result += "\\r";
      else if (ch === "\t") result += "\\t";
      else result += `\\u${code.toString(16).padStart(4, "0")}`;
      continue;
    }

    result += ch;
  }

  return result;
}
