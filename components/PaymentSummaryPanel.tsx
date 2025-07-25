import React, { useRef, useState, useEffect } from 'react';
import { PaymentSummary, Operation } from '../types/loan';

interface PaymentSummaryPanelProps {
  summary: PaymentSummary;
  paymentType: string;
  principal: number;
  operations?: Operation[];
  initialSummary?: PaymentSummary; // 添加初始方案总结
}

export const PaymentSummaryPanel: React.FC<PaymentSummaryPanelProps> = ({ 
  summary, 
  paymentType, 
  principal,
  operations = [],
  initialSummary
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // 创建总结历史（包含初始状态和每次操作后的状态）
  const summaryHistory = [
    {
      id: 'initial',
      title: '初始方案',
      subtitle: '贷款初始状态',
      summary: initialSummary || summary, // 使用传入的初始总结
      isInitial: true,
      operationType: null,
      operationDetails: null,
      savings: null,
    }
  ];

  // 为每个影响还款的操作添加总结
  operations
    .filter(op => op.type === 'rate-adjustment' || op.type === 'prepayment')
    .forEach((op, index) => {
      const operationTitle = op.type === 'rate-adjustment' 
        ? '利率调整' 
        : '提前还款';
      
      const operationDetails = op.type === 'rate-adjustment'
        ? `第${op.period}期利率调整为${op.parameters.newRate}%`
        : op.parameters.type === 'reduce-term'
          ? `第${op.period}期提前还款${(op.parameters.amount / 10000).toFixed(1)}万元（缩短年限）`
          : `第${op.period}期提前还款${(op.parameters.amount / 10000).toFixed(1)}万元（减少月供）`;

      // 计算影响金额（与初始方案对比）
      const initialTotal = initialSummary?.totalPayment || summary.totalPayment;
      const currentTotal = op.afterSummary?.totalPayment || summary.totalPayment;
      const impact = currentTotal - initialTotal; // 正数表示增加支出，负数表示节省支出

      summaryHistory.push({
        id: `operation-${index}`,
        title: `方案${index + 1}：${operationTitle}`,
        subtitle: operationDetails,
        summary: op.afterSummary || summary,
        isInitial: false,
        operationType: op.type,
        operationDetails,
        savings: impact < 0 ? Math.abs(impact) : null, // 只有真正节省时才显示
      });
    });

  // 滚动检查函数
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      return () => container.removeEventListener('scroll', checkScroll);
    }
  }, [summaryHistory]);

  // 滚动函数
  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320; // 卡片宽度 + 间距
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const newScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* 标题栏 */}
      <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">还款总结对比</h2>
            <p className="text-gray-600">共 {summaryHistory.length} 个方案 · 滑动查看对比效果</p>
          </div>
          {summaryHistory.length > 1 && (
            <div className="flex gap-2">
              <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className={`p-2 rounded-lg transition-all ${
                  canScrollLeft
                    ? 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className={`p-2 rounded-lg transition-all ${
                  canScrollRight
                    ? 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 卡片滚动容器 */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-6 p-8 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {summaryHistory.map((item, index) => (
          <div
            key={item.id}
            className={`flex-shrink-0 w-80 rounded-xl p-6 border-2 transition-all ${
              item.isInitial
                ? 'bg-blue-50 border-blue-200'
                : 'bg-green-50 border-green-200'
            }`}
          >
            {/* 卡片标题 */}
            <div className="text-center mb-6">
              <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium mb-2 ${
                item.isInitial 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {item.isInitial ? '初始' : `方案 ${index}`}
              </div>
              <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.subtitle}</p>
            </div>

            {/* 贷款总金额 */}
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">贷款总金额</p>
                <p className="text-2xl font-bold text-blue-600">
                  ¥{principal.toLocaleString()}.00
                </p>
              </div>

              {/* 还款总金额 */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">还款总金额</p>
                <p className="text-xl font-bold text-gray-900">
                  ¥{(item.summary.totalPayment || 0).toLocaleString()}
                </p>
                {!item.isInitial && (
                  <p className={`text-sm font-medium ${
                    (item.summary.totalPayment || 0) < (initialSummary?.totalPayment || summary.totalPayment || 0)
                      ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(item.summary.totalPayment || 0) < (initialSummary?.totalPayment || summary.totalPayment || 0) ? '-' : '+'}
                    {(Math.abs((item.summary.totalPayment || 0) - (initialSummary?.totalPayment || summary.totalPayment || 0)) / 10000).toFixed(2)}万
                    ({(((item.summary.totalPayment || 0) - (initialSummary?.totalPayment || summary.totalPayment || 0)) / (initialSummary?.totalPayment || summary.totalPayment || 1) * 100).toFixed(2)}%)
                  </p>
                )}
              </div>

              {/* 利息总金额 */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">利息总金额</p>
                <p className="text-lg font-bold text-orange-600">
                  ¥{(item.summary.totalInterest || 0).toLocaleString()}
                </p>
                {!item.isInitial && (
                  <p className="text-sm text-green-600 font-medium">
                    -{((initialSummary?.totalInterest || summary.totalInterest || 0) - (item.summary.totalInterest || 0)).toLocaleString()}
                    ({(((initialSummary?.totalInterest || summary.totalInterest || 0) - (item.summary.totalInterest || 0)) / (initialSummary?.totalInterest || summary.totalInterest || 1) * 100).toFixed(2)}%)
                  </p>
                )}
              </div>

              {/* 还款期数 */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">还款期数</p>
                <p className="text-lg font-bold text-purple-600">
                  {item.summary.totalPeriods} 期
                </p>
                {!item.isInitial && (
                  <p className="text-sm text-green-600 font-medium">
                    -{(initialSummary?.totalPeriods || summary.totalPeriods) - item.summary.totalPeriods} 期 
                    ({(((initialSummary?.totalPeriods || summary.totalPeriods) - item.summary.totalPeriods) / (initialSummary?.totalPeriods || summary.totalPeriods) * 100).toFixed(1)}%)
                  </p>
                )}
              </div>

              {/* 每月还款 */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">每月还款</p>
                <p className="text-lg font-bold text-red-600">
                  ¥{item.summary.monthlyPayment?.toLocaleString() || '0'}
                </p>
                {!item.isInitial && item.summary.monthlyPayment && (
                  <p className="text-sm text-gray-600 font-medium">
                    {item.summary.monthlyPayment > (initialSummary?.monthlyPayment || summary.monthlyPayment || 0) ? '+' : ''}
                    {(item.summary.monthlyPayment - (initialSummary?.monthlyPayment || summary.monthlyPayment || 0)).toLocaleString()}
                    ({((item.summary.monthlyPayment - (initialSummary?.monthlyPayment || summary.monthlyPayment || 0)) / (initialSummary?.monthlyPayment || summary.monthlyPayment || 1) * 100).toFixed(2)}%)
                  </p>
                )}
              </div>

              {/* 影响提示 */}
              {!item.isInitial && (
                <div className={`border rounded-lg p-3 mt-4 ${
                  (item.summary.totalPayment || 0) < (initialSummary?.totalPayment || summary.totalPayment || 0)
                    ? 'bg-green-100 border-green-200'
                    : 'bg-blue-100 border-blue-200'
                }`}>
                  <p className={`text-center text-sm font-medium ${
                    (item.summary.totalPayment || 0) < (initialSummary?.totalPayment || summary.totalPayment || 0)
                      ? 'text-green-800'
                      : 'text-blue-800'
                  }`}>与初始方案对比</p>
                  <p className={`text-center text-lg font-bold ${
                    (item.summary.totalPayment || 0) < (initialSummary?.totalPayment || summary.totalPayment || 0)
                      ? 'text-green-600'
                      : 'text-blue-600'
                  }`}>
                    {(item.summary.totalPayment || 0) < (initialSummary?.totalPayment || summary.totalPayment || 0)
                      ? '节省支出'
                      : '总支出增加'}
                  </p>
                  <p className={`text-center text-xl font-bold ${
                    (item.summary.totalPayment || 0) < (initialSummary?.totalPayment || summary.totalPayment || 0)
                      ? 'text-green-600'
                      : 'text-blue-600'
                  }`}>
                    ¥{(Math.abs((item.summary.totalPayment || 0) - (initialSummary?.totalPayment || summary.totalPayment || 0)) / 10000).toFixed(1)}万
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 