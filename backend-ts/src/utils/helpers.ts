import { Request } from 'express';

export function queryString(req: Request, key: string, defaultValue?: string): string | undefined {
  const val = req.query[key];
  if (Array.isArray(val)) return val[0] as string | undefined;
  if (typeof val === 'string') return val;
  return defaultValue;
}

export function queryInt(req: Request, key: string, defaultValue: number): number {
  const val = queryString(req, key, String(defaultValue));
  const parsed = parseInt(val || String(defaultValue), 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export function paramId(req: Request): string {
  return req.params.id as string;
}

export function paramStr(req: Request, key: string): string {
  return req.params[key] as string;
}
