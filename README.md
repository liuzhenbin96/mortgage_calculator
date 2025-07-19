# 房贷还款计算器（Mortgage Calculator）

一个世界级设计的房贷还款模拟与管理工具，支持等额本息/等额本金、动态调整、历史与版本管理等。

## 功能特性
- 贷款信息输入与实时校验
- 等额本息/等额本金还款计划计算与展示
- 还款总结、详细计划表、动态调整（利率/月供/提前还款）
- 操作历史、版本管理与对比
- 数据本地持久化

- 响应式极简高端UI

## 技术栈
- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS 3


## 快速开始
```bash
npm install
npm run dev
```

## 构建与部署
```bash
npm run build
npm start
```

## 依赖安装
```bash
npm install tailwindcss postcss autoprefixer @tailwindcss/forms @tailwindcss/typography
```

## 目录结构
```
app/                # Next.js页面
components/         # 主要UI组件
context/            # 状态管理
lib/                # 计算引擎与工具
styles/             # TailwindCSS入口
```

## TailwindCSS 初始化
```bash
npx tailwindcss init -p
```

## 许可证
MIT 