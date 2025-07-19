import React, { useState } from 'react';
import { Operation } from '../types/loan';

interface OperationHistoryProps {
  operations: Operation[];
  onDeleteOperation: (operationId: string) => void;
  onRevertToOperation: (operationId: string) => void;
}

export const OperationHistory: React.FC<OperationHistoryProps> = ({
  operations,
  onDeleteOperation,
  onRevertToOperation,
}) => {
  const [expandedOperations, setExpandedOperations] = useState<Set<string>>(new Set());

  if (operations.length === 0) return null;

  // 切换展开/收起状态
  const toggleExpanded = (operationId: string) => {
    const newExpanded = new Set(expandedOperations);
    if (newExpanded.has(operationId)) {
      newExpanded.delete(operationId);
    } else {
      newExpanded.add(operationId);
    }
    setExpandedOperations(newExpanded);
  };

  // 计算影响值
  const calculateImpact = (before: any, after: any, field: string) => {
    if (!before || !after) return null;
    const diff = after[field] - before[field];
    return {
      value: Math.abs(diff),
      isPositive: diff > 0,
      percentage: before[field] !== 0 ? (diff / before[field]) * 100 : 0
    };
  };

  // 按时间顺序排序（从前往后）
  const sortedOperations = [...operations].sort((a, b) => {
    const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : 0;
    const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : 0;
    return timeA - timeB;
  });

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
      {/* 现代化头部 */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100/80 border-b border-slate-200/50 px-8 py-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            操作历史
          </h2>
          <div className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
            {operations.length} 次操作
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {sortedOperations.map((operation, index) => {
          const isExpanded = expandedOperations.has(operation.id);
          const hasImpactData = operation.beforeSummary && operation.afterSummary;
          
          return (
            <div
              key={operation.id}
              className="group bg-gradient-to-r from-white to-slate-50/50 rounded-xl border border-slate-200/50 p-6 hover:shadow-lg transition-all duration-300"
            >
              {/* 操作信息头部 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
                    operation.type === 'rate-adjustment' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                    operation.type === 'prepayment' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                    'bg-gradient-to-r from-purple-500 to-purple-600'
                  }`}>
                    {operation.type === 'rate-adjustment' && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    )}
                    {operation.type === 'prepayment' && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    )}
                    {operation.type === 'payment-adjustment' && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{operation.description}</h3>
                                        <p className="text-sm text-slate-500">
                      操作时间：{operation.timestamp ? operation.timestamp.toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                      }) : '未知时间'} · 第 {index + 1} 次操作
                    </p>
                    {operation.paymentDate && (
                      <p className="text-xs text-slate-400 mt-1">
                        还款日期：{operation.paymentDate instanceof Date ? operation.paymentDate.toLocaleDateString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        }) : '未知日期'} （第{operation.period}期）
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* 展开/收起按钮 */}
                  {hasImpactData && (
                    <button
                      className="px-3 py-1 text-xs bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors flex items-center space-x-1"
                      onClick={() => toggleExpanded(operation.id)}
                    >
                      <span>{isExpanded ? '收起详情' : '展开详情'}</span>
                      <svg 
                        className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                  
                  {/* 操作按钮 */}
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="px-3 py-1 text-xs bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200 transition-colors"
                      onClick={() => onRevertToOperation(operation.id)}
                    >
                      回溯到此
                    </button>
                    <button
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                      onClick={() => onDeleteOperation(operation.id)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>

              {/* 快速影响概览 */}
              {hasImpactData && !isExpanded && (
                <div className="flex items-center justify-center space-x-6 py-2 bg-slate-50/50 rounded-lg">
                  {(() => {
                    const totalPaymentImpact = calculateImpact(operation.beforeSummary, operation.afterSummary, 'totalPayment');
                    const totalInterestImpact = calculateImpact(operation.beforeSummary, operation.afterSummary, 'totalInterest');
                    const totalPeriodsImpact = calculateImpact(operation.beforeSummary, operation.afterSummary, 'totalPeriods');
                    
                    return (
                      <>
                        {totalPaymentImpact && (
                          <div className="text-center">
                            <div className="text-xs text-slate-500">总还款</div>
                            <div className={`text-sm font-bold ${totalPaymentImpact.isPositive ? 'text-red-600' : 'text-green-600'}`}>
                              {totalPaymentImpact.isPositive ? '+' : '-'}¥{(totalPaymentImpact.value/10000).toFixed(1)}万
                            </div>
                          </div>
                        )}
                        {totalInterestImpact && (
                          <div className="text-center">
                            <div className="text-xs text-slate-500">总利息</div>
                            <div className={`text-sm font-bold ${totalInterestImpact.isPositive ? 'text-red-600' : 'text-green-600'}`}>
                              {totalInterestImpact.isPositive ? '+' : '-'}¥{(totalInterestImpact.value/10000).toFixed(1)}万
                            </div>
                          </div>
                        )}
                        {totalPeriodsImpact && (
                          <div className="text-center">
                            <div className="text-xs text-slate-500">期数</div>
                            <div className={`text-sm font-bold ${totalPeriodsImpact.isPositive ? 'text-red-600' : 'text-green-600'}`}>
                              {totalPeriodsImpact.isPositive ? '+' : '-'}{Math.round(totalPeriodsImpact.value)}期
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* 详细操作影响对比（展开时显示） */}
              {hasImpactData && isExpanded && (
                <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-lg p-4 mt-4">
                  <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    操作影响详细对比
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* 总还款金额变化 */}
                    {(() => {
                      const impact = calculateImpact(operation.beforeSummary, operation.afterSummary, 'totalPayment');
                      if (!impact) return null;
                      return (
                        <div className="text-center p-3 bg-white rounded-lg border">
                          <div className="text-xs text-slate-500 mb-1">总还款金额变化</div>
                          <div className={`text-lg font-bold ${impact.isPositive ? 'text-red-600' : 'text-green-600'}`}>
                            {impact.isPositive ? '+' : '-'}¥{impact.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                          <div className={`text-xs ${impact.isPositive ? 'text-red-500' : 'text-green-500'}`}>
                            ({impact.isPositive ? '+' : ''}{impact.percentage.toFixed(2)}%)
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* 总利息变化 */}
                    {(() => {
                      const impact = calculateImpact(operation.beforeSummary, operation.afterSummary, 'totalInterest');
                      if (!impact) return null;
                      return (
                        <div className="text-center p-3 bg-white rounded-lg border">
                          <div className="text-xs text-slate-500 mb-1">总利息变化</div>
                          <div className={`text-lg font-bold ${impact.isPositive ? 'text-red-600' : 'text-green-600'}`}>
                            {impact.isPositive ? '+' : '-'}¥{impact.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                          <div className={`text-xs ${impact.isPositive ? 'text-red-500' : 'text-green-500'}`}>
                            ({impact.isPositive ? '+' : ''}{impact.percentage.toFixed(2)}%)
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* 总期数变化 */}
                    {(() => {
                      const impact = calculateImpact(operation.beforeSummary, operation.afterSummary, 'totalPeriods');
                      if (!impact) return null;
                      return (
                        <div className="text-center p-3 bg-white rounded-lg border">
                          <div className="text-xs text-slate-500 mb-1">还款期数变化</div>
                          <div className={`text-lg font-bold ${impact.isPositive ? 'text-red-600' : 'text-green-600'}`}>
                            {impact.isPositive ? '+' : '-'}{Math.round(impact.value)} 期
                          </div>
                          <div className={`text-xs ${impact.isPositive ? 'text-red-500' : 'text-green-500'}`}>
                            ({impact.isPositive ? '+' : ''}{impact.percentage.toFixed(1)}%)
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* 详细对比表格 */}
                  <div className="border-t border-slate-200 pt-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-2 text-slate-600">项目</th>
                            <th className="text-right py-2 text-slate-600">操作前</th>
                            <th className="text-right py-2 text-slate-600">操作后</th>
                            <th className="text-right py-2 text-slate-600">变化</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-100">
                            <td className="py-2 text-slate-700">总还款金额</td>
                            <td className="py-2 text-right">¥{operation.beforeSummary.totalPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className="py-2 text-right">¥{operation.afterSummary.totalPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className={`py-2 text-right font-medium ${
                              operation.afterSummary.totalPayment > operation.beforeSummary.totalPayment ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {operation.afterSummary.totalPayment > operation.beforeSummary.totalPayment ? '+' : ''}
                              ¥{(operation.afterSummary.totalPayment - operation.beforeSummary.totalPayment).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                          <tr className="border-b border-slate-100">
                            <td className="py-2 text-slate-700">总利息</td>
                            <td className="py-2 text-right">¥{operation.beforeSummary.totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className="py-2 text-right">¥{operation.afterSummary.totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className={`py-2 text-right font-medium ${
                              operation.afterSummary.totalInterest > operation.beforeSummary.totalInterest ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {operation.afterSummary.totalInterest > operation.beforeSummary.totalInterest ? '+' : ''}
                              ¥{(operation.afterSummary.totalInterest - operation.beforeSummary.totalInterest).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 text-slate-700">还款期数</td>
                            <td className="py-2 text-right">{operation.beforeSummary.totalPeriods} 期</td>
                            <td className="py-2 text-right">{operation.afterSummary.totalPeriods} 期</td>
                            <td className={`py-2 text-right font-medium ${
                              operation.afterSummary.totalPeriods > operation.beforeSummary.totalPeriods ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {operation.afterSummary.totalPeriods > operation.beforeSummary.totalPeriods ? '+' : ''}
                              {operation.afterSummary.totalPeriods - operation.beforeSummary.totalPeriods} 期
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}; 