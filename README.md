# 安心助手

轻量 Windows 桌面工具，用于安全可回滚地修改本机 GPU 显示名称、导入/应用 ICC 色彩配置，并对图片进行实时滤镜预览。

## 功能

- GPU 显示名称改写：枚举 `Win32_VideoController`，备份 `DeviceDesc` / `FriendlyName`，写入自定义显示名，并支持恢复。
- ICC / ICM 色彩配置：导入配置文件到 Windows 色彩目录，关联到指定显示器并设为默认配置，保留恢复记录。
- 图片预览：上传 `png/jpg/jpeg/webp/bmp`，实时调节亮度、对比度、伽马、饱和度和色温，支持原图对比和导出 PNG。
- 本地配置：设置与备份保存在 `%APPDATA%\LightQualityTool\settings.json`。

## 安全边界

本工具只做 Windows 展示名、系统色彩管理和本地图片预览。不包含游戏画面优势、反作弊绕过、隐藏敌方遮挡物、修改游戏资源或驱动伪装功能。

## 开发

```powershell
npm install
npm run dev
```

## 构建

```powershell
npm run build
npm run package
```

安装包输出目录为 `release/`。

## 权限

普通图片预览无需管理员权限。GPU 注册表写入、ICC 安装/应用和恢复会触发 UAC 管理员授权。
