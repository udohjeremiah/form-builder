import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import type {
  AnyFieldDefinition,
  SectionAttributes,
} from "@/components/builder";

import { isFieldDisabled } from "@/components/builder/form/form-definition";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";

import { FieldInput } from "./field-input";

export interface SectionGroup {
  attributes: SectionAttributes;
  fields: AnyFieldDefinition[];
  id: string;
}

interface SectionTabsProps {
  activeSection: number;
  allFields: AnyFieldDefinition[];
  errors: Record<string, null | string>;
  groups: SectionGroup[];
  onActiveSection: (index: number) => void;
  onBlur: (fieldId: string) => void;
  onChange: (fieldId: string, value: string) => void;
  onSubmitStep: () => void;
  stepNextLabel: string;
  touched: Record<string, boolean>;
  values: Record<string, string>;
}

export function SectionTabs({
  activeSection,
  allFields,
  errors,
  groups,
  onActiveSection,
  onBlur,
  onChange,
  onSubmitStep,
  stepNextLabel,
  touched,
  values,
}: SectionTabsProps) {
  const sectionCount = groups.length;
  if (sectionCount === 0) return null;

  const clamped = Math.min(Math.max(activeSection, 0), sectionCount - 1);
  const activeGroup = groups[clamped];
  if (!activeGroup) return null;
  const activeId = activeGroup.id;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">
          SECTION {clamped + 1} of {sectionCount}
        </span>
      </div>

      <Tabs
        className="gap-6"
        onValueChange={(value) => {
          const index = groups.findIndex((group) => group.id === value);
          if (index !== -1) onActiveSection(index);
        }}
        value={activeId}
      >
        <div className="scrollbar-none overflow-x-auto">
          <div className="w-max space-y-2">
            <TabsList className="w-full gap-0 p-0" variant="line">
              {groups.map((group, index) => (
                <TabsTrigger
                  className={cn(
                    "rounded-none p-4 group-data-[variant=line]/tabs-list:data-active:after:opacity-0",
                    index <= clamped && "bg-primary/10! text-primary!",
                  )}
                  key={group.id}
                  value={group.id}
                >
                  {group.attributes.title ?? `Section ${index + 1}`}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="h-1 w-full rounded-full bg-border/60">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{
                  width: `${((clamped + 1) / Math.max(sectionCount, 1)) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {groups.map((group, index) => (
          <TabsContent key={group.id} value={group.id}>
            <div
              className="animate-in space-y-5 duration-200 fade-in slide-in-from-right-4"
              key={group.id}
            >
              <Card>
                {(group.attributes.title !== undefined ||
                  group.attributes.description !== undefined) && (
                  <CardHeader>
                    {group.attributes.title && (
                      <CardTitle>{group.attributes.title}</CardTitle>
                    )}
                    {group.attributes.description && (
                      <CardDescription>
                        {group.attributes.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                )}
                <CardContent className="space-y-5">
                  {group.fields.map((field, fieldIndex) => {
                    const fieldError = errors[field.id];
                    const fieldTouched = touched[field.id];
                    const fieldDisabled = isFieldDisabled(
                      field,
                      values,
                      allFields,
                    );
                    const hasError = fieldTouched && !!fieldError;

                    return (
                      <Field
                        className={cn(
                          "animate-in duration-300 fill-mode-both fade-in slide-in-from-bottom-2",
                          fieldDisabled && "opacity-50",
                        )}
                        data-disabled={fieldDisabled || undefined}
                        key={field.id}
                        orientation="vertical"
                        style={{ animationDelay: `${fieldIndex * 50}ms` }}
                      >
                        <FieldLabel>
                          <span>{fieldIndex + 1}.</span>
                          {field.attributes.label}
                          {field.attributes.required && (
                            <span className="text-destructive">*</span>
                          )}
                        </FieldLabel>
                        <FieldContent>
                          <FieldInput
                            disabled={fieldDisabled}
                            error={fieldError ?? null}
                            field={field}
                            onBlur={() => {
                              onBlur(field.id);
                            }}
                            onChange={(value) => {
                              onChange(field.id, value);
                            }}
                            touched={!!fieldTouched}
                            value={values[field.id] ?? ""}
                          />
                          {field.attributes.description && (
                            <FieldDescription>
                              {field.attributes.description}
                            </FieldDescription>
                          )}
                        </FieldContent>
                        {hasError && (
                          <FieldError>
                            <span>{fieldError}</span>
                          </FieldError>
                        )}
                      </Field>
                    );
                  })}
                  <Separator className="my-5" />
                  <div className="flex justify-between gap-3">
                    {index > 0 && (
                      <Button
                        className="gap-1.5"
                        onClick={() => {
                          onActiveSection(index - 1);
                        }}
                        variant="outline"
                      >
                        <ChevronLeftIcon className="size-3.5" />
                        Previous
                      </Button>
                    )}
                    {index < sectionCount - 1 ? (
                      <Button
                        className="ml-auto gap-1.5"
                        onClick={() => {
                          onActiveSection(index + 1);
                        }}
                      >
                        Next
                        <ChevronRightIcon className="size-3.5" />
                      </Button>
                    ) : (
                      <Button
                        className="ml-auto gap-1.5"
                        onClick={onSubmitStep}
                      >
                        {stepNextLabel}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
