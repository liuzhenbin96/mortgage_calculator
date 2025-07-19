// 贷款信息输入
export interface LoanInput {
  principal: number;           // 贷款本金
  annualRate: number;         // 年利率
  years: number;              // 贷款年限
  startDate: Date;            // 开始还款日期
  paymentType: 'equal-payment' | 'equal-principal'; // 还款方式
}

// 单期还款记录
export interface PaymentRecord {
  period: number;             // 期数
  date: Date;                // 还款日期
  payment: number;           // 还款金额
  principal: number;         // 本金
  interest: number;          // 利息
  remainingBalance: number;  // 剩余本金
  isAdjusted?: boolean;      // 是否被调整过
  rate?: number;             // 当期利率（%）
  adjustmentType?: 'payment' | 'rate';  // 调整类型
}

// 操作记录（扩展）
export interface Operation {
  id: string;
  type: 'rate-adjustment' | 'payment-adjustment' | 'prepayment';
  period: number;            // 操作期数
  timestamp: Date;           // 操作时间
  paymentDate?: Date;        // 操作期数对应的还款日期
  parameters: any;           // 操作参数
  description: string;       // 操作描述
  beforeSummary?: PaymentSummary;  // 操作前的还款总结
  afterSummary?: PaymentSummary;   // 操作后的还款总结
}

// 还款计划
export interface PaymentPlan {
  id: string;
  name: string;
  loanInput: LoanInput;
  payments: PaymentRecord[];
  operations: Operation[];
  summary: PaymentSummary;
  createdAt: Date;
}

// 还款总结
export interface PaymentSummary {
  totalPayment: number;      // 总还款金额
  totalInterest: number;     // 总利息
  totalPeriods: number;      // 总期数
  monthlyPayment?: number;   // 月供（等额本息）
  firstPayment?: number;     // 首期还款（等额本金）
  lastPayment?: number;      // 末期还款（等额本金）
}

// 输入验证错误
export interface ValidationError {
  field: string;
  message: string;
} 