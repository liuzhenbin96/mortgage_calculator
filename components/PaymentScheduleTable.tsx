import React, { useState } from 'react';
import { PaymentRecord } from '../types/loan';

interface PaymentScheduleTableProps {
  payments: PaymentRecord[];
  onRateAdjustment: (period: number) => void;
  onPaymentAdjustment: (period: number) => void;
  onPrepayment: (period: number) => void;
}

export const PaymentScheduleTable: React.FC<PaymentScheduleTableProps> = ({
  payments,
  onRateAdjustment,
  onPaymentAdjustment,
  onPrepayment,
}) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const totalPages = Math.ceil(payments.length / pageSize);
  const pagedPayments = payments.slice((page - 1) * pageSize, page * pageSize);

  // 计算本金占比
  const calculatePrincipalRatio = (principal: number, payment: number): number => {
    if (payment === 0) return 0;
    return (principal / payment) * 100;
  };



  return (
    <div className="w-full">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        {/* 现代化头部 */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100/80 border-b border-slate-200/50 px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                还款明细
              </h2>
            </div>
            

          </div>
        </div>
        
        {/* 高端表格设计 */}
        <div className="overflow-x-auto">
          <table className="w-full table-fixed" style={{ minWidth: '1400px' }}>
            <thead>
              <tr className="bg-gradient-to-r from-slate-100 to-slate-50">
                <th className="w-20 px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider border-r border-slate-200/50">期数</th>
                <th className="w-28 px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider border-r border-slate-200/50">还款日期</th>
                <th className="w-32 px-4 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider border-r border-slate-200/50">还款金额</th>
                <th className="w-32 px-4 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider border-r border-slate-200/50">本金</th>
                <th className="w-32 px-4 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider border-r border-slate-200/50">利息</th>
                <th className="w-24 px-4 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider border-r border-slate-200/50">本金占比</th>
                <th className="w-36 px-4 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider border-r border-slate-200/50">剩余本金</th>
                <th className="w-24 px-4 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider border-r border-slate-200/50">利率(%)</th>
                <th className="w-40 px-4 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50">
              {pagedPayments.map((p, index) => {
                const principalRatio = calculatePrincipalRatio(p.principal, p.payment);
                return (
                  <tr key={p.period} className={`group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 transition-all duration-200 ${
                    p.isAdjusted ? 'bg-gradient-to-r from-amber-50/50 to-orange-50/30' : 
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                  }`}>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-900 border-r border-slate-200/50">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold mr-3">
                          {p.period}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 border-r border-slate-200/50 font-mono">
                      {p.date.toISOString().slice(0, 10)}
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-slate-900 text-right border-r border-slate-200/50 font-mono">
                      ¥{p.payment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700 text-right border-r border-slate-200/50 font-mono">
                      ¥{p.principal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700 text-right border-r border-slate-200/50 font-mono">
                      ¥{p.interest.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4 text-sm text-right border-r border-slate-200/50">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        principalRatio >= 50 ? 'bg-green-100 text-green-800' : 
                        principalRatio >= 30 ? 'bg-blue-100 text-blue-800' : 
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {principalRatio.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700 text-right border-r border-slate-200/50 font-mono">
                      ¥{p.remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700 text-center border-r border-slate-200/50 font-mono">
                      {p.rate ? p.rate.toFixed(2) : '-'}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          className="inline-flex items-center px-2 py-1 border border-blue-300 rounded-md text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors duration-200"
                          onClick={() => onRateAdjustment(p.period)}
                        >
                          调整利率
                        </button>
                        <button 
                          className="inline-flex items-center px-2 py-1 border border-green-300 rounded-md text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors duration-200"
                          onClick={() => onPaymentAdjustment(p.period)}
                        >
                          调整月供
                        </button>
                        <button 
                          className="inline-flex items-center px-2 py-1 border border-red-300 rounded-md text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors duration-200"
                          onClick={() => onPrepayment(p.period)}
                        >
                          提前还款
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* 现代化分页控件 */}
        {totalPages > 1 && (
          <div className="bg-gradient-to-r from-slate-50 to-slate-100/80 border-t border-slate-200/50 px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* 左侧：分页信息 */}
              <div className="text-sm text-slate-600 font-medium">
                共 <span className="font-bold text-slate-900">{payments.length}</span> 条记录，
                第 <span className="font-bold text-slate-900">{page}</span> 页，
                共 <span className="font-bold text-slate-900">{totalPages}</span> 页
              </div>
              
              {/* 右侧：分页控制 */}
              <div className="flex items-center space-x-6">
                {/* 每页条数选择器 */}
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-slate-600 font-medium">每页</span>
                  <select
                    className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                    value={pageSize}
                    onChange={e => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                  >
                    {[10, 20, 50, 100].map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  <span className="text-slate-600 font-medium">条</span>
                </div>
                
                {/* 分页按钮 */}
                <div className="flex items-center space-x-2">
                  <button
                    className="flex items-center px-3 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    上一页
                  </button>
                  
                  {/* 页码按钮 */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else {
                        const start = Math.max(1, page - 3);
                        const end = Math.min(totalPages, start + 6);
                        pageNum = start + i;
                        if (pageNum > end) return null;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                            page === pageNum 
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                              : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'
                          }`}
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    {totalPages > 7 && page < totalPages - 3 && (
                      <>
                        <span className="px-2 text-slate-400">...</span>
                        <button
                          className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors duration-200"
                          onClick={() => setPage(totalPages)}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>
                  
                  <button
                    className="flex items-center px-3 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    下一页
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 