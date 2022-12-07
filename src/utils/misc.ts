type TypedMap<T> = { [key: string]: T };

// TODO: type correctly or import lodash.keyBy
export const keyBy = <T>(array: T[], key: string): TypedMap<T> =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (array || []).reduce((r, x) => ({ ...r, [(x as any)[key]]: x }), {} as TypedMap<T>);

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const poll = async <T1>(fn: () => Promise<T1>, fnCondition: (args: T1) => boolean, ms: number) => {
  let result = await fn();
  while (fnCondition(result)) {
    await wait(ms);
    result = await fn();
  }
  return result;
};
