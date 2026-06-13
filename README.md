# 安心助手 (Light Quality Tool)

<div align="center">
  <p><em>轻量级 Windows 桌面工具，用于 GPU 显示名称管理和色彩配置</em></p>
</div>

## ✨ 功能特性

### 🎮 GPU 显示名称管理
- **自动检测 NVIDIA 显卡**：通过 WMI 查询枚举系统中的 NVIDIA GPU 设备
- **安全备份机制**：在修改前自动备份原始设备描述信息（`DeviceDesc` / `FriendlyName`）
- **灵活的命名方式**：
  - 使用内置预设名称（根据笔记本/台式机自动推荐）
  - 或手动输入自定义显卡名称（最长 128 字符）
- **一键恢复**：随时恢复到原始设备名称
- **多显卡支持**：自动识别并管理多个 NVIDIA GPU

### 💾 本地配置管理
- 所有设置和备份保存在 `%APPDATA%\LightQualityTool\settings.json`
- 自动备份修改历史，防止数据丢失
- 持久化存储用户配置

## 🔒 安全边界与使用声明

> **重要提示：** 本工具仅用于合法的系统自定义和个人使用。

### 本工具的功能范围

**仅提供：**
- ✅ 修改 Windows 系统注册表中的 GPU 显示名称（`DeviceDesc` / `FriendlyName`）
- ✅ 本地配置文件的备份与恢复

**不包含：**
- ❌ 任何游戏画面优势或作弊功能
- ❌ 反作弊系统绕过或检测规避
- ❌ 隐藏、修改游戏中的视觉元素
- ❌ 修改游戏文件、资源或内存数据
- ❌ 驱动程序伪装、欺骗或篡改
- ❌ 硬件信息隐藏或虚拟化

### 使用场景

本工具适用于以下**合法场景**：
- 个性化系统显示名称，提升美观度
- 统一多设备命名规范，便于管理
- 学习 Windows 注册表操作和 Electron 开发

### 法律责任

- 用户需确保使用本工具符合当地法律法规
- 严禁将本工具用于违反游戏服务条款、破坏公平竞争的行为
- 因违规使用导致的账号封禁、法律责任等后果由用户自行承担

## 🚀 快速开始

### 环境要求

- **操作系统**: Windows 10/11
- **Node.js**: >= 16.x
- **包管理器**: pnpm (推荐) / npm / yarn

### 安装依赖

```powershell
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

### 开发模式

```powershell
# 启动开发服务器和 Electron
pnpm dev

# 或
npm run dev
```

开发服务器将运行在 `http://127.0.0.1:5173`

### 类型检查

```powershell
pnpm typecheck
```

### 构建应用

```powershell
# 构建生产版本
pnpm build

# 打包为 Windows 安装程序
pnpm package
```

安装包输出目录：`release/`

## 📦 技术栈

### 前端框架
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具和开发服务器
- **Tailwind CSS 4** - 样式框架

### UI 组件库
- **Radix UI** - 无障碍组件基础
- **Lucide React** - 图标库
- **shadcn/ui** - UI 组件设计系统

### 桌面应用
- **Electron 27** - 跨平台桌面应用框架
- **electron-builder** - 应用打包和分发

### 系统集成
- **PowerShell** - Windows 系统调用和 WMI 查询
- **WMI (Windows Management Instrumentation)** - 硬件信息查询（`Win32_VideoController`, `Win32_SystemEnclosure`, `Win32_Battery`）
- **Windows Registry API** - 注册表读写（`HKLM\SYSTEM\CurrentControlSet\Enum`）

## 🔑 权限说明

本应用需要**管理员权限**才能正常运行，因为修改 `HKLM\SYSTEM\CurrentControlSet\Enum` 下的注册表项需要提升权限。

### 权限需求详情

