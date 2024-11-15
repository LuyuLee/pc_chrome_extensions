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
  return filename
    .replace(/[/?<>\\:*|"]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 240);
}

// 添加重试下载函数
async function retryDownload(downloadFunction, maxRetries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await downloadFunction();
    } catch (error) {
      lastError = error;
      console.warn(`下载失败，第 ${attempt} 次重试`, error);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  throw lastError;
}

async function downloadPageContent(url, html, resources) {
  try {
    let defaultFilename = url.split('/').pop() || 'index';
    defaultFilename = sanitizeFilename(defaultFilename);
    if (!defaultFilename.endsWith('.html')) {
      defaultFilename += '.html';
    }
    
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
    const filename = sanitizeFilename(cssUrl.split('/').pop());
    await retryDownload(async () => {
      await chrome.downloads.download({
        url: cssUrl,
        filename: `${directory}/css/${filename}`,
        conflictAction: 'uniquify'
      });
    });
  }

  // 下载JavaScript文件
  for (const jsUrl of resources.js) {
    const filename = sanitizeFilename(jsUrl.split('/').pop());
    await retryDownload(async () => {
      await chrome.downloads.download({
        url: jsUrl,
        filename: `${directory}/js/${filename}`,
        conflictAction: 'uniquify'
      });
    });
  }

  // 下载图片
  for (const imgUrl of resources.images) {
    const filename = sanitizeFilename(imgUrl.split('/').pop());
    await retryDownload(async () => {
      await chrome.downloads.download({
        url: imgUrl,
        filename: `${directory}/images/${filename}`,
        conflictAction: 'uniquify'
      });
    });
  }
} 