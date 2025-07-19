import React, { useState } from 'react';
import { LoanInput, ValidationError } from '../types/loan';
import { validateLoanInput } from '../lib/validation';

interface LoanInputFormProps {
  initialValues?: LoanInput;
  onSubmit: (input: LoanInput) => void;
  onValidationError: (errors: ValidationError[]) => void;
}

const defaultValues: LoanInput = {
  principal: 1000000,
  annualRate: 4.5,
  years: 30,
  startDate: new Date(),
  paymentType: 'equal-payment',
};

export const LoanInputForm: React.FC<LoanInputFormProps> = ({ initialValues, onSubmit, onValidationError }) => {
  const [values, setValues] = useState<LoanInput>(initialValues || defaultValues);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [touched, setTouched] = useState<{ [key in keyof LoanInput]?: boolean }>({});

  const handleChange = (field: keyof LoanInput, value: any) => {
    let newValue = value;
    if (field === 'principal' || field === 'annualRate' || field === 'years') {
      newValue = Number(value);
    }
    if (field === 'startDate') {
      newValue = new Date(value);
    }
    setValues({ ...values, [field]: newValue });
    // 实时校验
    const next = { ...values, [field]: newValue };
    const validationErrors = validateLoanInput(next);
    setErrors(validationErrors);
    onValidationError(validationErrors);
  };

  const handleBlur = (field: keyof LoanInput) => {
    setTouched({ ...touched, [field]: true });
    const validationErrors = validateLoanInput(values);
    setErrors(validationErrors);
    onValidationError(validationErrors);
  };

  const handleFocus = (field: keyof LoanInput) => {
    setTouched({ ...touched, [field]: true });
  };

  const handleClearError = (field: keyof LoanInput) => {
    setTouched({ ...touched, [field]: false });
  };

  const handleValidate = () => {
    const validationErrors = validateLoanInput(values);
    setErrors(validationErrors);
    onValidationError(validationErrors);
    return validationErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (handleValidate()) {
      onSubmit(values);
    }
  };

  const getError = (field: keyof LoanInput) => errors.find(e => e.field === field);
  const isValid = errors.length === 0;

  return (
    <form className="max-w-xl mx-auto p-4 bg-white rounded shadow" onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block mb-1 font-medium">贷款金额（万元）</label>
        <input
          type="number"
          className={`w-full border rounded px-3 py-2 focus:outline-none ${getError('principal') && touched.principal ? 'border-red-500' : 'border-gray-300'}`}
          value={values.principal ? (values.principal / 10000) : ''}
          min={1}
          max={10000}
          step={0.01}
          onChange={e => {
            const val = Number(e.target.value);
            handleChange('principal', isNaN(val) ? '' : Math.round(val * 10000));
          }}
          onBlur={() => handleBlur('principal')}
          onFocus={() => handleFocus('principal')}
          placeholder="请输入贷款金额（万元）"
        />
        {getError('principal') && touched.principal && (
          <div className="text-red-600 text-sm mt-1 cursor-pointer" onClick={() => handleClearError('principal')}>{getError('principal')?.message}</div>
        )}
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium">年利率（%）</label>
        <input
          type="number"
          className={`w-full border rounded px-3 py-2 focus:outline-none ${getError('annualRate') && touched.annualRate ? 'border-red-500' : 'border-gray-300'}`}
          value={values.annualRate}
          min={0.01}
          max={50}
          step={0.01}
          onChange={e => handleChange('annualRate', e.target.value)}
          onBlur={() => handleBlur('annualRate')}
          onFocus={() => handleFocus('annualRate')}
        />
        {getError('annualRate') && touched.annualRate && (
          <div className="text-red-600 text-sm mt-1 cursor-pointer" onClick={() => handleClearError('annualRate')}>{getError('annualRate')?.message}</div>
        )}
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium">贷款年限</label>
        <input
          type="number"
          className={`w-full border rounded px-3 py-2 focus:outline-none ${getError('years') && touched.years ? 'border-red-500' : 'border-gray-300'}`}
          value={values.years}
          min={1}
          max={50}
          step={1}
          onChange={e => handleChange('years', e.target.value)}
          onBlur={() => handleBlur('years')}
          onFocus={() => handleFocus('years')}
        />
        {getError('years') && touched.years && (
          <div className="text-red-600 text-sm mt-1 cursor-pointer" onClick={() => handleClearError('years')}>{getError('years')?.message}</div>
        )}
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium">起始还款日期</label>
        <input
          type="date"
          className={`w-full border rounded px-3 py-2 focus:outline-none ${getError('startDate') && touched.startDate ? 'border-red-500' : 'border-gray-300'}`}
          value={(() => {
            if (!values.startDate) return '';
            if (typeof values.startDate === 'string') {
              return String(values.startDate).slice(0, 10);
            }
            if (values.startDate instanceof Date && !isNaN(values.startDate.getTime())) {
              return values.startDate.toISOString().slice(0, 10);
            }
            return '';
          })()}
          onChange={e => handleChange('startDate', e.target.value)}
          onBlur={() => handleBlur('startDate')}
          onFocus={() => handleFocus('startDate')}
        />
        {getError('startDate') && touched.startDate && (
          <div className="text-red-600 text-sm mt-1 cursor-pointer" onClick={() => handleClearError('startDate')}>{getError('startDate')?.message}</div>
        )}
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium">还款方式</label>
        <select
          className={`w-full border rounded px-3 py-2 focus:outline-none ${getError('paymentType') && touched.paymentType ? 'border-red-500' : 'border-gray-300'}`}
          value={values.paymentType}
          onChange={e => handleChange('paymentType', e.target.value)}
          onBlur={() => handleBlur('paymentType')}
          onFocus={() => handleFocus('paymentType')}
        >
          <option value="equal-payment">等额本息</option>
          <option value="equal-principal">等额本金</option>
        </select>
        {getError('paymentType') && touched.paymentType && (
          <div className="text-red-600 text-sm mt-1 cursor-pointer" onClick={() => handleClearError('paymentType')}>{getError('paymentType')?.message}</div>
        )}
      </div>
      <button
        type="submit"
        className={`w-full py-2 rounded transition ${isValid ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
        disabled={!isValid}
      >
        计算还款计划
      </button>
    </form>
  );
}; 