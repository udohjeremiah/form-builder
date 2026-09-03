import type { FieldInputPropsFor } from "../types";

import { TextLikeField } from "./text-like";

export function TelField(props: FieldInputPropsFor<"tel">) {
  return <TextLikeField {...props} type="tel" />;
}
