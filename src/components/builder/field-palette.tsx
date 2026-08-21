"use client";

import { useDraggable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import {
  AlignLeft,
  Calendar,
  CalendarClock,
  CheckSquare,
  ChevronDown,
  Circle,
  Clock,
  EyeOff,
  FileText,
  GripVertical,
  Hash,
  Heading,
  Link,
  Lock,
  Mail,
  Minus,
  Palette,
  Phone,
  Plus,
  SlidersHorizontal,
  Star,
  ToggleLeft,
  Type,
  Upload,
} from "lucide-react";

import type { FieldType } from "@/types/form";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FIELD_TYPES } from "@/types/form";

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  AlignLeft,
  Calendar,
  CalendarClock,
  CheckSquare,
  ChevronDown,
  Circle,
  Clock,
  EyeOff,
  FileText,
  Hash,
  Heading,
  Link,
  Lock,
  Mail,
  Minus,
  Palette,
  Phone,
  SlidersHorizontal,
  Star,
  ToggleLeft,
  Type,
  Upload,
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
  const { attributes, isDragging, listeners, setNodeRef, transform } =
    useDraggable({
      data: { fromPalette: true, type },
      id: `palette-${type}`,
    });

  const Icon = iconMap[icon];
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          ref={setNodeRef}
          {...listeners}
          {...attributes}
          className={`drag-field group flex items-center gap-2.5 rounded-lg border border-transparent bg-transparent px-3 py-2 text-sm transition-all hover:border-border hover:bg-surface-2 ${
            isDragging ? "scale-95 opacity-40" : ""
          }`}
          style={style}
        >
          <div className="flex size-7 flex-shrink-0 items-center justify-center rounded-md bg-primary/8 transition-colors group-hover:bg-primary/12">
            {Icon && (
              <Icon className="size-3.5 text-primary/70 transition-colors group-hover:text-primary" />
            )}
          </div>
          <span className="text-[13px] font-medium text-foreground/80 transition-colors group-hover:text-foreground">
            {label}
          </span>
          <GripVertical className="ml-auto size-3 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/40" />
        </div>
      </TooltipTrigger>
      <TooltipContent className="font-mono text-xs" side="right">
        Drag to add {label.toLowerCase()}
      </TooltipContent>
    </Tooltip>
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
    <motion.button
      className="group flex w-full items-center gap-3 rounded-xl border border-border/50 bg-surface-2/30 px-4 py-3 text-left transition-all hover:bg-surface-2 active:bg-primary/10"
      onClick={() => {
        onTap(type);
      }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-active:bg-primary/20">
        {Icon && (
          <Icon className="size-4 text-primary/80 transition-colors group-active:text-primary" />
        )}
      </div>
      <span className="flex-1 text-sm font-medium text-foreground/90">
        {label}
      </span>
      <Plus className="size-4 text-muted-foreground/30 transition-colors group-active:text-primary" />
    </motion.button>
  );
};

const FieldPalette = ({
  fullWidth,
  onTapAdd,
}: {
  fullWidth?: boolean;
  onTapAdd?: (type: FieldType) => void;
}) => {
  const isTapMode = fullWidth && onTapAdd;

  return (
    <div
      className={`${fullWidth ? "w-full" : "w-56"} flex h-full flex-col border-r border-border bg-background`}
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
      <ScrollArea className="flex-1 px-2">
        <div
          className={isTapMode ? "space-y-1.5 px-1 pb-4" : "space-y-0.5 pb-4"}
        >
          {FIELD_TYPES.map((field, index) => (
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              initial={{ opacity: 0, x: -8 }}
              key={field.type}
              transition={{ delay: index * 0.025 }}
            >
              {isTapMode ? (
                <TappableField {...field} onTap={onTapAdd} />
              ) : (
                <DraggableField {...field} />
              )}
            </motion.div>
          ))}
        </div>
      </ScrollArea>
      {!isTapMode && (
        <>
          <Separator />
          <div className="p-3">
            <p className="text-center font-mono text-[10px] text-muted-foreground/50">
              Drag to canvas
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export { FieldPalette };
