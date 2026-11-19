import { mkdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

mkdirSync(resolve(process.cwd(), 'data'), { recursive: true });
process.env.DATABASE_URL = 'file:data/test.sqlite';
delete process.env.DATABASE_AUTH_TOKEN;
process.env.BETTER_AUTH_SECRET ??= randomBytes(32).toString('base64');
process.env.BETTER_AUTH_URL ??= 'http://localhost:3100';

afterEach(() => cleanup());
