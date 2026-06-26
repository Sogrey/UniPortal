import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const REPO_NAME = process.env.REPO_NAME || '';
const DEPLOY_TARGET = process.env.DEPLOY_TARGET || path.join(rootDir, 'dist');
const APPS = ['auth-app', 'business-app-a', 'business-app-b'];

const DEPLOY_PATHS = {
  'auth-app': '/auth/',
  'business-app-a': '/app-a/',
  'business-app-b': '/app-b/',
};

function buildApp(appName) {
  const appDir = path.join(rootDir, 'apps', appName);
  console.log(`🔨 构建 ${appName}...`);
  
  try {
    execSync(`pnpm --filter ${appName} build --mode production`, { 
      cwd: rootDir, 
      stdio: 'inherit',
      env: {
        ...process.env,
        REPO_NAME
      }
    });
    console.log(`✅ ${appName} 构建完成`);
  } catch (error) {
    console.error(`❌ ${appName} 构建失败:`, error.message);
    process.exit(1);
  }
}

function copyToDist(appName) {
  const appDir = path.join(rootDir, 'apps', appName);
  const distDir = path.join(appDir, 'dist');
  const targetDir = path.join(DEPLOY_TARGET, DEPLOY_PATHS[appName].replace(/^\//, ''));

  if (!fs.existsSync(distDir)) {
    console.error(`❌ ${appName} 构建产物不存在`);
    return false;
  }

  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true });
  }

  fs.mkdirSync(targetDir, { recursive: true });

  console.log(`📦 复制 ${appName} -> ${targetDir}`);
  
  try {
    if (process.platform === 'win32') {
      execSync(`xcopy "${distDir}\\*" "${targetDir}" /E /H /Y /C`, { stdio: 'inherit' });
    } else {
      execSync(`cp -r ${distDir}/* ${targetDir}`, { stdio: 'inherit' });
    }
    console.log(`✅ ${appName} 复制完成`);
    return true;
  } catch (error) {
    console.error(`❌ ${appName} 复制失败:`, error.message);
    return false;
  }
}

const appArg = process.argv[2];
if (appArg && APPS.includes(appArg)) {
  buildApp(appArg);
  copyToDist(appArg);
} else {
  APPS.forEach(buildApp);
  APPS.forEach(copyToDist);
  console.log('\n🎉 所有应用部署完成！');
  console.log(`📁 部署目录: ${DEPLOY_TARGET}`);
}