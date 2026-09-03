import type { FieldInputPropsFor } from "../types";

import { TextLikeField } from "./text-like";

export function TextField(props: FieldInputPropsFor<"text">) {
  return <TextLikeField {...props} type="text" />;
}
