/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { XIcon } from "lucide-react";

import type { AnyFieldDefinition } from "@/components/builder";

import { Input } from "@/components/ui/input";

export const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
};

interface FileFieldProps {
  definition: AnyFieldDefinition;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: any;
}

export function FileField({ definition, field }: FileFieldProps) {
  const attributes = definition.attributes as {
    accept?: string[];
    multiple?: boolean;
  };
  const { accept, multiple } = attributes;
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const files: File[] = (() => {
    const value = field.state.value;
    if (Array.isArray(value))
      return value.filter((v): v is File => v instanceof File);
    return [];
  })();

  return (
    <div className="flex flex-col gap-2">
      <Input
        accept={accept?.join(",")}
        aria-describedby={files.length > 0 ? undefined : "file-upload-hint"}
        aria-invalid={isInvalid ?? undefined}
        aria-label={(definition.attributes as { label?: string }).label}
        id={field.name}
        multiple={multiple}
        name={field.name}
        onChange={(event) => {
          const selected = [...(event.target.files ?? [])];
          if (multiple) {
            field.handleChange([...files, ...selected]);
          } else {
            field.handleChange(selected[0] ?? []);
          }
          field.handleBlur();
        }}
        type="file"
      />
      {files.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {files.map((file, index) => (
            <li
              className="flex items-center justify-between gap-2 rounded border bg-input/50 px-2.5 py-1.5 text-xs"
              key={`${file.name}-${index}`}
            >
              <span className="truncate font-medium text-foreground">
                {file.name}
              </span>
              <div className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
                <span>
                  {file.type ? `${file.type} · ` : ""}
                  {formatBytes(file.size)}
                </span>
                <button
                  className="rounded p-0.5 transition-colors hover:text-foreground"
                  onClick={() => {
                    const next = files.filter((_, index_) => index_ !== index);
                    field.handleChange(next.length > 0 ? next : []);
                  }}
                  title="Remove file"
                  type="button"
                >
                  <XIcon className="size-3" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">Choose a file to upload</p>
      )}
    </div>
  );
}
