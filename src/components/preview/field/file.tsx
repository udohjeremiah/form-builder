import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

import {
  type FieldInputPropsFor,
  type FileInfo,
  formatBytes,
  isFileInfo,
} from "../types";

export function FileField({
  disabled,
  field,
  onBlur,
  onChange,
  touched,
  value,
}: FieldInputPropsFor<"file">) {
  const { accept, multiple } = field.attributes;

  let files: FileInfo[] = [];
  if (value) {
    try {
      const parsed = JSON.parse(value) as unknown;
      files = Array.isArray(parsed) ? parsed.filter(isFileInfo) : [];
    } catch {
      files = [];
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        accept={accept?.join(",")}
        aria-label={field.attributes.label}
        className={cn(
          disabled && "pointer-events-none opacity-50",
          touched && "border-destructive/60 focus:ring-destructive/30",
        )}
        disabled={disabled}
        multiple={multiple}
        onChange={(event) => {
          const selected = [...(event.target.files ?? [])].map((file) => ({
            name: file.name,
            size: file.size,
            type: file.type,
          }));
          onChange(JSON.stringify(selected));
          onBlur();
        }}
        type="file"
      />
      {files.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {files.map((file) => (
            <li
              className="flex items-center justify-between gap-2 rounded border bg-input/50 px-2.5 py-1.5 text-xs"
              key={file.name}
            >
              <span className="truncate font-medium text-foreground">
                {file.name}
              </span>
              <span className="shrink-0 text-muted-foreground">
                {file.type ? `${file.type} · ` : ""}
                {formatBytes(file.size)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">Choose a file to upload</p>
      )}
    </div>
  );
}
