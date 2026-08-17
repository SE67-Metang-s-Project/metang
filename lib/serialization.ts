export type Jsonified<T> = T extends Date | bigint
  ? string
  : T extends readonly (infer Item)[]
    ? Jsonified<Item>[]
    : T extends object
      ? { [Key in keyof T]: Jsonified<T[Key]> }
      : T;

export function serializeJson<T>(value: T): Jsonified<T> {
  return JSON.parse(
    JSON.stringify(value, (_, entry) => {
      if (typeof entry === "bigint") return entry.toString();
      return entry;
    }),
  ) as Jsonified<T>;
}
