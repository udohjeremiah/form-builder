export interface StructureAttributeMeta {
  key: "description" | "nextLabel" | "previousLabel" | "submitLabel" | "title";
  kind: "multiline" | "text";
  label: string;
  placeholder?: string;
  when?: (position: StructurePosition) => boolean;
}

export type StructureKind = "section" | "step";

export interface StructurePosition {
  isFirstStep: boolean;
  isLastStep: boolean;
}

export const STRUCTURE_ATTRIBUTES: Readonly<
  Record<StructureKind, readonly StructureAttributeMeta[]>
> = {
  section: [
    { key: "title", kind: "text", label: "Title" },
    {
      key: "description",
      kind: "multiline",
      label: "Description",
      placeholder: "Additional context for the user",
    },
  ],
  step: [
    { key: "title", kind: "text", label: "Title" },
    {
      key: "description",
      kind: "multiline",
      label: "Description",
      placeholder: "Additional context for the user",
    },
    {
      key: "previousLabel",
      kind: "text",
      label: "Previous label",
      placeholder: "Back button text...",
      when: ({ isFirstStep }) => !isFirstStep,
    },
    {
      key: "nextLabel",
      kind: "text",
      label: "Next label",
      placeholder: "Next button text...",
      when: ({ isLastStep }) => !isLastStep,
    },
    {
      key: "submitLabel",
      kind: "text",
      label: "Submit label",
      placeholder: "Submit button text...",
      when: ({ isLastStep }) => isLastStep,
    },
  ],
};

export const getStructureAttributes = (
  kind: StructureKind,
  position: StructurePosition,
): readonly StructureAttributeMeta[] =>
  STRUCTURE_ATTRIBUTES[kind].filter((meta) => meta.when?.(position) ?? true);
