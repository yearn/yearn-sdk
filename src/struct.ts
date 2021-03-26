export function struct<G>(tuple: Record<string, unknown>): G {
  const properties = Object.keys(tuple).filter(key => isNaN(Number(key)));
  const copy: Record<string, unknown> = {};
  properties.forEach((property: string) => (copy[property] = tuple[property]));
  return (copy as unknown) as G;
}

export function structArray<G>(tuples: Record<string, unknown>[]): G[] {
  return tuples.map(tuple => struct<G>(tuple));
}
