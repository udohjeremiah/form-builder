import type { AnyFieldDefinition } from "@/components/builder";

export interface FileInfo {
  name: string;
  size: number;
  type?: string;
}

export const isFileInfo = (item: unknown): item is FileInfo =>
  typeof item === "object" &&
  item !== null &&
  typeof (item as FileInfo).name === "string" &&
  typeof (item as FileInfo).size === "number";

export const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
};

export interface FieldInputProps<
  TField extends AnyFieldDefinition = AnyFieldDefinition,
> {
  disabled: boolean;
  error: null | string;
  field: TField;
  onBlur: () => void;
  onChange: (value: string) => void;
  touched: boolean;
  value: string;
}

export type FieldInputPropsFor<
  Type extends AnyFieldDefinition["type"],
> = FieldInputProps<Extract<AnyFieldDefinition, { type: Type }>>;

export const useErrorClass = (touched: boolean, error: null | string) =>
  touched && !!error
    ? "border-destructive/60 focus-visible:ring-destructive/30"
    : "";
