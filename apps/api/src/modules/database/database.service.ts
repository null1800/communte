import { Injectable, ServiceUnavailableException } from '@nestjs/common';

/** Database gateway; transactional writes are implemented as PostgreSQL RPCs. */
@Injectable()
export class DatabaseService {
  private readonly url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  private readonly key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  private configured(): void {
    if (!this.url || !this.key) {
      throw new ServiceUnavailableException('Database is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    }
  }

  async select<T>(table: string, query = ''): Promise<T[]> {
    return this.request<T[]>(`/rest/v1/${table}?${query}`, 'GET');
  }

  async rpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
    return this.request<T>(`/rest/v1/rpc/${name}`, 'POST', body);
  }

  async insert<T>(table: string, body: Record<string, unknown>): Promise<T[]> {
    return this.request<T[]>(`/rest/v1/${table}`, 'POST', body, { Prefer: 'return=representation' });
  }

  async update<T>(table: string, query: string, body: Record<string, unknown>): Promise<T[]> {
    return this.request<T[]>(`/rest/v1/${table}?${query}`, 'PATCH', body, { Prefer: 'return=representation' });
  }

  private async request<T>(path: string, method: string, body?: Record<string, unknown>, extraHeaders?: Record<string, string>): Promise<T> {
    this.configured();
    const response = await fetch(`${this.url}${path}`, {
      method,
      headers: {
        apikey: this.key!,
        Authorization: `Bearer ${this.key!}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...extraHeaders,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) throw new Error(`Database request failed (${response.status}): ${await response.text()}`);
    const text = await response.text();
    return (text ? JSON.parse(text) : null) as T;
  }
}

