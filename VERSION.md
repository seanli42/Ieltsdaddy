# 雅思爹版本记录

## v1.2.23 (2026-05-14)

### 架构大改：音频迁移至腾讯云 COS
- **APK 体积从 2.0 GB → 160 MB**（-92%）
- 全部 918 个音频文件（原始 + 跟读版）迁移至 COS
- 前端代码增加 `AUDIO_BASE_URL` 配置，音频从远程加载
- 以后更新音频只需上传 COS，无需重新构建 APK

### 修复
- **Listening Section 1 精准转录**: Word-Whisper 流程（base 模型 + word_timestamps + 宽松短句合并）
  - C16/C17/C18 共 11 个文件用流程2（base，高效模式）修复
  - C15 t3_audio1 用流程1（small，精准模式）修复
  - 全部 19 个 Section 1 文件使用宽松合并（≤2词、<1s）重新处理
- **句尾裁剪修复**: gap_ms=300→100，紧邻边界推后

## v1.2.21 (2026-05-12)

### 修复
- **光标同步**: 每 tick 从 currentTime 重算索引，解决光标滞后问题
- **后台播放**: 改用 audio timeupdate 事件 + setInterval 双重保障，锁屏/后台可持续推进
- **锁屏按键**: 设置 MediaSession playbackState，增强锁屏耳机响应
- **下一句按键**: 循环模式下 nextLrc 不再跳回当前句

### 优化
- **Listening Section1 短句合并**: C14-C18 共 20 个文件，短句(≤3词)向前合并到下一句，跟读版已重新生成
- **Writing 跟读版补全**: 25 个音频全部有(跟读版)条目

---

## v1.2.20 (2026-05-08)

### 新增功能
- **单句循环5次后自动下一句**: 新增 `🔂` 按钮
  - 每句自动循环5次，然后推进到下一句继续循环，贯穿全篇
  - 与普通 `🔁` 无限循环互斥，切换歌曲自动重置
  - 播放时显示 `1/5 🔂` 进度指示
  - 循环进度条显示在控制栏下方

### Writing 跟读版补全
- app.js 中Writing配置区块补全 16 个缺失的 `-sp` 条目
- Writing 所有 25 个音频现在都有对应的（跟读版）条目

### APK 体积优化
- 删除 `speaking\` 根目录重复文件（旧版脚本遗留）：-1.96 GB
- 删除 `_spaced_spaced_v2` 旧版文件：-2.85 GB
- 删除 `_spaced_v2` 旧版文件：-1.46 GB
- 删除无用 `demo_output`：-9 MB
- **总计优化：-6.3 GB，APK 从 8.3 GB 降至 2.2 GB**

### 修复优化
- **Reading & Writing LRC 修复**: 
  - Reading 断句问题率从 ~12% 降至 0%
  - 7 个长行文件使用 Whisper small 重转录
  - Writing 本身 0 问题（仅后处理合并）
  - 所有 `_spaced` 跟读版已重新生成

## v1.2.4 (2026-04-06)

### 新增功能
- **收藏页面后台播放**: 收藏句子播放时保持在收藏页面，不跳转
  - 添加 `stayOnPage` 参数控制页面跳转行为
  - 收藏页面的播放/循环按钮保持在当前页面

### 修复问题
- **页面滚动**: 全链路修复滚动问题
  - 更新 `html, body` 添加 `touch-action: pan-y pan-x`
  - 收藏页面改为 `.page-with-header` 结构
  - 统一所有页面的滚动区域样式

### 文件变更
- `src/app.js` - 添加 stayOnPage 参数，重构 favPage 结构
- `src/style.css` - 更新 body touch-action

---

## v1.2.3 (2026-04-06)

### 修复问题
- **页面滚动**: 重构列表页面布局，修复无法滑动的问题
  - 将头部(header + 分类标签)与内容区域分离
  - 内容区域独立滚动，头部保持固定
  - 添加 touch-action: pan-y 支持触控板/触摸屏
  - 更新 viewport meta 添加 viewport-fit=cover
- **单句循环**: 改进收藏句子播放逻辑
  - 等待LRC加载完成后再跳转，避免找不到句子
  - 优化循环模式开启时机，确保播放后正确启用

### 文件变更
- `index.html` - 更新 viewport meta
- `src/app.js` - 重构列表页面HTML结构，改进playFavSentence逻辑
- `src/style.css` - 添加 page-with-header 样式

---

## v1.2.2 (2026-04-06)

### 新增功能
- **单句循环播放**: 收藏句子支持一键循环播放
  - 播放器页面新增循环按钮 (➡️/🔁)
  - 收藏页面每个句子新增"🔁 循环"按钮
  - 点击后自动跳转到播放器并开启循环模式
  - 循环模式下，句子播放完毕自动重播
  - 再次点击循环按钮可关闭循环模式

### 修复问题
- **页面滚动**: 修复Listening等页面无法双指滑动的问题
  - 新增Listening.css样式文件
  - 为所有页面类添加overflow-y: auto和-webkit-overflow-scrolling: touch

### 文件变更
- `src/app.js` - 添加单句循环逻辑
- `src/style.css` - 添加循环按钮样式和Toast动画
- `src/pages/Listening.tsx` - 更新CSS导入路径
- `src/pages/Listening.css` - 新增（修复滚动问题）

### 备份文件
- `src/app.js.v1.2.1-backup.js`
- `src/pages/Listening.tsx.v1.2.1-backup.tsx`

---

## v1.2.1 (2026-04-05)

### 修复问题
- 修复音频文件路径不匹配问题
- 修复LRC歌词乱码问题

## v1.2 (2026-04-05)

### 初始版本
- 基础播放器功能
- 收藏句子功能
- 倍速播放 (0.75x/1x/1.25x)