| 操作 | 需要管理员权限 | 说明 |
|------|---------------|------|
| 启动应用 | ✅ 是 | 应用启动时会自动请求 UAC 提升权限 |
| 枚举 GPU 设备 | ✅ 是 | 通过 WMI 查询 `Win32_VideoController` |
| 读取注册表 | ✅ 是 | 读取 GPU 设备的 `DeviceDesc` 和 `FriendlyName` |
| 修改 GPU 名称 | ✅ 是 | 写入注册表 `DeviceDesc` / `FriendlyName` |
| 恢复 GPU 名称 | ✅ 是 | 恢复备份的注册表值 |

### UAC 提示说明

- 首次启动时会弹出 Windows UAC 提示框
- 如果用户拒绝授权，应用将以受限模式运行（功能不可用）
- 授权后应用会以管理员权限重新启动

## 📁 项目结构

```
Light Quality Tool/
├── electron/              # Electron 主进程代码
│   ├── main/             # 主进程模块
│   │   ├── index.ts      # 主进程入口
│   │   ├── gpu.ts        # GPU 管理模块
│   │   ├── powershell.ts # PowerShell 执行器
│   │   └── store.ts      # 配置存储模块
│   ├── preload/          # 预加载脚本
│   └── shared/           # 共享类型定义
├── src/                  # React 前端代码
│   ├── assets/           # 静态资源
│   ├── components/       # React 组件
│   │   ├── panels/       # 功能面板组件
│   │   └── ui/           # 基础 UI 组件
│   ├── hooks/            # React Hooks
│   ├── lib/              # 工具函数和常量
│   ├── App.tsx           # 应用主组件
│   └── main.tsx          # React 入口
├── build/                # 构建资源
│   └── icon.ico          # 应用图标
├── dist/                 # Vite 构建输出
├── dist-electron/        # Electron 构建输出
├── release/              # 打包输出目录
└── package.json          # 项目配置
```

## 🛠️ 开发指南

### 核心技术架构

本项目采用 Electron 主进程/渲染进程分离架构：

- **主进程（`electron/main/`）**：负责系统调用、注册表操作、配置管理
- **渲染进程（`src/`）**：React 前端 UI，通过 IPC 与主进程通信
- **预加载脚本（`electron/preload/`）**：安全地暴露主进程 API 到渲染进程

### 添加新功能

1. **在主进程添加模块**（`electron/main/your-module.ts`）：
   ```typescript
   export async function yourFunction(): Promise<YourResult> {
     // 实现逻辑
   }
   ```

2. **注册 IPC 处理器**（`electron/main/index.ts`）：
   ```typescript
   handleIpc('your-channel:action', (_event, payload) => yourFunction(payload));
   ```

3. **在预加载脚本暴露 API**（`electron/preload/index.ts`）：
   ```typescript
   contextBridge.exposeInMainWorld('lightQuality', {
     yourApi: {
       action: (payload) => ipcRenderer.invoke('your-channel:action', payload)
     }
   });
   ```

4. **定义 TypeScript 类型**（`electron/shared/types.ts`）：
   ```typescript
   export interface YourPayload { /* ... */ }
   export interface YourResult { /* ... */ }
   ```

5. **在渲染进程调用**（`src/components/YourComponent.tsx`）：
   ```typescript
   const result = await window.lightQuality.yourApi.action(payload);
   ```

### 当前 API 列表

#### GPU 管理
- `window.lightQuality.gpu.listAdapters()` - 枚举 NVIDIA GPU 设备
- `window.lightQuality.gpu.setAdapterName({ adapter, customName })` - 修改 GPU 显示名称
- `window.lightQuality.gpu.restoreAdapterName({ backupId })` - 恢复原始名称

#### 配置管理
- `window.lightQuality.settings.get()` - 获取应用配置
- `window.lightQuality.settings.set(settings)` - 保存应用配置

#### 窗口控制
- `window.lightQuality.window.minimize()` - 最小化窗口
- `window.lightQuality.window.toggleMaximize()` - 切换最大化
- `window.lightQuality.window.close()` - 关闭窗口
- `window.lightQuality.window.isMaximized()` - 获取最大化状态

