import fromEntries from "fromentries";

export type PromiseValues<TO> = {
  [TK in keyof TO]: Promise<TO[TK]>;
};

export async function objectAll<T>(object: PromiseValues<T>): Promise<T> {
  const entries = Object.entries<Promise<unknown>>(object);
  const promises = entries.map<Promise<[string, unknown]>>(([name, promise]) =>
    promise.then(result => [name, result])
  );
  return (fromEntries(await Promise.all(promises)) as unknown) as T;
}

export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}
