# 开发日志

## 2024-11-16

1. 初始功能实现
   - 创建基本UI界面
   - 实现URL输入和当前页面URL获取
   - 实现资源下载功能

2. 问题修复
   - 问题：background.js中无法使用DOMParser
   - 原因：Service Worker环境限制，无法访问DOM API
   - 解决：将HTML解析逻辑移至popup.js中执行

3. 问题修复
   - 问题：URL.createObjectURL报错
   - 原因：Service Worker不支持该API
   - 解决：使用data URL替代Blob URL

4. 问题修复
   - 问题：下载时报错"Invalid filename"
   - 原因：URL生成的文件名包含非法字符
   - 解决：添加sanitizeFilename函数处理文件名

5. 功能优化
   - 新增：下载失败自动重试机制
   - 描述：资源下载失败时最多重试3次，每次间隔1秒
   - 实现：添加retryDownload函数封装重试逻辑

## 2024-11-16

1. 问题修复
   - 问题：报错"Too many listeners"和"Unexpected determineFilename call"
   - 原因：下载监听器处理逻辑有误
   - 解决：重构下载逻辑，移除监听器使用，改用downloads.search

2. 新增功能
   - 新增：解析网页内容
   - 描述：解析网页内容，提取文本、图片、元信息等
   - 实现：添加parseHtmlContent函数，调用后端API解析网页内容
