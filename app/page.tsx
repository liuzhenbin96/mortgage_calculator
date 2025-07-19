'use client';
import { useRouter } from 'next/navigation';
import { LoanInputForm } from '../components/LoanInputForm';
import { LoanInput } from '../types/loan';

export default function HomePage() {
  const router = useRouter();
  
  // 获取初始值
  let initialValues: LoanInput | undefined = undefined;
  if (typeof window !== 'undefined') {
    const last = localStorage.getItem('lastLoanInput');
    if (last) {
      try {
        const parsed = JSON.parse(last);
        initialValues = {
          ...parsed,
          startDate: new Date(parsed.startDate), // 确保日期对象正确
        };
      } catch (err) {
        console.error('Failed to parse last loan input:', err);
      }
    }
  }

  const handleSubmit = (input: LoanInput) => {
    try {
      // 保存到 localStorage 作为历史记录
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastLoanInput', JSON.stringify(input));
        // 同时保存到 sessionStorage 供结果页面使用
        sessionStorage.setItem('loanInput', JSON.stringify(input));
      }
      
      // 跳转到结果页面
      router.push('/result');
    } catch (err) {
      console.error('Failed to save loan input:', err);
      alert('保存数据失败，请重试');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-lg p-8 animate-fadeIn">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-6 text-center">房贷还款计算器</h1>
        <LoanInputForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          onValidationError={(errors) => {
            // 可以在这里处理验证错误，比如显示全局错误提示
            console.log('Validation errors:', errors);
          }}
        />
      </div>
    </main>
  );
} 