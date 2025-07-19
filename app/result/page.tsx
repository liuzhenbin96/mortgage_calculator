'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LoanInput, PaymentRecord, PaymentSummary, Operation } from '../../types/loan';
import { PaymentScheduleTable } from '../../components/PaymentScheduleTable';
import { PaymentSummaryPanel } from '../../components/PaymentSummaryPanel';
import { OperationHistory } from '../../components/OperationHistory';
import { 
  RateAdjustmentModal, 
  PaymentAdjustmentModal, 
  PrepaymentModal 
} from '../../components/OperationModals';

export default function ResultPage() {
  const router = useRouter();
  const [loanInput, setLoanInput] = useState<LoanInput | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [operations, setOperations] = useState<Operation[]>([]);
  
  // 单独记录初始方案的信息，不受后续操作影响
  const [initialSummary, setInitialSummary] = useState<PaymentSummary | null>(null);

  // 模态框状态
  const [activeModal, setActiveModal] = useState<'rate' | 'payment' | 'prepay' | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [modalData, setModalData] = useState<any>(null);

  // 错误状态
  const [error, setError] = useState<string>('');

  // 辅助函数
  const addMonths = useCallback((date: Date | string, months: number): Date => {
    try {
      const base = typeof date === 'string' ? new Date(date) : date;
      const d = new Date(base);
      d.setMonth(d.getMonth() + months);
      if (d.getDate() !== base.getDate()) d.setDate(0);
      return d;
    } catch (err) {
      console.error('Date calculation error:', err);
      return new Date();
    }
  }, []);

  // 获取还款总结
  const getPaymentSummary = useCallback((payments: PaymentRecord[], paymentType: string, operations: Operation[] = []): PaymentSummary => {
    try {
      // 计算正常还款总额
      const normalPayment = payments.reduce((sum, p) => sum + (p.payment || 0), 0);
      
      // 计算提前还款总额
      const prepaymentTotal = operations
        .filter(op => op.type === 'prepayment')
        .reduce((sum, op) => sum + (op.parameters.amount || 0), 0);
      
      // 总还款额 = 正常还款 + 提前还款
      const totalPayment = normalPayment + prepaymentTotal;
      const totalInterest = payments.reduce((sum, p) => sum + (p.interest || 0), 0);
      

      
      let monthlyPayment: number | undefined = undefined;
      let firstPayment: number | undefined = undefined;
      let lastPayment: number | undefined = undefined;
      
      if (paymentType === 'equal-payment' && payments.length > 0) {
        // 对于等额本息，需要找到代表性的月供金额
        let representativePayment = payments[0]?.payment;
        
        // 策略1：优先找利率调整后的记录（最新的利率调整）
        for (let i = payments.length - 1; i >= 0; i--) {
          const payment = payments[i];
          if (payment.adjustmentType === 'rate') {
            representativePayment = payment.payment;
            break;
          }
        }
        
        // 策略2：如果没有利率调整，找一个稳定的月供（排除最后几期和手动调整）
        if (!payments.some(p => p.adjustmentType === 'rate')) {
          // 统计各种还款金额的出现频率
          const paymentFreq = new Map<number, number>();
          for (let i = 0; i < Math.max(1, payments.length - 3); i++) { // 排除最后3期
            const payment = payments[i];
            if (!payment.isAdjusted && payment.payment > 0) {
              const rounded = Math.round(payment.payment * 100) / 100; // 四舍五入到分
              paymentFreq.set(rounded, (paymentFreq.get(rounded) || 0) + 1);
            }
          }
          
          // 找出现频率最高的月供金额
          let maxFreq = 0;
          let mostFrequentPayment = representativePayment;
          paymentFreq.forEach((freq, payment) => {
            if (freq > maxFreq) {
              maxFreq = freq;
              mostFrequentPayment = payment;
            }
          });
          
          if (maxFreq > 0) {
            representativePayment = mostFrequentPayment;
          }
        }
        
        monthlyPayment = representativePayment;
      } else if (paymentType === 'equal-principal' && payments.length > 0) {
        firstPayment = payments[0].payment;
        lastPayment = payments[payments.length - 1].payment;
      }
      
      return {
        totalPayment: Number(totalPayment.toFixed(2)),
        totalInterest: Number(totalInterest.toFixed(2)),
        totalPeriods: payments.length,
        monthlyPayment,
        firstPayment,
        lastPayment,
      };
    } catch (err) {
      console.error('Summary calculation error:', err);
      return {
        totalPayment: 0,
        totalInterest: 0,
        totalPeriods: 0,
      };
    }
  }, []);



  // 修复利率调整后月供计算的问题
  const replayPlan = useCallback((input: LoanInput, ops: Operation[]): { payments: PaymentRecord[]; summary: PaymentSummary } => {
    try {
      // 调试：等额本金计算
      if (input.paymentType === 'equal-principal') {
        console.log('等额本金计算开始:', {
          principal: input.principal,
          rate: input.annualRate,
          years: input.years,
          totalPeriods: input.years * 12
        });
      }

      // 操作状态记录
      interface OperationState {
        remainingPrincipal: number;
        rate: number;
        remainingPeriods: number;
        monthlyPayment: number;
        monthlyPrincipal: number;
        currentPeriod: number;
        lastDate: Date;
        paymentType: 'equal-payment' | 'equal-principal';
      }

      const totalPeriods = input.years * 12;
      const monthlyRate = input.annualRate / 100 / 12;

      // 初始化状态
      const currentState: OperationState = {
        remainingPrincipal: input.principal,
        rate: input.annualRate,
        remainingPeriods: totalPeriods,
        monthlyPayment: 0,
        monthlyPrincipal: 0,
        currentPeriod: 1,
        lastDate: addMonths(input.startDate, -1),
        paymentType: input.paymentType,
      };

      // 根据还款方式初始化月供或月本金
      if (input.paymentType === 'equal-payment') {
        currentState.monthlyPayment = input.principal * monthlyRate * 
          Math.pow(1 + monthlyRate, totalPeriods) /
          (Math.pow(1 + monthlyRate, totalPeriods) - 1);
      } else {
        currentState.monthlyPrincipal = input.principal / totalPeriods;
        console.log('等额本金初始化:', {
          monthlyPrincipal: currentState.monthlyPrincipal,
          totalPeriods,
          principal: input.principal
        });
      }

      let plan: PaymentRecord[] = [];
      const sortedOps = [...ops].sort((a, b) => a.period - b.period);

      // 生成还款计划
      while (currentState.remainingPrincipal > 0.01 && currentState.currentPeriod <= input.years * 12) {
        // 检查本期是否有操作
        const currentPeriodOps = sortedOps.filter(op => op.period === currentState.currentPeriod);
        
        // 检查是否有利率调整（但不在当期生效，而是影响后续计算）
        const rateAdjustment = currentPeriodOps.find(op => op.type === 'rate-adjustment');
        
        // 检查上一期是否有利率调整（影响当期的月供）
        const prevPeriodRateAdjustment = sortedOps.find(op => 
          op.type === 'rate-adjustment' && op.period === currentState.currentPeriod - 1
        );
        
        // 生成本期还款记录（使用更新后的利率和月供）
        const monthlyRate = currentState.rate / 100 / 12;
        const interest = currentState.remainingPrincipal * monthlyRate;
        let principalPart: number;
        let payment: number;

        if (currentState.paymentType === 'equal-payment') {
          // 等额本息：使用更新后的月供
          payment = currentState.monthlyPayment;
          principalPart = payment - interest;
          if (principalPart > currentState.remainingPrincipal) {
            principalPart = currentState.remainingPrincipal;
            payment = principalPart + interest; // 最后一期调整
          }
        } else {
          // 等额本金
          principalPart = Math.min(currentState.monthlyPrincipal, currentState.remainingPrincipal);
          payment = principalPart + interest;
          
          // 调试前几期的计算
          if (currentState.currentPeriod <= 3) {
            console.log(`等额本金期数 ${currentState.currentPeriod}:`, {
              monthlyPrincipal: currentState.monthlyPrincipal,
              remainingPrincipal: currentState.remainingPrincipal,
              principalPart,
              interest: interest.toFixed(2),
              payment: payment.toFixed(2)
            });
          }
        }

        // 检查本期是否有月供调整
        const paymentAdjustment = currentPeriodOps.find(op => op.type === 'payment-adjustment');
        if (paymentAdjustment) {
          // 月供调整：只影响当期，重新计算本金和利息分配
          payment = paymentAdjustment.parameters.newPayment;
          principalPart = payment - interest;
          if (principalPart > currentState.remainingPrincipal) {
            principalPart = currentState.remainingPrincipal;
          }
          if (principalPart < 0) {
            principalPart = 0;
          }
        }
        
        const record = {
          period: currentState.currentPeriod,
          date: addMonths(currentState.lastDate, 1),
          payment: Number(payment.toFixed(2)),
          principal: Number(principalPart.toFixed(2)),
          interest: Number(interest.toFixed(2)),
          remainingBalance: Number((currentState.remainingPrincipal - principalPart).toFixed(2)),
          rate: currentState.rate,
          isAdjusted: paymentAdjustment || prevPeriodRateAdjustment ? true : false,
          adjustmentType: paymentAdjustment ? 'payment' as const : prevPeriodRateAdjustment ? 'rate' as const : undefined,
        };
        

        
        plan.push(record);

        // 更新状态
        currentState.remainingPrincipal -= principalPart;
        currentState.lastDate = addMonths(currentState.lastDate, 1);
        currentState.remainingPeriods--;
        currentState.currentPeriod++;

        // 处理利率调整（从下一期开始生效）
        if (rateAdjustment) {
          const oldRate = currentState.rate;
          const oldPayment = currentState.monthlyPayment;
          
          currentState.rate = rateAdjustment.parameters.newRate;
          const newMonthlyRate = currentState.rate / 100 / 12;
          
          if (currentState.remainingPrincipal > 0.01 && currentState.remainingPeriods > 0) {
            if (currentState.paymentType === 'equal-payment') {
              // 等额本息：重新计算月供
              currentState.monthlyPayment = currentState.remainingPrincipal * newMonthlyRate * 
                Math.pow(1 + newMonthlyRate, currentState.remainingPeriods) /
                (Math.pow(1 + newMonthlyRate, currentState.remainingPeriods) - 1);
              

            }
            // 等额本金：月本金不变，只有利息部分受利率影响
          }
        }

        // 处理提前还款操作
        const prepaymentOp = currentPeriodOps.find(op => op.type === 'prepayment');
        if (prepaymentOp) {
          if (prepaymentOp.parameters.type === 'reduce-term') {
            // 提前还款缩短年限
            currentState.remainingPrincipal -= prepaymentOp.parameters.amount;
            if (currentState.remainingPrincipal < 0) currentState.remainingPrincipal = 0;
            
            // 重新计算剩余期数
            const monthlyRate = currentState.rate / 100 / 12;
            if (currentState.remainingPrincipal > 0.01) {
              if (currentState.paymentType === 'equal-payment') {
                // 等额本息：用月供反推期数
                const pmt = currentState.monthlyPayment;
                const pv = currentState.remainingPrincipal;
                const r = monthlyRate;
                
                if (pmt > pv * r) {
                  currentState.remainingPeriods = Math.ceil(
                    Math.log(pmt / (pmt - pv * r)) / Math.log(1 + r)
                  );
                } else {
                  currentState.remainingPeriods = 1;
                }
              } else {
                // 等额本金：用月本金反推期数
                currentState.remainingPeriods = Math.ceil(
                  currentState.remainingPrincipal / currentState.monthlyPrincipal
                );
              }
            } else {
              currentState.remainingPeriods = 0;
            }
          } else {
            // 提前还款减少月供
            currentState.remainingPrincipal -= prepaymentOp.parameters.amount;
            if (currentState.remainingPrincipal < 0) currentState.remainingPrincipal = 0;
            
            // 重新计算月供或月本金
            if (currentState.paymentType === 'equal-payment') {
              // 等额本息：重新计算月供
              const monthlyRate = currentState.rate / 100 / 12;
              if (currentState.remainingPrincipal > 0.01 && currentState.remainingPeriods > 0) {
                currentState.monthlyPayment = currentState.remainingPrincipal * monthlyRate * 
                  Math.pow(1 + monthlyRate, currentState.remainingPeriods) /
                  (Math.pow(1 + monthlyRate, currentState.remainingPeriods) - 1);
              } else {
                currentState.monthlyPayment = 0;
              }
            } else {
              // 等额本金：重新计算月本金
              if (currentState.remainingPeriods > 0) {
                currentState.monthlyPrincipal = currentState.remainingPrincipal / currentState.remainingPeriods;
              } else {
                currentState.monthlyPrincipal = 0;
              }
            }
          }
        }
      }

      return { payments: plan, summary: getPaymentSummary(plan, input.paymentType, ops) };
    } catch (err) {
      console.error('replayPlan error:', err);
      return { payments: [], summary: { totalPayment: 0, totalInterest: 0, monthlyPayment: 0, totalPeriods: 0 } };
    }
  }, [getPaymentSummary, addMonths]);

  // 页面初始化
  useEffect(() => {
    try {
      const storedData = sessionStorage.getItem('loanInput');
      if (storedData) {
        const data = JSON.parse(storedData);
        const input: LoanInput = {
          ...data,
          startDate: new Date(data.startDate),
        };
        setLoanInput(input);
        
        // 计算初始还款计划和总结
        const { payments: initialPlan, summary: initialSummaryData } = replayPlan(input, []);
        setPayments(initialPlan);
        setSummary(initialSummaryData);
        
        // 单独保存初始总结，不会被后续操作改变
        setInitialSummary({ ...initialSummaryData });
        
      } else {
        // 如果没有数据，跳转回首页
        router.push('/');
        return;
      }
    } catch (err) {
      console.error('Initialization error:', err);
      setError('页面初始化失败');
    }
  }, [replayPlan, router]);

  // 模态框操作
  const openModal = useCallback((type: 'rate' | 'payment' | 'prepay', period: number) => {
    try {
      const payment = payments.find(p => p.period === period);
      if (!payment) return;
      
      setActiveModal(type);
      setSelectedPeriod(period);
      setModalData({
        currentRate: payment.rate || loanInput?.annualRate || 0,
        originalPayment: payment.payment,
        minPayment: payment.interest + 1,
        remainingBalance: payment.remainingBalance,
      });
    } catch (err) {
      console.error('Open modal error:', err);
    }
  }, [payments, loanInput]);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setSelectedPeriod(null);
    setModalData(null);
  }, []);

  // 操作处理函数 - 修改为使用初始总结进行对比
  const handleRateAdjust = useCallback((newRate: number) => {
    if (!loanInput || selectedPeriod == null || !initialSummary) return;
    
    try {
      // 使用当前总结作为操作前的总结
      const beforeSummary = { ...summary };
      
      const operationTime = new Date();
      const selectedPayment = payments.find(p => p.period === selectedPeriod);
      const paymentDate = selectedPayment?.date;
      
      const newOp: Operation = {
        id: Date.now().toString(),
        type: 'rate-adjustment',
        period: selectedPeriod,
        timestamp: operationTime,
        paymentDate: paymentDate,
        parameters: { newRate },
        description: `第${selectedPeriod}期利率调整为${newRate}%`,
        beforeSummary: beforeSummary,
      };
      
      const newOps = [...operations, newOp];
      const { payments: newPlan, summary: newSummary } = replayPlan(loanInput, newOps);
      
      // 记录操作后的总结
      newOp.afterSummary = newSummary;
      
      setPayments(newPlan);
      setSummary(newSummary);
      setOperations(newOps);
      closeModal();
    } catch (err) {
      console.error('Rate adjust error:', err);
      setError('利率调整失败');
    }
  }, [loanInput, selectedPeriod, operations, summary, initialSummary, replayPlan, closeModal]);

  const handlePaymentAdjust = useCallback((newPayment: number) => {
    if (!loanInput || selectedPeriod == null || !initialSummary) return;
    
    try {
      // 使用当前总结作为操作前的总结
      const beforeSummary = { ...summary };
      
      const operationTime = new Date();
      const selectedPayment = payments.find(p => p.period === selectedPeriod);
      const paymentDate = selectedPayment?.date;
      
      const newOp: Operation = {
        id: Date.now().toString(),
        type: 'payment-adjustment',
        period: selectedPeriod,
        timestamp: operationTime,
        paymentDate: paymentDate,
        parameters: { newPayment },
        description: `第${selectedPeriod}期${loanInput.paymentType === 'equal-payment' ? '月供' : '月还款'}调整为${newPayment}`,
        beforeSummary: beforeSummary,
      };
      
      const newOps = [...operations, newOp];
      const { payments: newPlan, summary: newSummary } = replayPlan(loanInput, newOps);
      
      // 记录操作后的总结
      newOp.afterSummary = newSummary;
      
      setPayments(newPlan);
      setSummary(newSummary);
      setOperations(newOps);
      closeModal();
    } catch (err) {
      console.error('Payment adjust error:', err);
      setError('月供调整失败');
    }
  }, [loanInput, selectedPeriod, operations, summary, initialSummary, replayPlan, closeModal]);

  const handlePrepay = useCallback((amount: number, type: 'reduce-term' | 'reduce-payment') => {
    if (!loanInput || selectedPeriod == null || !initialSummary) return;
    
    try {
      // 使用当前总结作为操作前的总结
      const beforeSummary = { ...summary };
      
      const operationTime = new Date();
      const selectedPayment = payments.find(p => p.period === selectedPeriod);
      const paymentDate = selectedPayment?.date;
      
      const newOp: Operation = {
        id: Date.now().toString(),
        type: 'prepayment',
        period: selectedPeriod,
        timestamp: operationTime,
        paymentDate: paymentDate,
        parameters: { amount, type },
        description: `第${selectedPeriod}期提前还款${(amount/10000).toFixed(1)}万元，方式：${type === 'reduce-term' ? '缩短年限' : '减少月供'}`,
        beforeSummary: beforeSummary,
      };
      
      const newOps = [...operations, newOp];
      const { payments: newPlan, summary: newSummary } = replayPlan(loanInput, newOps);
      
      // 记录操作后的总结
      newOp.afterSummary = newSummary;
      
      setPayments(newPlan);
      setSummary(newSummary);
      setOperations(newOps);
      closeModal();
    } catch (err) {
      console.error('Prepay error:', err);
      setError('提前还款操作失败');
    }
  }, [loanInput, selectedPeriod, operations, summary, initialSummary, replayPlan, closeModal]);

  // 错误显示
  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong className="font-bold">错误：</strong>
            <span className="block sm:inline">{error}</span>
            <button 
              className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              onClick={() => {
                setError('');
                router.push('/');
              }}
            >
              返回首页
            </button>
          </div>
        </div>
      </main>
    );
  }

  // 加载中状态
  if (!loanInput || !summary) {
    return (
      <main className="min-h-screen bg-slate-50 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-slate-600">正在加载还款计划...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-[98vw] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                className="group flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                onClick={() => router.push('/')}
              >
                <svg className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>返回修改贷款信息</span>
              </button>
            </div>
            <div className="text-sm text-slate-500">
              房贷还款计算器 · 专业版
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[98vw] mx-auto px-4 py-8 space-y-8">
        {/* 还款总结面板 - 传递初始总结 */}
        <div className="w-full">
          <PaymentSummaryPanel 
            summary={summary} 
            paymentType={loanInput.paymentType} 
            principal={loanInput.principal}
            initialSummary={initialSummary} // 传递独立的初始总结
            operations={operations}
          />
        </div>
        
        {/* 还款明细表格 */}
        <div className="w-full">
          <PaymentScheduleTable
            payments={payments}
            onRateAdjustment={openModal.bind(null, 'rate')}
            onPaymentAdjustment={openModal.bind(null, 'payment')}
            onPrepayment={openModal.bind(null, 'prepay')}
          />
        </div>
        
        {/* 操作历史 */}
        {operations.length > 0 && (
          <div className="w-full">
            <OperationHistory
              operations={operations}
              onDeleteOperation={(operationId) => {
                try {
                  const newOps = operations.filter(op => op.id !== operationId);
                  if (loanInput) {
                    const { payments: newPlan, summary: newSummary } = replayPlan(loanInput, newOps);
                    setPayments(newPlan);
                    setSummary(newSummary);
                  }
                  setOperations(newOps);
                } catch (err) {
                  console.error('Delete operation error:', err);
                  setError('删除操作失败');
                }
              }}
              onRevertToOperation={(operationId) => {
                try {
                  const idx = operations.findIndex(op => op.id === operationId);
                  if (idx !== -1 && loanInput) {
                    const newOps = operations.slice(0, idx + 1);
                    const { payments: newPlan, summary: newSummary } = replayPlan(loanInput, newOps);
                    setPayments(newPlan);
                    setSummary(newSummary);
                    setOperations(newOps);
                  }
                } catch (err) {
                  console.error('Revert operation error:', err);
                  setError('回溯操作失败');
                }
              }}
            />
          </div>
        )}
      </main>
      
      {/* 模态框保持不变 */}
      {activeModal === 'rate' && selectedPeriod && modalData && (
        <RateAdjustmentModal
          isOpen={true}
          period={selectedPeriod}
          currentRate={modalData.currentRate}
          onConfirm={handleRateAdjust}
          onCancel={closeModal}
        />
      )}
      {activeModal === 'payment' && selectedPeriod && modalData && (
        <PaymentAdjustmentModal
          isOpen={true}
          period={selectedPeriod}
          originalPayment={modalData.originalPayment}
          minPayment={modalData.minPayment}
          onConfirm={handlePaymentAdjust}
          onCancel={closeModal}
        />
      )}
      {activeModal === 'prepay' && selectedPeriod && modalData && (
        <PrepaymentModal
          isOpen={true}
          period={selectedPeriod}
          remainingBalance={modalData.remainingBalance}
          onConfirm={handlePrepay}
          onCancel={closeModal}
        />
      )}
    </div>
  );
} 