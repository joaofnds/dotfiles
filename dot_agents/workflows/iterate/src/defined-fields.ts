export type DefinedFields<Fields> = { [Key in keyof Fields]?: Exclude<Fields[Key], undefined> };

export function definedFields<Fields extends object>(fields: Fields): DefinedFields<Fields> {
  const defined = Object.entries(fields).filter(([, value]) => value !== undefined);

  return Object.fromEntries(defined) as DefinedFields<Fields>;
}

export function nonEmpty<Value extends { readonly length: number }>(
  value: Value | undefined,
): Value | undefined {
  if (value === undefined || value.length === 0) return undefined;

  return value;
}
