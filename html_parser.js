function cleanText(text) {
  // 移除空格并将连续换行符替换为单个换行符
  return text.replace(/\s+/g, '').replace(/\n+/g, '\n');
}

function parseHtmlToJson(html) {
  // 创建DOM解析器
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  let contentText = '';
  const imageLinks = {};
  let imageCount = 1;
  
  // 获取meta信息
  const metaInfo = {
    original_tag: '',
    publisher_name: '',
    publisher_description: '',
    publish_time: '',
    publish_location: ''
  };
  
  // 遍历所有元素
  function traverseNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      if (text) {
        contentText += text + '\n';
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.tagName === 'IMG') {
        const src = node.getAttribute('src') || node.getAttribute('data-src');
        if (src && src !== 'None') {
          const placeholder = `{{image${imageCount}}}`;
          contentText += placeholder + '\n';
          imageLinks[`image${imageCount}`] = src;
          imageCount++;
        }
      }
      
      // 递归处理子节点
      node.childNodes.forEach(child => traverseNode(child));
    }
  }
  
  // 开始遍历文档
  traverseNode(doc.body);
  
  // 清理文本内容
  contentText = cleanText(contentText);
  
  // 提取meta信息
  const spans = doc.getElementsByTagName('span');
  for (const span of spans) {
    if (span.textContent.includes('原创')) {
      metaInfo.original_tag = '原创';
      break;
    }
  }
  
  const publisher = doc.querySelector('strong[class*="account"]');
  if (publisher) {
    metaInfo.publisher_name = publisher.textContent.trim();
  }
  
  const description = doc.querySelector('span[class*="profile_meta_value"]');
  if (description) {
    metaInfo.publisher_description = description.textContent.trim();
  }
  
  const publishTime = doc.querySelector('em[id*="publish_time"]');
  if (publishTime) {
    metaInfo.publish_time = publishTime.textContent.trim();
  }
  
  const location = doc.querySelector('span[class*="location"]');
  if (location) {
    metaInfo.publish_location = location.textContent.trim();
  }
  
  // 返回JSON对象
  return {
    content_text: contentText,
    image_links: imageLinks,
    meta_info: metaInfo,
    page_url: doc.URL || ''
  };
} 