export function fuzzyMatch<T>(
  raw: string | null | undefined,
  items: T[],
  getName: (item: T) => string,
  normalize: (s: string) => string = (s) => s.toLowerCase().trim()
): T | undefined {
  if (!raw) return undefined;
  const nr = normalize(raw);
  return (
    items.find((item) => normalize(getName(item)) === nr) ??
    items.find((item) => {
      const n = normalize(getName(item));
      return n.includes(nr) || nr.includes(n);
    })
  );
}
