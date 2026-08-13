'use client';
import {
  DatePicker as AriaDatePicker,
  type DatePickerProps as AriaDatePickerProps,
  type DateValue,
  Group,
  type ValidationResult
} from 'react-aria-components/DatePicker';
import {DateInput, DateSegment} from '~/components/ui/DateField';
import {Label, FieldError, Description} from '~/components/ui/Form';
import {FieldButton} from '~/components/ui/Form';
import {Calendar} from '~/components/ui/Calendar';
import {Popover} from '~/components/ui/Popover';
import {ChevronDown} from 'lucide-react';
import './DatePicker.css';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';

export interface DatePickerProps<T extends DateValue> extends AriaDatePickerProps<T> {
  label?: string;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
}

export function DatePicker<T extends DateValue>({
  label,
  description,
  errorMessage,
  ...props
}: DatePickerProps<T>) {
  return (
    <AriaDatePicker {...props} className={composeRenderProps(props.className, (className) =>
            		`react-aria-DatePicker ${className ?? ''}`.trim()
          	)} >
      <Label>{label}</Label>
      <Group>
        <DateInput>{segment => <DateSegment segment={segment} />}</DateInput>
        <FieldButton>
          <ChevronDown />
        </FieldButton>
      </Group>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
      <Popover hideArrow>
        <Calendar />
      </Popover>
    </AriaDatePicker>
  );
}
