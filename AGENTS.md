# Repository Guidelines

## 项目结构与模块组织
- 前端源码位于 `src`：`background`（Service Worker 逻辑）、`content`（内容脚本注入）、`popup` 与 `options`（React UI 入口）、`shared`（共享状态与工具）、`lib`（通用逻辑）、`styles`（样式）。  
- 测试集中在 `src/__tests__`，遵循与源码同级的模块划分。  
- `public` 放置静态资源，`dist` 为构建产物（自动生成无需提交）。  
- `docs` 存放补充说明文档，浏览器清单由 `src/manifest.ts` 生成。

## 构建、测试与本地开发命令
- `npm run dev`：启动 Vite 开发服务并监听 popup/options/content。  
- `npm run build`：先类型检查再执行 Vite 生产构建，产出 Chrome 扩展包。  
- `npm run preview`：在本地以生产包预览。  
- `npm run lint` / `npm run lint:fix`：使用 ESLint（TS/React/Hooks 规则）检查或自动修复。  
- `npm run format` / `npm run format:check`：Prettier 统一代码风格。  
- `npm run typecheck`：仅做 TypeScript 类型检查。  
- `npm run test` / `npm run test:watch`：使用 Vitest（jsdom 环境）运行或监听测试。

## 代码风格与命名约定
- 使用 TypeScript + React 18 + Vite + Tailwind；遵循 Prettier 默认格式（2 空格缩进、分号、双引号）。  
- 组件/页面文件采用帕斯卡命名（如 `CheckListPanel.tsx`），通用工具与 hooks 采用小驼峰（如 `useDailyCheckStore.ts`）。  
- Zustand 状态建议命名为 `useXStore`，跨模块共享方法放入 `shared` 或 `lib`。  
- 样式优先使用 Tailwind 原子类；需自定义样式时放入 `styles` 并按模块拆分。

## 测试规范
- 单元测试使用 Vitest，文件命名 `*.test.ts` 或 `*.test.tsx`，与被测模块保持平行目录。  
- 覆盖核心路径：消息通道、数据存储、UI 主要交互；新增特性需补充正反用例。  
- 提交前至少运行 `npm run lint` 与 `npm run test`，避免引入回归。

## 提交与 Pull Request
- Git 历史沿用类 Conventional Commits（如 `feat: ...`、`fix(scope): ...`），建议按功能拆分提交并保持英文动词开头。  
- PR 需包含：变更概要、动机/关联 Issue、测试结果（命令与结论）、UI 变更的截图或录屏。  
- 在发起 PR 前确保构建、lint、测试均通过，避免提交 `dist` 与临时调试文件。  
- 涉及浏览器权限或清单变更时，说明原因与影响范围，必要时附兼容性验证。

## 配置与安全提示
- 运行时需 Node.js ≥ 18；若接入新站点接口，避免在前端暴露敏感密钥。  
- 调整 `manifest.ts` 权限或主机匹配规则时，遵循最小权限原则，先在开发模式下验证再提交。
