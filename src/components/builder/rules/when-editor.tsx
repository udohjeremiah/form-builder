/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
"use client";

import { useField, useSelector } from "@tanstack/react-form";
import { FolderPlusIcon, PlusIcon, XIcon } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import { FieldError } from "@/components/ui/field";
import { generateColor } from "@/lib/generate-color";

import type { AnyFieldDefinition, Condition, GroupCondition } from "../index";

import { Combinator } from "./combinator";
import { ConditionRow } from "./condition-row";
import {
  newComparisonCondition,
  newGroupCondition,
  removeCondition,
  type RuleFormHandle,
  updateCondition,
} from "./rule-definition";

const groupAppend = (
  condition: GroupCondition,
  child: Condition,
): GroupCondition => ({
  ...condition,
  conditions: [...condition.conditions, child],
});

export function WhenEditor({
  allFields,
  form,
}: {
  allFields: AnyFieldDefinition[];
  form: RuleFormHandle;
}) {
  const root = useSelector(form.store, (state) => state.values.condition);

  const onRootChange = (next: Condition) => {
    form.setFieldValue("condition", next);
  };

  const combinator = useField({ form, name: "condition.operator" });
  const conditions = useField({ form, name: "condition.conditions" });

  const addCondition = () => {
    onRootChange(
      updateCondition(root, [], (node) =>
        node.type === "group"
          ? groupAppend(node, newComparisonCondition())
          : node,
      ),
    );
  };

  const addGroup = () => {
    onRootChange(
      updateCondition(root, [], (node) =>
        node.type === "group" ? groupAppend(node, newGroupCondition()) : node,
      ),
    );
  };

  const color = useMemo(() => generateColor("when"), []);

  return (
    <div
      className="border-s-4 bg-background/40 p-2"
      style={{ borderInlineStartColor: color }}
    >
      <div className="space-y-1 pb-3">
        <Combinator
          onBlur={() => {
            conditions.handleBlur();
            combinator.handleBlur();
          }}
          onChange={combinator.handleChange}
          operator={combinator.state.value as GroupCondition["operator"]}
        />
        {conditions.state.meta.isTouched && !conditions.state.meta.isValid && (
          <FieldError errors={conditions.state.meta.errors} />
        )}
      </div>
      <GroupChildren
        allFields={allFields}
        condition={root}
        form={form}
        nodeName="condition"
        onRootChange={onRootChange}
        path={[]}
      />
      <div className="flex gap-1.5 pt-2">
        <Button
          className="flex-1 text-xs"
          onClick={addCondition}
          size="xs"
          variant="outline"
        >
          <PlusIcon /> Add condition
        </Button>
        <Button
          className="flex-1 text-xs"
          onClick={addGroup}
          size="xs"
          variant="outline"
        >
          <FolderPlusIcon /> Add group
        </Button>
      </div>
    </div>
  );
}

function GroupChildren({
  allFields,
  condition,
  form,
  nodeName,
  onRootChange,
  path,
}: {
  allFields: AnyFieldDefinition[];
  condition: GroupCondition;
  form: RuleFormHandle;
  nodeName: string;
  onRootChange: (root: Condition) => void;
  path: readonly number[];
}) {
  const { conditions } = condition;

  if (conditions.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyDescription>No conditions yet. Add one below.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div>
      {conditions.map((child, index) => {
        const childName = `${nodeName}.conditions.${index}`;
        return (
          <div className="py-1.5" key={index}>
            {child.type === "group" ? (
              <NestedGroup
                allFields={allFields}
                child={child}
                form={form}
                nodeName={childName}
                onRemoveSelf={() => {
                  onRootChange(removeCondition(condition, [...path, index]));
                }}
                onRootChange={(next) => {
                  onRootChange(updateCondition(condition, [index], () => next));
                }}
                path={[...path, index]}
              />
            ) : (
              <ConditionRow
                allFields={allFields}
                condition={child}
                form={form}
                nodeName={childName}
                onChange={(next) => {
                  onRootChange(
                    updateCondition(condition, [...path, index], () => next),
                  );
                }}
                onRemove={() => {
                  onRootChange(removeCondition(condition, [...path, index]));
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function NestedGroup({
  allFields,
  child,
  form,
  nodeName,
  onRemoveSelf,
  onRootChange,
  path,
}: {
  allFields: AnyFieldDefinition[];
  child: GroupCondition;
  form: RuleFormHandle;
  nodeName: string;
  onRemoveSelf: () => void;
  onRootChange: (root: Condition) => void;
  path: readonly number[];
}) {
  const color = useMemo(() => generateColor(), []);

  const combinator = useField({ form, name: `${nodeName}.operator` });
  const conditions = useField({ form, name: `${nodeName}.conditions` });

  const rootChange = (next: Condition) => {
    onRootChange(updateCondition(child, [], () => next));
  };

  const addGroup = () => {
    rootChange(
      updateCondition(child, [], (node) =>
        node.type === "group" ? groupAppend(node, newGroupCondition()) : node,
      ),
    );
  };

  const addCondition = () => {
    rootChange(
      updateCondition(child, [], (node) =>
        node.type === "group"
          ? groupAppend(node, newComparisonCondition())
          : node,
      ),
    );
  };

  return (
    <div
      className="border-s-4 bg-background/40 p-2"
      style={{ borderInlineStartColor: color }}
    >
      <div className="flex items-start justify-between gap-2 pb-2">
        <div className="min-w-0 flex-1 space-y-0.5">
          <Combinator
            onBlur={() => {
              conditions.handleBlur();
              combinator.handleBlur();
            }}
            onChange={combinator.handleChange}
            operator={combinator.state.value as GroupCondition["operator"]}
          />
          {conditions.state.meta.isTouched &&
            !conditions.state.meta.isValid && (
              <FieldError errors={conditions.state.meta.errors} />
            )}
        </div>
        <Button
          className="shrink-0"
          onClick={onRemoveSelf}
          size="icon-xs"
          title="Remove group"
          variant="destructive"
        >
          <XIcon className="size-3" />
        </Button>
      </div>
      <GroupChildren
        allFields={allFields}
        condition={child}
        form={form}
        nodeName={nodeName}
        onRootChange={onRootChange}
        path={path}
      />
      <div className="flex gap-1.5 pt-2">
        <Button
          className="flex-1"
          onClick={addCondition}
          size="xs"
          variant="outline"
        >
          <PlusIcon /> Add condition
        </Button>
        <Button
          className="flex-1"
          onClick={addGroup}
          size="xs"
          variant="outline"
        >
          <FolderPlusIcon /> Add group
        </Button>
      </div>
    </div>
  );
}
