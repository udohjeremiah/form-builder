"use client";

import { useDraggable } from "@dnd-kit/react";
import {
  AlignLeftIcon,
  CalendarClockIcon,
  CalendarIcon,
  CheckSquareIcon,
  ChevronDownIcon,
  CircleIcon,
  ClockIcon,
  GripVerticalIcon,
  HandGrabIcon,
  HashIcon,
  LinkIcon,
  LockIcon,
  MailIcon,
  PaletteIcon,
  PhoneIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  StarIcon,
  ToggleLeftIcon,
  TypeIcon,
  UploadIcon,
} from "lucide-react";

import type { FieldType } from "@/types/form-definition";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/cn";
import { FIELD_TYPE_LIST } from "@/lib/field-registry";

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  AlignLeftIcon,
  CalendarClockIcon,
  CalendarIcon,
  CheckSquareIcon,
  ChevronDownIcon,
  CircleIcon,
  ClockIcon,
  HashIcon,
  LinkIcon,
  LockIcon,
  MailIcon,
  PaletteIcon,
  PhoneIcon,
  SlidersHorizontalIcon,
  StarIcon,
  ToggleLeftIcon,
  TypeIcon,
  UploadIcon,
};

const DraggableField = ({
  icon,
  label,
  type,
}: {
  icon: string;
  label: string;
  type: FieldType;
}) => {
  const { isDragging, ref } = useDraggable({
    data: { type },
    id: `palette-${type}`,
  });

  const Icon = iconMap[icon];

  return (
    <div
      className={cn(
        "drag-field group flex items-center gap-2.5 rounded-lg border border-transparent bg-transparent px-3 py-2 text-sm transition-all hover:border-border hover:bg-accent",
        isDragging && "scale-95 opacity-40",
      )}
      ref={ref}
    >
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/8 transition-colors group-hover:bg-primary/12">
        {Icon && (
          <Icon className="size-3.5 text-primary/70 transition-colors group-hover:text-primary" />
        )}
      </div>
      <span className="text-[13px] font-medium text-foreground/80 transition-colors group-hover:text-foreground">
        {label}
      </span>
      <GripVerticalIcon className="ml-auto size-3 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/40" />
    </div>
  );
};

const TappableField = ({
  icon,
  label,
  onTap,
  type,
}: {
  icon: string;
  label: string;
  onTap: (type: FieldType) => void;
  type: FieldType;
}) => {
  const Icon = iconMap[icon];

  return (
    <button
      className="group flex w-full items-center gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-left transition-all hover:bg-accent active:scale-95 active:bg-primary/10"
      onClick={() => {
        onTap(type);
      }}
      type="button"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-active:bg-primary/20">
        {Icon && (
          <Icon className="size-4 text-primary/80 transition-colors group-active:text-primary" />
        )}
      </div>
      <span className="flex-1 text-sm font-medium text-foreground/90">
        {label}
      </span>
      <PlusIcon className="size-4 text-muted-foreground/30 transition-colors group-active:text-primary" />
    </button>
  );
};

export function FieldPalette({
  fullWidth,
  onTapAdd,
}: {
  fullWidth?: boolean;
  onTapAdd?: (type: FieldType) => void;
}) {
  const isTapMode = fullWidth && onTapAdd;

  return (
    <div
      className={cn(
        fullWidth ? "w-full" : "w-56",
        "flex h-full flex-col border-r border-border bg-background",
      )}
    >
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
          Components
        </h3>
        {isTapMode && (
          <p className="mt-1 text-[11px] text-muted-foreground/40">
            Tap to add to canvas
          </p>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2">
        <div
          className={isTapMode ? "space-y-1.5 px-1 pb-4" : "space-y-0.5 pb-4"}
        >
          {FIELD_TYPE_LIST.map((field) =>
            isTapMode ? (
              <TappableField {...field} key={field.type} onTap={onTapAdd} />
            ) : (
              <DraggableField {...field} key={field.type} />
            ),
          )}
        </div>
      </div>
      {!isTapMode && (
        <>
          <Separator />
          <div className="flex items-center justify-center gap-2 p-3 text-muted-foreground/50">
            <HandGrabIcon className="size-4" />
            <p className="text-center font-mono text-[10px]">Drag to canvas</p>
          </div>
        </>
      )}
    </div>
  );
}
