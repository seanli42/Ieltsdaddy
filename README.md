# Damov English (雅思爹)

IELTS 综合学习平台，支持精听、跟读、阅读、写作四大模块，提供 Android App。

## 功能

- **听力精听**：LRC 逐句同步、断句播放、单句/全文循环、倍速播放（0.75x/1x/1.25x）
- **跟读训练**：慢速跟读版音频，间隔停顿辅助模仿发音
- **阅读与写作**：配套真题文本，支持标注与收藏
- **句子收藏**：收藏句子独立播放，支持循环模式
- **后台播放**：锁屏/后台持续播放，支持耳机控制
- **跨平台**：Web + Android APK

## 技术栈

| 层面 | 技术 |
|------|------|
| 前端 | Vanilla JS + Vite 6 |
| 移动端 | Capacitor 8 (Android) |
| 音频 | 腾讯云 COS 远程加载 |
| 音频处理 | Whisper (base/small) + word_timestamps |

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式（Web）
npm run dev

# 构建
npm run build

# 构建 Android APK
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

## 音频架构

所有音频文件托管在腾讯云 COS，前端通过 `AUDIO_BASE_URL` 动态加载，APK 仅 4 MB。构建时自动排除本地音频目录。

## 版本

详见 [VERSION.md](./VERSION.md)

## License

Private