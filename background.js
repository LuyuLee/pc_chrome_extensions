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

// 简单的下载函数
async function simpleDownload(url, filename) {
  return new Promise((resolve, reject) => {
    chrome.downloads.download({
      url: url,
      filename: filename,
      conflictAction: 'uniquify'
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(downloadId);
      }
    });
  });
}

async function downloadPageContent(url, html, resources) {
  try {
    let defaultFilename = url.split('/').pop() || 'index';
    defaultFilename = sanitizeFilename(defaultFilename);
    if (!defaultFilename.endsWith('.html')) {
      defaultFilename += '.html';
    }
    
    const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
    
    // 先下载HTML文件
    const downloadId = await simpleDownload(dataUrl, defaultFilename);
    
    // 获取下载项信息
    const downloadItem = await new Promise((resolve) => {
      chrome.downloads.search({ id: downloadId }, ([item]) => {
        resolve(item);
      });
    });

    // 从下载项中获取目录路径
    const directory = downloadItem.filename.substring(0, downloadItem.filename.lastIndexOf('/'));
    
    // 下载其他资源
    await downloadResources(resources, directory);

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
      await simpleDownload(cssUrl, `${directory}/css/${filename}`);
    });
  }

  // 下载JavaScript文件
  for (const jsUrl of resources.js) {
    const filename = sanitizeFilename(jsUrl.split('/').pop());
    await retryDownload(async () => {
      await simpleDownload(jsUrl, `${directory}/js/${filename}`);
    });
  }

  // 下载图片
  for (const imgUrl of resources.images) {
    const filename = sanitizeFilename(imgUrl.split('/').pop());
    await retryDownload(async () => {
      await simpleDownload(imgUrl, `${directory}/images/${filename}`);
    });
  }
} 