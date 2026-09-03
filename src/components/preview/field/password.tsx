import type { FieldInputPropsFor } from "../types";

import { TextLikeField } from "./text-like";

export function PasswordField(props: FieldInputPropsFor<"password">) {
  return <TextLikeField {...props} type="password" />;
}
