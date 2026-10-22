// SPDX-License-Identifier: AGPL-3.0-only
import { inflateSync } from "node:zlib";

// Read the text of our generated Chromium PDFs, including the embedded font
// subsets' Unicode maps. This is test evidence, never an app import parser.
export function pdfPages(pdf: Buffer): string[] {
  const objects = new Map(
    [
      ...pdf.toString("latin1").matchAll(/(\d+) 0 obj\s*([\s\S]*?)\s*endobj/g),
    ].map((match) => [Number(match[1]), match[2]]),
  );
  function object(id: string | number) {
    const value = objects.get(Number(id));
    if (!value) throw new Error(`Missing PDF object ${id}`);
    return value;
  }
  function stream(id: string | number) {
    const value = object(id),
      bytes = /stream\r?\n([\s\S]*?)\r?\nendstream/.exec(value)?.[1];
    if (bytes == null) throw new Error(`Missing PDF stream ${id}`);
    return value.includes("/FlateDecode")
      ? inflateSync(Buffer.from(bytes, "latin1")).toString("latin1")
      : bytes;
  }
  const unicode = (hex: string) => {
    const bytes = Buffer.from(hex, "hex");
    return bytes.swap16().toString("utf16le");
  };
  const fonts = new Map<number, Map<string, string>>();
  for (const [id, value] of objects) {
    const reference = /\/ToUnicode (\d+) 0 R/.exec(value);
    if (!reference) continue;
    const cmap = stream(reference[1]),
      map = new Map<string, string>();
    for (const section of cmap.matchAll(/beginbfchar([\s\S]*?)endbfchar/g))
      for (const pair of section[1].matchAll(/<([\da-f]+)>\s*<([\da-f]+)>/gi))
        map.set(pair[1].toUpperCase(), unicode(pair[2]));
    for (const section of cmap.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
      for (const range of section[1].matchAll(
        /<([\da-f]+)>\s*<([\da-f]+)>\s*(<([\da-f]+)>|\[([^\]]*)\])/gi,
      )) {
        const first = parseInt(range[1], 16),
          last = parseInt(range[2], 16);
        const array = range[5]
          ? [...range[5].matchAll(/<([\da-f]+)>/gi)].map((match) => match[1])
          : undefined;
        for (let code = first; code <= last; code++) {
          const hex = array
            ? array[code - first]
            : (parseInt(range[4], 16) + code - first)
                .toString(16)
                .padStart(range[4].length, "0");
          map.set(
            code.toString(16).toUpperCase().padStart(range[1].length, "0"),
            unicode(hex),
          );
        }
      }
    }
    fonts.set(id, map);
  }
  return [...objects.values()]
    .filter((value) => /\/Type \/Page\b/.test(value))
    .map((page) => {
      const fontIds = new Map(
        [...page.matchAll(/\/(F\d+) (\d+) 0 R/g)].map((match) => [
          match[1],
          Number(match[2]),
        ]),
      );
      const contents = /\/Contents (\d+) 0 R/.exec(page)?.[1];
      if (!contents) throw new Error("Missing PDF page contents");
      let font: Map<string, string> | undefined,
        text = "";
      const tokens =
        /\/(F\d+) [\d.]+ Tf|<([\da-f]+)>\s*Tj|\[([^\]]*)\]\s*TJ|\bET\b/gi;
      for (const token of stream(contents).matchAll(tokens)) {
        if (token[1]) {
          font = fonts.get(fontIds.get(token[1])!);
          continue;
        }
        if (token[0] === "ET") {
          text += "\n";
          continue;
        }
        if (!font?.size) throw new Error("Missing PDF font Unicode map");
        const hex =
          token[2] ??
          [...token[3].matchAll(/<([\da-f]+)>/gi)]
            .map((match) => match[1])
            .join("");
        const width = font.keys().next().value!.length;
        for (let i = 0; i < hex.length; i += width) {
          const char = font.get(hex.slice(i, i + width).toUpperCase());
          if (char == null) throw new Error("Unmapped PDF glyph");
          text += char;
        }
      }
      return text.replace(/\s+/g, " ").trim();
    });
}
