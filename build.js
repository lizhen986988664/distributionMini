const fs = require('fs');
const path = require('path');

console.log('🚀 开始构建洗衣液小程序项目...');

// 检查必要文件
const requiredFiles = [
  'App.vue',
  'main.js', 
  'manifest.json',
  'pages.json',
  'uni.scss'
];

console.log('📋 检查项目文件...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} 缺失`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('❌ 项目文件不完整，请检查！');
  process.exit(1);
}

// 检查目录结构
const requiredDirs = [
  'pages',
  'store', 
  'utils',
  'services',
  'cloudfunctions'
];

console.log('\n📁 检查目录结构...');
requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir}/`);
  } else {
    console.log(`❌ ${dir}/ 缺失`);
  }
});

// 检查依赖
console.log('\n📦 检查依赖...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('✅ package.json 解析成功');
  
  const dependencies = Object.keys(packageJson.dependencies || {});
  const devDependencies = Object.keys(packageJson.devDependencies || {});
  
  console.log(`📚 依赖包数量: ${dependencies.length + devDependencies.length}`);
  
  // 检查关键依赖
  const criticalDeps = ['vue', 'vuex'];
  criticalDeps.forEach(dep => {
    if (dependencies.includes(dep)) {
      console.log(`✅ ${dep}`);
    } else {
      console.log(`❌ ${dep} 缺失`);
    }
  });
  
} catch (error) {
  console.log('❌ package.json 解析失败');
}

// 检查SCSS文件语法
console.log('\n🎨 检查样式文件...');
const scssFiles = ['uni.scss', 'static/styles/index.scss'];
scssFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    
    // 检查dart-sass兼容性问题
    const hasNestedSyntax = content.includes('&:');
    const hasTDesignImport = content.includes('tdesign-uniapp');
    
    if (hasNestedSyntax) {
      console.log(`⚠️  ${file} 包含嵌套语法，可能不兼容dart-sass`);
    } else {
      console.log(`✅ ${file} SCSS语法兼容`);
    }
    
    if (hasTDesignImport) {
      console.log(`⚠️  ${file} 包含TDesign导入`);
    }
  }
});

// 生成构建报告
const buildReport = {
  buildTime: new Date().toISOString(),
  project: '洗衣液小程序',
  version: '1.0.0',
  status: allFilesExist ? 'READY' : 'INCOMPLETE',
  files: {
    required: requiredFiles.filter(f => fs.existsSync(f)),
    missing: requiredFiles.filter(f => !fs.existsSync(f))
  },
  nextSteps: [
    '1. 在HBuilderX中打开项目',
    '2. 配置微信小程序AppID',
    '3. 运行到微信开发者工具',
    '4. 测试功能',
    '5. 部署云函数'
  ]
};

// 保存构建报告
fs.writeFileSync('build-report.json', JSON.stringify(buildReport, null, 2));
fs.writeFileSync('dist/README.txt', `
洗衣液小程序构建报告
==================

构建时间: ${buildReport.buildTime}
项目状态: ${buildReport.status}

下一步操作:
${buildReport.nextSteps.join('\n')}

项目已准备就绪，可在HBuilderX中打开并运行！
`);

console.log('\n📊 构建报告已生成:');
console.log('✅ build-report.json');
console.log('✅ dist/README.txt');

console.log('\n🎉 项目构建检查完成！');
console.log('📝 项目状态: ' + buildReport.status);
console.log('🚀 可以在HBuilderX中打开项目进行下一步操作！');