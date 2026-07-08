// Port of crates-public/validation.go — request classification for the
// public SSR site's bot/attack filtering.

const VALID_USERNAME = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/;

const ATTACK_PATTERNS = [
  '.php', '.asp', '.aspx', '.jsp', '.cgi', '.pl', '.py', '.rb',
  '.html', '.htm', '.xml', '.json', '.txt', '.log', '.bak',
  'admin', 'administrator', 'root', 'test', 'guest', 'user',
  'wp-', 'wordpress', 'drupal', 'joomla', 'phpmyadmin',
  'config', 'backup', 'database', 'db', 'sql', 'ftp',
  'mail', 'email', 'webmail', 'cpanel', 'whm',
  'api', 'rest', 'graphql', 'swagger',
  'login', 'signin', 'auth', 'oauth', 'sso',
  'robots.txt', 'sitemap.xml', 'favicon.ico',
  '.', '..', '~', '@', '#', '$', '%', '^', '&', '*',
  '(', ')', '[', ']', '{', '}', '<', '>', '|', '\\', '/',
  "'", '"', '`', '=', '+', '?', '!', ';', ':',
];

const SUSPICIOUS_USER_AGENTS = [
  'bot', 'crawler', 'spider', 'scraper', 'scanner',
  'curl', 'wget', 'python', 'perl', 'ruby', 'php',
  'postman', 'insomnia', 'httpie',
  'nmap', 'masscan', 'zmap', 'sqlmap',
  'nikto', 'dirb', 'gobuster', 'dirbuster',
  'burp', 'owasp', 'zap',
];

export type RequestClassification = 'legitimate' | 'bot' | 'suspicious' | 'attack';

export function validateUsername(username: string): { valid: boolean; classification: RequestClassification } {
  if (username.length === 0) return { valid: false, classification: 'suspicious' };
  if (username.length > 64) return { valid: false, classification: 'suspicious' };
  const lower = username.toLowerCase();
  for (const pattern of ATTACK_PATTERNS) {
    if (lower.includes(pattern)) return { valid: false, classification: 'attack' };
  }
  if (!VALID_USERNAME.test(username)) return { valid: false, classification: 'suspicious' };
  return { valid: true, classification: 'legitimate' };
}

export function classifyUserAgent(userAgent: string): RequestClassification {
  if (!userAgent) return 'suspicious';
  const lower = userAgent.toLowerCase();
  for (const suspicious of SUSPICIOUS_USER_AGENTS) {
    if (lower.includes(suspicious)) return 'bot';
  }
  return 'legitimate';
}

export function classifyRequest(username: string, userAgent: string): RequestClassification {
  const { valid, classification } = validateUsername(username);
  if (!valid) return classification;
  return classifyUserAgent(userAgent);
}

/** Bots are tolerated (crawlers need the OG tags); attack/suspicious are blocked. */
export const shouldBlockRequest = (c: RequestClassification): boolean =>
  c === 'attack' || c === 'suspicious';
