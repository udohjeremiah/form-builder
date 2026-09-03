import type { FieldInputPropsFor } from "../types";

import { TextLikeField } from "./text-like";

export function UrlField(props: FieldInputPropsFor<"url">) {
  return <TextLikeField {...props} type="url" />;
}
