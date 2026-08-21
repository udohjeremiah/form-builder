"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  Bug,
  CalendarCheck,
  ClipboardList,
  Layers,
  Mail,
  UserPlus,
} from "lucide-react";

import type { FormTemplate } from "@/data/form-templates";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { FORM_TEMPLATES } from "@/data/form-templates";

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  Briefcase,
  Bug,
  CalendarCheck,
  ClipboardList,
  Mail,
  UserPlus,
};

const categoryLabels: Record<string, string> = {
  basic: "Basic",
  business: "Business",
  feedback: "Feedback",
};

const TemplateCard = ({
  index,
  onSelect,
  template,
}: {
  index: number;
  onSelect: (template: FormTemplate) => void;
  template: FormTemplate;
}) => {
  const Icon = iconMap[template.icon] ?? Layers;

  return (
    <motion.button
      animate={{ opacity: 1, y: 0 }}
      className="group w-full rounded-xl border border-border/50 bg-surface-2/30 p-4 text-left transition-all hover:border-primary/30 hover:bg-surface-2/60"
      initial={{ opacity: 0, y: 10 }}
      onClick={() => {
        onSelect(template);
      }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-9 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 transition-colors group-hover:bg-primary/15">
          <Icon className="size-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {template.name}
            </span>
            {template.multiStepEnabled && (
              <Badge
                className="border-0 bg-primary/10 px-1.5 py-0 font-mono text-[9px] text-primary"
                variant="secondary"
              >
                multi-step
              </Badge>
            )}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {template.description}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground/70">
              {template.fields.length} fields
            </span>
            {template.multiStepEnabled && (
              <span className="font-mono text-[10px] text-muted-foreground/70">
                · {template.steps.length} steps
              </span>
            )}
            <ArrowRight className="ml-auto size-3 text-muted-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
          </div>
        </div>
      </div>
    </motion.button>
  );
};

const TemplateGallery = ({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (template: FormTemplate) => void;
}) => {
  const categories = ["basic", "business", "feedback"] as const;

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
    >
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Templates</h2>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            Pick a starting point
          </p>
        </div>
        <button
          className="rounded border border-border px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
          onClick={onClose}
        >
          Start blank
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-2xl space-y-6 p-6">
          {categories.map((cat) => {
            const templates = FORM_TEMPLATES.filter((t) => t.category === cat);
            if (templates.length === 0) return null;
            return (
              <div key={cat}>
                <h3 className="mb-3 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                  {categoryLabels[cat]}
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {templates.map((template, index) => (
                    <TemplateCard
                      index={index}
                      key={template.id}
                      onSelect={onSelect}
                      template={template}
                    />
                  ))}
                </div>
                <Separator className="mt-6" />
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </motion.div>
  );
};

export { TemplateGallery };
