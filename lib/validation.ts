import { LoanInput, ValidationError } from '../types/loan';

export interface ValidationRule {
  field: keyof LoanInput;
  validator: (value: any) => boolean;
  message: string;
}

export const validationRules: ValidationRule[] = [
  {
    field: 'principal',
    validator: (value) => typeof value === 'number' && value > 0 && value <= 100000000,
    message: '贷款金额必须在0-1亿之间',
  },
  {
    field: 'annualRate',
    validator: (value) => typeof value === 'number' && value > 0 && value <= 50,
    message: '年利率必须在0-50%之间',
  },
  {
    field: 'years',
    validator: (value) => Number.isInteger(value) && value > 0 && value <= 50,
    message: '贷款年限必须为1-50年',
  },
  {
    field: 'startDate',
    validator: (value) => value instanceof Date && !isNaN(value.getTime()),
    message: '请选择有效的起始还款日期',
  },
  {
    field: 'paymentType',
    validator: (value) => value === 'equal-payment' || value === 'equal-principal',
    message: '请选择还款方式',
  },
];

export function validateLoanInput(input: LoanInput): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const rule of validationRules) {
    if (!rule.validator(input[rule.field])) {
      errors.push({ field: rule.field, message: rule.message });
    }
  }
  return errors;
} 