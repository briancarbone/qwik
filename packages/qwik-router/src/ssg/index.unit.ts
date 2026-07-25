import { afterEach, describe, expect, it, vi } from 'vitest';

describe('startWorker', () => {
  afterEach(() => {
    vi.doUnmock('node:worker_threads');
    vi.doUnmock('./system');
    vi.doUnmock('./worker-thread');
    vi.resetModules();
  });

  it('forwards the client manifest so loader data files carry the build hash', async () => {
    const createSystem = vi.fn(async (opts: any) => ({ getOptions: () => opts }));
    vi.doMock('node:worker_threads', () => ({ workerData: { outDir: '/out' } }));
    vi.doMock('./system', () => ({ createSystem }));
    vi.doMock('./worker-thread', () => ({ workerThread: vi.fn(async () => {}) }));
    vi.resetModules();

    const { startWorker } = await import('./index');
    const manifest = { manifestHash: 'abc123' } as any;

    await startWorker({
      render: (() => null) as any,
      qwikRouterConfig: {} as any,
      manifest,
    });

    expect(createSystem).toHaveBeenCalledWith(expect.objectContaining({ manifest }), undefined);
  });
});
