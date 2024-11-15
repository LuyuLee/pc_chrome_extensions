chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startDownload') {
    downloadPageContent(message.url, message.html, message.resources)
      .then(() => sendResponse({}))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});

// 清理文件名，移除非法字符
function sanitizeFilename(filename) {
  // 移除或替换不允许的字符
  return filename
    .replace(/[/?<>\\:*|"]/g, '_')  // 替换Windows不允许的字符
    .replace(/\s+/g, '_')           // 替换空格
    .replace(/[^a-zA-Z0-9._-]/g, '_') // 只保留字母、数字和一些安全的符号
    .substring(0, 240);             // 限制文件名长度
}

async function downloadPageContent(url, html, resources) {
  try {
    // 从URL中提取文件名并清理
    let defaultFilename = url.split('/').pop() || 'index';
    defaultFilename = sanitizeFilename(defaultFilename);
    if (!defaultFilename.endsWith('.html')) {
      defaultFilename += '.html';
    }
    
    // 使用 data URL
    const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
    const downloadId = await chrome.downloads.download({
      url: dataUrl,
      filename: defaultFilename,
      saveAs: true
    });

    chrome.downloads.onDeterminingFilename.addListener(async function listener(item, suggest) {
      if (item.id === downloadId) {
        const directory = item.filename.substring(0, item.filename.lastIndexOf('/'));
        chrome.downloads.onDeterminingFilename.removeListener(listener);

        // 下载所有资源
        await downloadResources(resources, directory);
      }
    });
  } catch (error) {
    console.error('下载失败:', error);
    throw error;
  }
}

async function downloadResources(resources, directory) {
  // 下载CSS文件
  for (const cssUrl of resources.css) {
    try {
      const filename = sanitizeFilename(cssUrl.split('/').pop());
      await chrome.downloads.download({
        url: cssUrl,
        filename: `${directory}/css/${filename}`,
        conflictAction: 'uniquify'
      });
    } catch (error) {
      console.warn('CSS下载失败:', error);
    }
  }

  // 下载JavaScript文件
  for (const jsUrl of resources.js) {
    try {
      const filename = sanitizeFilename(jsUrl.split('/').pop());
      await chrome.downloads.download({
        url: jsUrl,
        filename: `${directory}/js/${filename}`,
        conflictAction: 'uniquify'
      });
    } catch (error) {
      console.warn('JavaScript下载失败:', error);
    }
  }

  // 下载图片
  for (const imgUrl of resources.images) {
    try {
      const filename = sanitizeFilename(imgUrl.split('/').pop());
      await chrome.downloads.download({
        url: imgUrl,
        filename: `${directory}/images/${filename}`,
        conflictAction: 'uniquify'
      });
    } catch (error) {
      console.warn('图片下载失败:', error);
    }
  }
} 