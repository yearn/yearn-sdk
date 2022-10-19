type TypedMap<T> = { [key: string]: T };

// TODO: type correctly or import lodash.keyBy
export const keyBy = <T>(array: T[], key: string): TypedMap<T> =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (array || []).reduce((r, x) => ({ ...r, [(x as any)[key]]: x }), {} as TypedMap<T>);
