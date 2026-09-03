import type { FieldInputPropsFor } from "../types";

import { TextLikeField } from "./text-like";

export function EmailField(props: FieldInputPropsFor<"email">) {
  return <TextLikeField {...props} type="email" />;
}
