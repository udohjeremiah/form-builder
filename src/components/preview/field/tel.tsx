import type { FieldComponentProps } from "@/components/builder/form/form-definition";

import { TextLikeField } from "./text-like";

export function TelField(props: FieldComponentProps) {
  return <TextLikeField {...props} type="tel" />;
}
