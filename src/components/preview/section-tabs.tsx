/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import type {
  AnyFieldDefinition,
  SectionAttributes,
} from "@/components/builder";

import {
  type FormValue,
  isFieldDisabled,
} from "@/components/builder/form/form-definition";
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

import { CheckboxField } from "./field/checkbox";
import { ColorField } from "./field/color";
import { DateField } from "./field/date";
import { DatetimeField } from "./field/datetime";
import { EmailField } from "./field/email";
import { FileField } from "./field/file";
import { NumberField } from "./field/number";
import { PasswordField } from "./field/password";
import { RadioField } from "./field/radio";
import { RatingField } from "./field/rating";
import { SelectField } from "./field/select";
import { SliderField } from "./field/slider";
import { TelField } from "./field/tel";
import { TextField } from "./field/text";
import { TextareaField } from "./field/textarea";
import { TimeField } from "./field/time";
import { ToggleField } from "./field/toggle";
import { UrlField } from "./field/url";

export interface SectionGroup {
  attributes: SectionAttributes;
  fields: AnyFieldDefinition[];
  id: string;
}

// Set-type controls associate each option with its own label (checkbox and
// radio rows, rating buttons), so the field-level label has no single target.
const SET_FIELD_TYPES = new Set(["checkbox", "radio", "rating"]);

interface SectionTabsProps {
  activeSection: number;
  fields: AnyFieldDefinition[];
  form: any;
  groups: SectionGroup[];
  onActiveSection: (index: number) => void;
  values: Record<string, FormValue>;
}

export function SectionTabs({
  activeSection,
  fields,
  form,
  groups,
  onActiveSection,
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
        <span className="text-xs text-muted-foreground">
          Section {clamped + 1} of {sectionCount}
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
          <div className="min-w-max space-y-2">
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
            <div className="space-y-5" key={group.id}>
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
                    const fieldDisabled = isFieldDisabled(
                      fields,
                      values,
                      field,
                    );

                    return (
                      <form.Field key={field.id} name={field.id}>
                        {(formField: any) => {
                          const isInvalid =
                            formField.state.meta.isTouched &&
                            !formField.state.meta.isValid;

                          return (
                            <Field
                              className={cn(fieldDisabled && "opacity-50")}
                              data-disabled={fieldDisabled}
                              data-invalid={isInvalid}
                            >
                              <FieldLabel
                                htmlFor={
                                  SET_FIELD_TYPES.has(field.type)
                                    ? undefined
                                    : formField.name
                                }
                              >
                                <span>{fieldIndex + 1}.</span>
                                {field.attributes.label}
                                {field.attributes.required && (
                                  <span className="text-destructive">*</span>
                                )}
                              </FieldLabel>
                              <FieldContent>
                                {renderField(formField, field)}
                                {field.attributes.description && (
                                  <FieldDescription>
                                    {field.attributes.description}
                                  </FieldDescription>
                                )}
                              </FieldContent>
                              {isInvalid && (
                                <FieldError
                                  errors={formField.state.meta.errors}
                                />
                              )}
                            </Field>
                          );
                        }}
                      </form.Field>
                    );
                  })}
                  {sectionCount > 1 && (
                    <>
                      <Separator className="my-5" />
                      <div
                        className={cn(
                          "flex items-center gap-3",
                          index > 0 ? "justify-between" : "justify-end",
                        )}
                      >
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
                        {index < sectionCount - 1 && (
                          <Button
                            className="gap-1.5"
                            onClick={() => {
                              onActiveSection(index + 1);
                            }}
                          >
                            Next
                            <ChevronRightIcon className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function renderField(field: any, definition: AnyFieldDefinition) {
  const props = { definition, field };

  switch (definition.type) {
    case "checkbox": {
      return <CheckboxField {...props} />;
    }
    case "color": {
      return <ColorField {...props} />;
    }
    case "date": {
      return <DateField {...props} />;
    }
    case "datetime": {
      return <DatetimeField {...props} />;
    }
    case "email": {
      return <EmailField {...props} />;
    }
    case "file": {
      return <FileField {...props} />;
    }
    case "number": {
      return <NumberField {...props} />;
    }
    case "password": {
      return <PasswordField {...props} />;
    }
    case "radio": {
      return <RadioField {...props} />;
    }
    case "rating": {
      return <RatingField {...props} />;
    }
    case "select": {
      return <SelectField {...props} />;
    }
    case "slider": {
      return <SliderField {...props} />;
    }
    case "tel": {
      return <TelField {...props} />;
    }
    case "text": {
      return <TextField {...props} />;
    }
    case "textarea": {
      return <TextareaField {...props} />;
    }
    case "time": {
      return <TimeField {...props} />;
    }
    case "toggle": {
      return <ToggleField {...props} />;
    }
    case "url": {
      return <UrlField {...props} />;
    }
    default: {
      return null;
    }
  }
}
