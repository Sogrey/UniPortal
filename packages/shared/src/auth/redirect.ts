/**
 * 子系统重定向参数名
 * 用于登录成功后重定向回子系统（完整 URL）
 */
export const REDIRECT_URL_PARAM = 'redirect_url';

/**
 * 主门户重定向参数名
 * 用于登录成功后重定向回主门户（相对路径）
 */
export const RETURN_TO_PARAM = 'return_to';

/**
 * 构建登录页面 URL
 * 根据传入的参数生成包含重定向信息的登录 URL
 * 
 * @param {string} [redirectUrl] - 子系统重定向地址（完整 URL，可选）
 * @param {string} [returnTo] - 主门户重定向地址（相对路径，可选）
 * @returns {string} 完整的登录页面 URL
 * 
 * @example
 * // 子系统构建登录 URL
 * buildLoginUrl('http://127.0.0.1:3002/app-a/')
 * // 返回: '/auth/login?redirect_url=http%3A%2F%2F127.0.0.1%3A3002%2Fapp-a%2F'
 * 
 * @example
 * // 主门户构建登录 URL
 * buildLoginUrl(undefined, '/dashboard')
 * // 返回: '/auth/login?return_to=%2Fdashboard'
 */
const getAuthBasePath = (): string => {
  const repoName = (window as any).__VITE_REPO_NAME__ || '';
  const basePath = '/auth/';
  return repoName ? `/${repoName}${basePath}` : basePath;
};

export function buildLoginUrl(redirectUrl?: string, returnTo?: string): string {
  const authBase = getAuthBasePath();
  const params: string[] = [];
  
  if (redirectUrl) {
    params.push(`${REDIRECT_URL_PARAM}=${encodeURIComponent(redirectUrl)}`);
  }
  
  if (returnTo) {
    params.push(`${RETURN_TO_PARAM}=${encodeURIComponent(returnTo)}`);
  }
  
  if (params.length === 0) {
    return `${authBase}login`;
  }
  
  return `${authBase}login?${params.join('&')}`;
}

/**
 * 解析当前 URL 中的重定向参数
 * 从浏览器地址栏提取 redirect_url 和 return_to 参数
 * 
 * @returns {{ redirectUrl?: string; returnTo?: string }} 包含重定向参数的对象
 * 
 * @example
 * // URL: /auth/login?redirect_url=http%3A%2F%2F127.0.0.1%3A3002%2Fapp-a%2F
 * parseRedirectParams()
 * // 返回: { redirectUrl: 'http://127.0.0.1:3002/app-a/', returnTo: undefined }
 * 
 * @example
 * // URL: /auth/login?return_to=%2Fdashboard
 * parseRedirectParams()
 * // 返回: { redirectUrl: undefined, returnTo: '/dashboard' }
 */
export function parseRedirectParams(): { redirectUrl?: string; returnTo?: string } {
  const searchParams = new URLSearchParams(window.location.search);
  const redirectUrl = searchParams.get(REDIRECT_URL_PARAM);
  const returnTo = searchParams.get(RETURN_TO_PARAM);
  
  return {
    redirectUrl: redirectUrl || undefined,
    returnTo: returnTo || undefined,
  };
}

export function buildAppPath(appPath: string): string {
  const repoName = (window as any).__VITE_REPO_NAME__ || '';
  if (repoName) {
    return `/${repoName}${appPath}`;
  }
  return appPath;
}