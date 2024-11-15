document.addEventListener('DOMContentLoaded', function() {
  const urlInput = document.getElementById('urlInput');
  const useCurrentUrlButton = document.getElementById('useCurrentUrl');
  const downloadButton = document.getElementById('downloadButton');
  const status = document.getElementById('status');

  // 获取当前标签页URL
  useCurrentUrlButton.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    urlInput.value = tab.url;
  });

  // 处理下载请求
  downloadButton.addEventListener('click', async () => {
    const url = urlInput.value.trim();

    if (!url) {
      alert('请填写网址');
      return;
    }

    downloadButton.disabled = true;
    status.textContent = '正在准备下载...';

    try {
      // 获取页面内容
      const response = await fetch(url);
      const html = await response.text();
      
      // 使用DOMParser解析HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // 收集所有资源URL
      const resources = {
        css: Array.from(doc.querySelectorAll('link[rel="stylesheet"]')).map(link => link.href),
        js: Array.from(doc.querySelectorAll('script[src]')).map(script => script.src),
        images: Array.from(doc.querySelectorAll('img')).map(img => img.src)
      };

      // 发送消息给background script
      chrome.runtime.sendMessage({
        action: 'startDownload',
        url: url,
        html: html,
        resources: resources
      }, (response) => {
        if (response.error) {
          status.textContent = '下载失败: ' + response.error;
        } else {
          status.textContent = '下载已开始';
        }
        downloadButton.disabled = false;
      });
    } catch (error) {
      status.textContent = '发生错误: ' + error.message;
      downloadButton.disabled = false;
    }
  });
}); 