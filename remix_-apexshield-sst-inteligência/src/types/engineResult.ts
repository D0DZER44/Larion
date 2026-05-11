export type EngineResult<T> = {
  success: boolean;
  data: T;
  warnings: string[];
  errors: string[];
};

export function ok<T>(data: T, warnings: string[] = []): EngineResult<T> {
  return {
    success: true,
    data,
    warnings: [...warnings],
    errors: [],
  };
}

export function fail<T>(errors: string[], data: T, warnings: string[] = []): EngineResult<T> {
  return {
    success: false,
    data,
    warnings: [...warnings],
    errors: [...errors],
  };
}

export function combine<T, R>(
  results: EngineResult<T>[],
  reduce: (items: T[]) => R
): EngineResult<R> {
  const success = results.every((result) => result.success);
  const warnings = results.flatMap((result) => result.warnings);
  const errors = results.flatMap((result) => result.errors);
  const data = reduce(results.map((result) => result.data));

  return {
    success,
    data,
    warnings,
    errors,
  };
}
