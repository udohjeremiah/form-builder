import type { FieldComponentProps } from "@/components/builder/form/form-definition";

import { TextLikeField } from "./text-like";

export function PasswordField(props: FieldComponentProps) {
  return <TextLikeField {...props} type="password" />;
}
