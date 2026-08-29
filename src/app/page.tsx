"use client";

import { useEffect, useState } from "react";

import { Builder, type FormDefinition } from "@/components/builder";
import { createDefaultDefinition } from "@/components/builder/form/form-definition";
import { FormPreview } from "@/components/form-preview";

const STORAGE_KEY = "form-definition";

const loadSaved = (): FormDefinition | undefined => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    return JSON.parse(raw) as FormDefinition;
  } catch {
    return undefined;
  }
};

export default function BuilderPage() {
  const [definition, setDefinition] = useState<FormDefinition>(() =>
    createDefaultDefinition(),
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time draft load from localStorage
    setDefinition(loadSaved() ?? createDefaultDefinition());
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  return (
    <Builder
      onChange={(next) => {
        setDefinition(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }}
      onClear={(fresh) => {
        localStorage.removeItem(STORAGE_KEY);
        setDefinition(fresh);
      }}
      onComplete={(definition) => {
        console.log(definition);
      }}
      preview={(definition) => <FormPreview definition={definition} />}
      value={definition}
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
