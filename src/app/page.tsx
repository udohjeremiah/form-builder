"use client";

import { useEffect, useState } from "react";

import { Builder, type FormDefinition } from "@/components/builder";
import { FormPreview } from "@/components/preview";

const STORAGE_KEY = "form-definition";

const EMPTY_DEFINITION: FormDefinition = { rules: [], steps: [] };

const loadSaved = (): FormDefinition => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FormDefinition) : EMPTY_DEFINITION;
  } catch {
    return EMPTY_DEFINITION;
  }
};

export default function BuilderPage() {
  // `initialValue` is a one-time seed, so localStorage is read exactly once on
  // mount; the builder owns all state after that and reports it via onChange.
  const [seed, setSeed] = useState<FormDefinition | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeed(loadSaved());
  }, []);

  if (seed === null) return null;

  return (
    <Builder
      initialValue={seed}
      onChange={(next) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }}
      onClear={() => {
        localStorage.removeItem(STORAGE_KEY);
      }}
      onComplete={(definition) => {
        console.log(definition);
      }}
      preview={(definition) => <FormPreview definition={definition} />}
    >
      <Builder.Form>
        <Builder.Form.Palette />
        <Builder.Form.Canvas />
        <Builder.Form.Properties />
      </Builder.Form>
      <Builder.Rules>
        <Builder.Rules.List />
        <Builder.Rules.Editor />
      </Builder.Rules>
    </Builder>
  );
}
