export type AnyFieldDefinition = {
  [Type in FieldType]: FieldDefinition<Type>;
}[FieldType];

export interface BaseFieldAttributes {
  description?: string;
  label: string;
  placeholder?: string;
  required?: boolean;
}

/**
 * A group of sibling conditions combined with a single combinator. An empty
 * group is always satisfied.
 */
export interface ConditionGroup {
  combinator: "all" | "any";
  conditions: FieldCondition[];
}

export type ConditionOperator =
  | "contains"
  | "empty"
  | "eq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "neq"
  | "not_contains"
  | "not_empty";

export interface DateTimeFieldAttributes extends BaseFieldAttributes {
  maxDate?: string;
  minDate?: string;
}

export interface EmailFieldAttributes extends BaseFieldAttributes {
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
}

export interface FieldAttributesByType {
  checkbox: BaseFieldAttributes;
  color: BaseFieldAttributes;
  date: DateTimeFieldAttributes;
  datetime: DateTimeFieldAttributes;
  email: EmailFieldAttributes;
  file: FileFieldAttributes;
  number: NumberFieldAttributes;
  password: PasswordFieldAttributes;
  phone: PhoneFieldAttributes;
  radio: OptionsFieldAttributes;
  rating: RatingFieldAttributes;
  select: SelectFieldAttributes;
  slider: SliderFieldAttributes;
  text: TextFieldAttributes;
  textarea: TextareaFieldAttributes;
  time: DateTimeFieldAttributes;
  toggle: BaseFieldAttributes;
  url: UrlFieldAttributes;
}

export interface FieldCondition {
  fieldId: string;
  operator: ConditionOperator;
  value?: string;
}

/**
 * Effects a field can define. Each key holds the condition under which the
 * effect applies; an absent key means the effect never applies.
 */
export interface FieldConditions {
  disable?: ConditionGroup;
  hide?: ConditionGroup;
  show?: ConditionGroup;
}

export interface FieldDefinition<Type extends FieldType = FieldType> {
  attributes: FieldAttributesByType[Type];
  conditions: FieldConditions;
  id: string;
  type: Type;
}

export type FieldType =
  | "checkbox"
  | "color"
  | "date"
  | "datetime"
  | "email"
  | "file"
  | "number"
  | "password"
  | "phone"
  | "radio"
  | "rating"
  | "select"
  | "slider"
  | "text"
  | "textarea"
  | "time"
  | "toggle"
  | "url";

export interface FileFieldAttributes extends BaseFieldAttributes {
  accept?: string[];
  maxSize?: number;
  multiple?: boolean;
}

export interface FormDefinition {
  id: string;
  steps: StepDefinition[];
  version: number;
}

export interface NumberFieldAttributes extends BaseFieldAttributes {
  max?: number;
  min?: number;
  step?: number;
}

export interface OptionsFieldAttributes extends BaseFieldAttributes {
  options?: string[];
}

export interface PasswordFieldAttributes extends BaseFieldAttributes {
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
}

export interface PersistedFormDefinition extends FormDefinition {
  savedAt: number;
}

export interface PhoneFieldAttributes extends BaseFieldAttributes {
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
}

export interface RatingFieldAttributes extends BaseFieldAttributes {
  max?: number;
  min?: number;
}

export interface SectionAttributes {
  description?: string;
  title?: string;
}

export interface SectionDefinition {
  attributes: SectionAttributes;
  fields: AnyFieldDefinition[];
  id: string;
}

export interface SelectFieldAttributes extends OptionsFieldAttributes {
  multiple?: boolean;
}

export interface SliderFieldAttributes extends BaseFieldAttributes {
  max?: number;
  min?: number;
  step?: number;
}

export interface StepAttributes {
  description?: string;
  nextLabel?: string;
  previousLabel?: string;
  title?: string;
}

export interface StepDefinition {
  attributes: StepAttributes;
  id: string;
  sections: SectionDefinition[];
}

export interface TextareaFieldAttributes extends BaseFieldAttributes {
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
}

export interface TextFieldAttributes extends BaseFieldAttributes {
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
}

export interface UrlFieldAttributes extends BaseFieldAttributes {
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
}
