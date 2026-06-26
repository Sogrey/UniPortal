export const REDIRECT_URL_PARAM = 'redirect_url';
export const RETURN_TO_PARAM = 'return_to';

export function buildLoginUrl(redirectUrl?: string, returnTo?: string): string {
  const params: string[] = [];
  
  if (redirectUrl) {
    params.push(`${REDIRECT_URL_PARAM}=${encodeURIComponent(redirectUrl)}`);
  }
  
  if (returnTo) {
    params.push(`${RETURN_TO_PARAM}=${encodeURIComponent(returnTo)}`);
  }
  
  if (params.length === 0) {
    return '/auth/login';
  }
  
  return `/auth/login?${params.join('&')}`;
}

export function parseRedirectParams(): { redirectUrl?: string; returnTo?: string } {
  const searchParams = new URLSearchParams(window.location.search);
  const redirectUrl = searchParams.get(REDIRECT_URL_PARAM);
  const returnTo = searchParams.get(RETURN_TO_PARAM);
  
  return {
    redirectUrl: redirectUrl || undefined,
    returnTo: returnTo || undefined,
  };
}