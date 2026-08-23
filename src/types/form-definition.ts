export type AnyFieldDefinition = {
  [Type in FieldType]: FieldDefinition<Type>;
}[FieldType];

export interface BaseFieldAttributes {
  label: string;
  placeholder?: string;
  required?: boolean;
}

export type ConditionOperator =
  "contains" | "empty" | "equals" | "not_empty" | "not_equals";

export interface EmailFieldAttributes extends BaseFieldAttributes {
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
}

export interface FieldAttributesByType {
  checkbox: BaseFieldAttributes;
  color: BaseFieldAttributes;
  date: BaseFieldAttributes;
  datetime: BaseFieldAttributes;
  email: EmailFieldAttributes;
  file: FileFieldAttributes;
  number: NumberFieldAttributes;
  password: PasswordFieldAttributes;
  phone: PhoneFieldAttributes;
  radio: OptionsFieldAttributes;
  rating: RatingFieldAttributes;
  select: OptionsFieldAttributes;
  slider: SliderFieldAttributes;
  text: TextFieldAttributes;
  textarea: TextareaFieldAttributes;
  time: BaseFieldAttributes;
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
  disable?: FieldCondition;
  hide?: FieldCondition;
  show?: FieldCondition;
}

export interface FieldDefinition<Type extends FieldType = FieldType> {
  attributes: FieldAttributesByType[Type];
  conditions: FieldConditions;
  id: string;
  type: Type;
  validation: ValidationRule[];
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
  attributes: FormDefinitionAttributes;
  id: string;
  steps: StepDefinition[];
  version: number;
}

export interface FormDefinitionAttributes {
  autosave?: boolean;
  description?: string;
  multiStep?: boolean;
  name?: string;
  sections?: boolean;
  submitLabel?: string;
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
}

export interface PersistedFormDefinition extends FormDefinition {
  savedAt: number;
}

export interface PhoneFieldAttributes extends BaseFieldAttributes {
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
}

export interface RatingFieldAttributes extends BaseFieldAttributes {
  max?: number;
  min?: number;
}

export interface SectionDefinition {
  attributes: TitledAttributes;
  fields: AnyFieldDefinition[];
  id: string;
}

export interface SliderFieldAttributes extends BaseFieldAttributes {
  max?: number;
  min?: number;
  step?: number;
}

export interface StepDefinition {
  attributes: TitledAttributes;
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
}

export interface TitledAttributes {
  description?: string;
  title?: string;
}

export interface UrlFieldAttributes extends BaseFieldAttributes {
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
}

export interface ValidationRule {
  message: string;
  type: ValidationRuleType;
  value?: number | string;
}

export type ValidationRuleType =
  "custom" | "email" | "max" | "min" | "pattern" | "required";
