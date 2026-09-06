import type { FieldComponentProps } from "@/components/builder/form/form-definition";

import { TextLikeField } from "./text-like";

export function TextField(props: FieldComponentProps) {
  return <TextLikeField {...props} type="text" />;
}
