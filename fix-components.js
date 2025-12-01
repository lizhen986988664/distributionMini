const fs = require('fs');
const path = require('path');

console.log('🔧 开始修复TDesign组件引用...');

// 页面目录
const pagesDir = path.join(__dirname, 'pages');

// 组件替换映射
const componentReplacements = [
  { 
    search: /<t-button([^>]*)>/g, 
    replace: '<button$1>' 
  },
  { 
    search: /<\/t-button>/g, 
    replace: '</button>' 
  },
  { 
    search: /<t-input([^>]*)>/g, 
    replace: '<input$1 class="input">' 
  },
  { 
    search: /<\/t-input>/g, 
    replace: '</input>' 
  },
  { 
    search: /<t-textarea([^>]*)>/g, 
    replace: '<textarea$1 class="textarea">' 
  },
  { 
    search: /<\/t-textarea>/g, 
    replace: '</textarea>' 
  },
  { 
    search: /<t-loading([^>]*?)>/g, 
    replace: '<view class="loading"' + (arguments[1] || '') + '>' 
  },
  { 
    search: /<\/t-loading>/g, 
    replace: '</view>' 
  }
];

// 遍历所有页面目录
const pageDirs = fs.readdirSync(pagesDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

let totalFilesFixed = 0;

pageDirs.forEach(pageDir => {
  const pagePath = path.join(pagesDir, pageDir);
  const vueFiles = fs.readdirSync(pagePath).filter(file => file.endsWith('.vue'));
  
  vueFiles.forEach(vueFile => {
    const filePath = path.join(pagePath, vueFile);
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // 应用所有替换规则
    componentReplacements.forEach(({ search, replace }) => {
      content = content.replace(search, replace);
    });
    
    // 修复特定的属性
    content = content.replace(/size="large"/g, 'size="default"');
    content = content.replace(/size="small"/g, 'size="mini"');
    content = content.replace(/type="text"/g, 'type="default"');
    
    // 只有内容发生变化时才写入文件
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ 已修复: ${pageDir}/${vueFile}`);
      totalFilesFixed++;
    }
  });
});

// 修复样式文件中的TDesign样式引用
const styleReplacements = [
  { search: /\.t-button/g, replace: '.button' },
  { search: /\.t-input/g, replace: '.input' },
  { search: /\.t-textarea/g, replace: '.textarea' },
];

pageDirs.forEach(pageDir => {
  const pagePath = path.join(pagesDir, pageDir);
  const vueFiles = fs.readdirSync(pagePath).filter(file => file.endsWith('.vue'));
  
  vueFiles.forEach(vueFile => {
    const filePath = path.join(pagePath, vueFile);
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // 修复样式中的TDesign类名
    styleReplacements.forEach(({ search, replace }) => {
      content = content.replace(search, replace);
    });
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`🎨 已修复样式: ${pageDir}/${vueFile}`);
    }
  });
});

console.log(`\n🎉 组件修复完成！`);
console.log(`📊 总共修复了 ${totalFilesFixed} 个文件`);
console.log(`\n✨ 主要修复内容:`);
console.log(`   - t-button -> button`);
console.log(`   - t-input -> input`); 
console.log(`   - t-textarea -> textarea`);
console.log(`   - t-loading -> view.loading`);
console.log(`   - size="large" -> size="default"`);
console.log(`   - size="small" -> size="mini"`);

console.log(`\n🚀 现在可以重新编译项目了！`);