import React, { useState } from 'react';

export interface RateAdjustmentModalProps {
  isOpen: boolean;
  period: number;
  currentRate: number;
  onConfirm: (newRate: number) => void;
  onCancel: () => void;
}

export const RateAdjustmentModal: React.FC<RateAdjustmentModalProps> = ({ isOpen, period, currentRate, onConfirm, onCancel }) => {
  const [rate, setRate] = useState(currentRate);
  const [error, setError] = useState('');
  if (!isOpen) return null;
  const handleConfirm = () => {
    if (isNaN(rate) || rate <= 0 || rate > 50) {
      setError('请输入0-50之间的有效利率');
      return;
    }
    onConfirm(rate);
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xs md:max-w-sm flex flex-col items-center relative">
        <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 text-2xl font-bold" onClick={onCancel} aria-label="关闭">×</button>
        <h3 className="font-bold text-lg text-slate-800 mb-4">第{period}期 - 调整利率</h3>
        <div className="w-full flex items-center mb-2">
          <input
            type="number"
            className="flex-1 rounded-lg border px-4 py-2 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            value={rate}
            min={0.01}
            max={50}
            step={0.01}
            onChange={e => setRate(Number(e.target.value))}
            placeholder="请输入新利率"
          />
          <span className="ml-2 text-lg text-slate-600">%</span>
        </div>
        {error && <div className="text-red-500 text-xs mb-2 w-full text-center">{error}</div>}
        <div className="flex gap-3 w-full mt-2">
          <button className="flex-1 py-2 rounded-lg bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 transition" onClick={onCancel}>取消</button>
          <button className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition" onClick={handleConfirm}>确定</button>
        </div>
      </div>
    </div>
  );
};

export interface PaymentAdjustmentModalProps {
  isOpen: boolean;
  period: number;
  originalPayment: number;
  minPayment: number;
  onConfirm: (newPayment: number) => void;
  onCancel: () => void;
}