### PowerShell 脚本执行

主进程通过 `powershell.ts` 模块执行 PowerShell 脚本：

```typescript
import { runPowerShell, psString } from './powershell';

// 普通权限执行
const result = await runPowerShell('Get-Process');

// 管理员权限执行（会触发 UAC）
const result = await runPowerShell('Set-ItemProperty ...', true);

// 安全地转义字符串参数
const safePath = psString(userInput);
```

### 调试技巧

#### 开发者工具
- **渲染进程**：开发模式下自动打开 DevTools
- **主进程**：在终端查看 `console.log` 输出

#### 查看 IPC 通信
在渲染进程 DevTools Console 中：
```javascript
// 查看可用 API
console.log(window.lightQuality);
```

#### 热重载
- **前端代码**：Vite 自动热重载
- **Electron 主进程**：修改后需要重启应用（`Ctrl+C` 然后 `pnpm dev`）

#### 检查注册表修改
```powershell
# 查看 GPU 设备注册表项
reg query "HKLM\SYSTEM\CurrentControlSet\Enum\PCI\VEN_10DE*" /s
```

## ⚠️ 注意事项

1. **管理员权限**：应用启动时会自动请求管理员权限，这是修改系统注册表所必需的
2. **注册表操作**：所有注册表修改前都会自动备份，但仍建议手动创建系统还原点
3. **仅支持 NVIDIA 显卡**：当前版本仅检测和管理 NVIDIA GPU（VEN_10DE），不支持 AMD 或 Intel 显卡
4. **防病毒软件**：部分安全软件可能会拦截注册表写入操作，需要添加信任或临时关闭实时保护
5. **驱动更新影响**：GPU 名称修改后，某些 NVIDIA 驱动更新可能会重置为默认名称，需要重新应用
6. **需要重启生效**：修改或恢复后，需要重启计算机或重新扫描硬件才能在系统界面看到更新
7. **笔记本/台式机检测**：应用会自动检测设备类型（通过机箱类型和电池信息），并推荐相应的默认 GPU 名称

## 🐛 故障排除

### 应用无法启动
- **检查 Node.js 版本**：确保 >= 16.x
- **重新安装依赖**：删除 `node_modules` 和 `pnpm-lock.yaml`，重新执行 `pnpm install`
- **端口占用**：确保没有其他进程占用 5173 端口（开发模式）
- **管理员权限**：确保以管理员身份运行（右键 -> 以管理员身份运行）

### GPU 名称修改失败
- **UAC 授权**：确保在 UAC 提示时点击"是"授予管理员权限
- **检测不到显卡**：当前版本仅支持 NVIDIA 显卡，AMD/Intel 显卡无法检测
- **注册表路径错误**：检查应用日志，确认注册表路径格式正确
- **防病毒软件拦截**：暂时关闭实时保护或将应用添加到白名单

### 修改后系统显示未更新
- **重启计算机**：大多数情况下需要重启才能看到变化
- **刷新硬件**：在设备管理器中右键显卡 -> 扫描硬件改动
- **检查注册表**：使用 `regedit` 手动检查 `HKLM\SYSTEM\CurrentControlSet\Enum\<GPU PNP ID>` 下的 `DeviceDesc` 值

### 打包失败
- **检查图标文件**：确保 `build/icon.ico` 存在且格式正确
- **构建产物**：确保 `dist` 和 `dist-electron` 目录已通过 `pnpm build` 生成
- **electron-builder 错误**：查看终端输出的详细错误信息
- **磁盘空间**：确保有足够的磁盘空间用于打包（至少 500MB）

### 应用日志位置
- **开发模式**：日志输出在终端
- **生产模式**：配置文件位于 `%APPDATA%\LightQualityTool\settings.json`

## 📄 许可证

本项目仅供个人学习和研究使用。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

<div align="center">
  <sub>Built with ❤️ using React + Electron</sub>
</div>
