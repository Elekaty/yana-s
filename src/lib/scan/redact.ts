export function redactForModel(text: string, names: string[]) {
  let result = text;
  const unique = [...new Set(names.map((name) => name.trim()).filter((name) => name.length > 1))];
  unique.sort((a, b) => b.length - a.length);
  for (const name of unique) {
    result = result.replace(new RegExp(escapeRegExp(name), "gi"), "[name]");
  }
  result = result.replace(
    /(?<![\p{L}])(?:école|ecole|school|collège|college|lycée|lycee)\s+[\p{L}\d'’.-]+(?:\s+[\p{L}\d'’.-]+){0,3}/giu,
    "[school]",
  );
  result = result.replace(
    /\b\d{1,5}\s+(?:rue|avenue|av\.|boulevard|bd|chemin|impasse|allée|allee|place|street|st\.|road|rd\.|drive)\b[^,\n.]*/gi,
    "[address]",
  );
  return result;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