export const PaymentAdjustmentModal: React.FC<PaymentAdjustmentModalProps> = ({ isOpen, period, originalPayment, minPayment, onConfirm, onCancel }) => {
  const [principal, setPrincipal] = useState(Number((originalPayment - minPayment).toFixed(2)));
  const [interest, setInterest] = useState(Number(minPayment.toFixed(2)));
  const [error, setError] = useState('');
  const payment = Number((principal + interest).toFixed(2));
  if (!isOpen) return null;
  const handleConfirm = () => {
    if (isNaN(principal) || principal < 0) {
      setError('本金必须为非负数');
      return;
    }
    if (isNaN(interest) || interest < 0) {
      setError('利息必须为非负数');
      return;
    }
    if (payment < minPayment) {
      setError(`还款金额不能小于当期应付利息（¥${minPayment.toFixed(2)}）`);
      return;
    }
    onConfirm(payment);
  };
  const handlePrincipalChange = (v: string) => {
    const val = Number(v);
    setPrincipal(isNaN(val) ? 0 : Number(val.toFixed(2)));
  };
  const handleInterestChange = (v: string) => {
    const val = Number(v);
    setInterest(isNaN(val) ? 0 : Number(val.toFixed(2)));
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xs md:max-w-sm flex flex-col items-center relative">
        <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 text-2xl font-bold" onClick={onCancel} aria-label="关闭">×</button>
        <h3 className="font-bold text-lg text-slate-800 mb-4">第{period}期 - 调整月供</h3>
        <div className="w-full flex flex-col gap-2 mb-2">
          <div className="flex items-center">
            <span className="w-14 text-slate-600 text-sm">本金</span>
            <input
              type="number"
              className="flex-1 rounded-lg border px-4 py-2 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              value={principal}
              min={0}
              step={0.01}
              onChange={e => handlePrincipalChange(e.target.value)}
              placeholder="请输入本金"
            />
            <span className="ml-2 text-slate-600">元</span>
          </div>
          <div className="flex items-center">
            <span className="w-14 text-slate-600 text-sm">利息</span>
            <input
              type="number"
              className="flex-1 rounded-lg border px-4 py-2 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              value={interest}
              min={0}
              step={0.01}
              onChange={e => handleInterestChange(e.target.value)}
              placeholder="请输入利息"
            />
            <span className="ml-2 text-slate-600">元</span>
          </div>
        </div>
        <div className="w-full text-center text-slate-700 text-base mb-2">当期还款月供：<span className="font-bold text-blue-600">{payment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 元</span></div>
        {error && <div className="text-red-500 text-xs mb-2 w-full text-center">{error}</div>}
        <div className="flex gap-3 w-full mt-2">
          <button className="flex-1 py-2 rounded-lg bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 transition" onClick={onCancel}>取消</button>
          <button className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition" onClick={handleConfirm}>确定</button>
        </div>
      </div>
    </div>
  );
};

export interface PrepaymentModalProps {
  isOpen: boolean;
  period: number;
  remainingBalance: number;
  onConfirm: (amount: number, type: 'reduce-term' | 'reduce-payment') => void;
  onCancel: () => void;
}

export const PrepaymentModal: React.FC<PrepaymentModalProps> = ({ isOpen, period, remainingBalance, onConfirm, onCancel }) => {
  const [amount, setAmount] = useState(0);
  const [type, setType] = useState<'reduce-term' | 'reduce-payment'>('reduce-term');
  const [error, setError] = useState('');
  if (!isOpen) return null;
  const handleConfirm = () => {
    if (isNaN(amount) || amount <= 0 || amount > remainingBalance) {
      setError(`金额需大于0且不超过剩余本金（¥${remainingBalance.toFixed(2)}）`);
      return;
    }
    onConfirm(amount, type);
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xs md:max-w-sm flex flex-col items-center relative">
        <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 text-2xl font-bold" onClick={onCancel} aria-label="关闭">×</button>
        <h3 className="font-bold text-lg text-slate-800 mb-4">第{period}期 - 提前还款</h3>
        <input
          type="number"
          className="w-full rounded-lg border px-4 py-2 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition mb-2"
          value={amount}
          min={0.01}
          max={remainingBalance}
          step={0.01}
          onChange={e => setAmount(Number(e.target.value))}
          placeholder="请输入提前还款金额"
        />
        <div className="mb-2 w-full flex justify-center gap-4">
          <label className="flex items-center gap-1 cursor-pointer">
            <input type="radio" checked={type === 'reduce-term'} onChange={() => setType('reduce-term')} />
            <span className="text-slate-600 text-sm">缩短年限</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input type="radio" checked={type === 'reduce-payment'} onChange={() => setType('reduce-payment')} />
            <span className="text-slate-600 text-sm">减少月供</span>
          </label>
        </div>
        {error && <div className="text-red-500 text-xs mb-2 w-full text-center">{error}</div>}
        <div className="flex gap-3 w-full mt-2">
          <button className="flex-1 py-2 rounded-lg bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 transition" onClick={onCancel}>取消</button>
          <button className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition" onClick={handleConfirm}>确定</button>
        </div>
      </div>
    </div>
  );
};

// 统一的操作模态框组件
interface OperationModalsProps {
  activeModal: 'rate' | 'payment' | 'prepay' | null;
  selectedPeriod: number | null;
  modalData: any;
  onRateAdjust: (newRate: number) => void;
  onPaymentAdjust: (newPayment: number) => void;
  onPrepay: (amount: number, type: 'reduce-term' | 'reduce-payment') => void;
  onCancel: () => void;
}

export const OperationModals: React.FC<OperationModalsProps> = ({
  activeModal,
  selectedPeriod,
  modalData,
  onRateAdjust,
  onPaymentAdjust,
  onPrepay,
  onCancel,
}) => {
  if (!activeModal || !selectedPeriod || !modalData) return null;

  return (
    <>
      {activeModal === 'rate' && (
        <RateAdjustmentModal
          isOpen={true}
          period={selectedPeriod}
          currentRate={modalData.currentRate}
          onConfirm={onRateAdjust}
          onCancel={onCancel}
        />
      )}
      {activeModal === 'payment' && (
        <PaymentAdjustmentModal
          isOpen={true}
          period={selectedPeriod}
          originalPayment={modalData.originalPayment}
          minPayment={modalData.minPayment}
          onConfirm={onPaymentAdjust}
          onCancel={onCancel}
        />
      )}
      {activeModal === 'prepay' && (
        <PrepaymentModal
          isOpen={true}
          period={selectedPeriod}
          remainingBalance={modalData.remainingBalance}
          onConfirm={onPrepay}
          onCancel={onCancel}
        />
      )}
    </>
  );
};