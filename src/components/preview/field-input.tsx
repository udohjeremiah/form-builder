import type { FieldInputProps } from "./types";

import { CheckboxField } from "./field/checkbox";
import { ColorField } from "./field/color";
import { DateField } from "./field/date";
import { DatetimeField } from "./field/datetime";
import { EmailField } from "./field/email";
import { FileField } from "./field/file";
import { NumberField } from "./field/number";
import { PasswordField } from "./field/password";
import { RadioField } from "./field/radio";
import { RatingField } from "./field/rating";
import { SelectField } from "./field/select";
import { SliderField } from "./field/slider";
import { TelField } from "./field/tel";
import { TextField } from "./field/text";
import { TextareaField } from "./field/textarea";
import { TimeField } from "./field/time";
import { ToggleField } from "./field/toggle";
import { UrlField } from "./field/url";

const rest = ({
  disabled,
  error,
  onBlur,
  onChange,
  touched,
  value,
}: FieldInputProps): Omit<FieldInputProps, "field"> => ({
  disabled,
  error,
  onBlur,
  onChange,
  touched,
  value,
});

export function FieldInput(props: FieldInputProps) {
  const common = rest(props);

  switch (props.field.type) {
    case "checkbox": {
      return <CheckboxField {...common} field={props.field} />;
    }
    case "color": {
      return <ColorField {...common} field={props.field} />;
    }
    case "date": {
      return <DateField {...common} field={props.field} />;
    }
    case "datetime": {
      return <DatetimeField {...common} field={props.field} />;
    }
    case "email": {
      return <EmailField {...common} field={props.field} />;
    }
    case "file": {
      return <FileField {...common} field={props.field} />;
    }
    case "number": {
      return <NumberField {...common} field={props.field} />;
    }
    case "password": {
      return <PasswordField {...common} field={props.field} />;
    }
    case "radio": {
      return <RadioField {...common} field={props.field} />;
    }
    case "rating": {
      return <RatingField {...common} field={props.field} />;
    }
    case "select": {
      return <SelectField {...common} field={props.field} />;
    }
    case "slider": {
      return <SliderField {...common} field={props.field} />;
    }
    case "tel": {
      return <TelField {...common} field={props.field} />;
    }
    case "text": {
      return <TextField {...common} field={props.field} />;
    }
    case "textarea": {
      return <TextareaField {...common} field={props.field} />;
    }
    case "time": {
      return <TimeField {...common} field={props.field} />;
    }
    case "toggle": {
      return <ToggleField {...common} field={props.field} />;
    }
    case "url": {
      return <UrlField {...common} field={props.field} />;
    }
    default: {
      return null;
    }
  }
}
