"use client";

import type { AnyFieldDefinition, BuilderDefinition } from "../index";

import { RuleEditor } from "./rule-editor";
import { RuleList } from "./rule-list";
import { useRulesEditor } from "./use-rules-editor";

interface RulesEditorProps {
  allFields: AnyFieldDefinition[];
  formState: BuilderDefinition;
  setFormState: (
    updater:
      ((previous: BuilderDefinition) => BuilderDefinition) | BuilderDefinition,
  ) => void;
}

export function RulesEditor({
  allFields,
  formState,
  setFormState,
}: RulesEditorProps) {
  const editor = useRulesEditor({ allFields, formState, setFormState });
  const editingRule = editor.editingRule;

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {editingRule ? (
          <RuleEditor
            allFields={allFields}
            key={editingRule.id}
            onBack={editor.onBack}
            onChange={editor.handleChange}
            onDelete={() => {
              editor.handleDelete(editingRule.id);
            }}
            rule={editingRule}
          />
        ) : (
          <RuleList
            onCreate={editor.handleCreate}
            onEdit={editor.openEditor}
            rules={editor.rules}
          />
        )}
      </div>
    </div>
  );
}
