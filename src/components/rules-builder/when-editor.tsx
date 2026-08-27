"use client";

import { FolderPlusIcon, PlusIcon, XIcon } from "lucide-react";

import type { AnyFieldDefinition } from "@/types/form-definition";
import type { Condition, GroupCondition } from "@/types/rule-definition";

import { Button } from "@/components/ui/button";
import {
  newComparisonCondition,
  newGroupCondition,
  removeCondition,
  updateCondition,
} from "@/lib/rule-definition";

import { Combinator } from "./combinator";
import { ConditionRow } from "./condition-row";

interface CondCallbacks {
  allFields: AnyFieldDefinition[];
  onChangeCondition: (index: number, next: Condition) => void;
  onRemoveCondition: (index: number) => void;
  onRemoveGroup: (index: number) => void;
}

/**
 * The WHEN tree root group. `removeable` is false for the root so it cannot
 * be deleted; nested groups are rendered by the recursive node below.
 */
export function WhenEditor({
  allFields,
  condition,
  onRemoveGroup,
  onRootChange,
  path,
  removeable,
}: {
  allFields: AnyFieldDefinition[];
  condition: GroupCondition;
  onRemoveGroup: () => void;
  onRootChange: (root: Condition) => void;
  path: readonly number[];
  removeable: boolean;
}) {
  const updateGroup = (patch: Partial<GroupCondition>) => {
    onRootChange(
      updateCondition(condition, path, (node) =>
        node.type === "group" ? { ...node, ...patch } : node,
      ),
    );
  };

  const addCondition = () => {
    onRootChange(
      updateCondition(condition, path, (node) =>
        node.type === "group"
          ? {
              ...node,
              conditions: [...node.conditions, newComparisonCondition()],
            }
          : node,
      ),
    );
  };

  const addGroup = () => {
    onRootChange(
      updateCondition(condition, path, (node) =>
        node.type === "group"
          ? { ...node, conditions: [...node.conditions, newGroupCondition()] }
          : node,
      ),
    );
  };

  return (
    <div className="border-l border-border pl-5">
      <div className="relative flex items-center justify-between gap-2 pb-3">
        <span className="absolute top-1/2 -left-5 h-px w-5 bg-border" />
        <Combinator
          onChange={(operator) => {
            updateGroup({ operator });
          }}
          operator={condition.operator}
        />
        {removeable && (
          <Button
            className="shrink-0 text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive"
            onClick={onRemoveGroup}
            size="icon-xs"
            title="Remove group"
            variant="ghost"
          >
            <PlusIcon className="size-3 rotate-45" />
          </Button>
        )}
      </div>

      <GroupChildren
        callbacks={{
          allFields,
          onChangeCondition: (index, next) => {
            onRootChange(
              updateCondition(condition, [...path, index], () => next),
            );
          },
          onRemoveCondition: (index) => {
            onRootChange(removeCondition(condition, [...path, index]));
          },
          onRemoveGroup: (index) => {
            onRootChange(removeCondition(condition, [...path, index]));
          },
        }}
        condition={condition}
        onRootChange={onRootChange}
        path={path}
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

/**
 * Renders a group's children. Each child hangs a short horizontal arm off the
 * rail that the parent's `border-l` provides.
 */
function GroupChildren({
  callbacks,
  condition,
  onRootChange,
  path,
}: {
  callbacks: CondCallbacks;
  condition: GroupCondition;
  onRootChange: (root: Condition) => void;
  path: readonly number[];
}) {
  const { conditions } = condition;

  if (conditions.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border/70 py-3 text-center text-[11px] text-muted-foreground/60">
        No conditions yet. Add one below.
      </p>
    );
  }

  return (
    <div>
      {conditions.map((child, index) => (
        <div className="relative" key={index}>
          <span className="absolute inset-y-0 -left-5 my-auto h-px w-5 bg-border" />
          <div className="py-1.5">
            {child.type === "group" ? (
              <NestedGroup
                allFields={callbacks.allFields}
                child={child}
                onRemoveSelf={() => {
                  callbacks.onRemoveGroup(index);
                }}
                onRootChange={(next) => {
                  onRootChange(updateCondition(condition, [index], () => next));
                }}
                path={[...path, index]}
              />
            ) : (
              <ConditionRow
                allFields={callbacks.allFields}
                condition={child}
                onChange={(next) => {
                  callbacks.onChangeCondition(index, next);
                }}
                onRemove={() => {
                  callbacks.onRemoveCondition(index);
                }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * A nested (non-root) group. Renders its own combinator and recurses for its
 * children, keeping the connector going so groups can nest arbitrarily deep.
 */
function NestedGroup({
  allFields,
  child,
  onRemoveSelf,
  onRootChange,
  path,
}: {
  allFields: AnyFieldDefinition[];
  child: GroupCondition;
  onRemoveSelf: () => void;
  onRootChange: (root: Condition) => void;
  path: readonly number[];
}) {
  const rootChange = (next: Condition) => {
    onRootChange(updateCondition(child, [], () => next));
  };

  const addGroup = () => {
    rootChange(
      updateCondition(child, [], (node) =>
        node.type === "group"
          ? {
              ...node,
              conditions: [...node.conditions, newGroupCondition()],
            }
          : node,
      ),
    );
  };

  const addCondition = () => {
    rootChange(
      updateCondition(child, [], (node) =>
        node.type === "group"
          ? {
              ...node,
              conditions: [...node.conditions, newComparisonCondition()],
            }
          : node,
      ),
    );
  };

  return (
    <div className="rounded-md border border-border/40 bg-background/40 p-2">
      <div className="border-l border-border pl-5">
        <div className="relative flex items-center justify-between gap-2 pb-2">
          <span className="absolute top-1/2 -left-5 h-px w-5 bg-border" />
          <Combinator
            onChange={(operator) => {
              rootChange(
                updateCondition(child, [], (node) =>
                  node.type === "group" ? { ...node, operator } : node,
                ),
              );
            }}
            operator={child.operator}
          />
          <Button
            className="shrink-0 text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive"
            onClick={onRemoveSelf}
            size="icon-xs"
            title="Remove group"
            variant="ghost"
          >
            <XIcon className="size-3" />
          </Button>
        </div>

        <GroupChildren
          callbacks={{
            allFields,
            onChangeCondition: (index, next) => {
              rootChange(updateCondition(child, [index], () => next));
            },
            onRemoveCondition: (index) => {
              rootChange(removeCondition(child, [index]));
            },
            onRemoveGroup: (index) => {
              rootChange(removeCondition(child, [index]));
            },
          }}
          condition={child}
          onRootChange={onRootChange}
          path={path}
        />
      </div>

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
