# 网页内容下载器

一个Chrome扩展，用于下载网页及其相关资源（CSS、JavaScript、图片等）。

## 使用方法

1. 在Chrome浏览器中打开 chrome://extensions/
2. 开启右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"，选择本目录
4. 点击Chrome工具栏中的扩展图标
5. 输入要下载的网页URL，或点击"使用当前页面"按钮
6. 点击"选择下载位置并开始下载"按钮
7. 在弹出的Chrome下载对话框中选择保存位置
8. 扩展会自动下载HTML文件及相关资源到选择的目录中
## 项目结构
pc_chrome_extensions/
├── manifest.json     # 扩展配置文件
├── popup.html        # 弹出窗口界面
├── popup.js          # 弹出窗口逻辑
├── background.js     # 后台服务脚本
├── CHANGELOG.md      # 开发日志
└── images/
    └── icon.svg      # 扩展图标
## 待优化
1. 支持更多资源类型（字体、视频等）
2. 添加下载完成通知
3. 支持递归下载子页面
4. 解析功能目前获取的图片还有限，需要优化