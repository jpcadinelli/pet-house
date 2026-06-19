const { describe, expect, jest, test } = require('@jest/globals');

jest.mock('../src/features/sync/services/syncService', () => ({
  sincronizarDadosUsuario: jest.fn(),
}));

const { criarAutoSyncService } = require('../src/features/sync/services/autoSyncService');

function criarDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, reject, resolve };
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('autoSyncService', () => {
  test('ignora sync automático sem usuário local', async () => {
    const sincronizarDadosUsuario = jest.fn();
    const logger = { log: jest.fn() };
    const service = criarAutoSyncService({ sincronizarDadosUsuario, logger });

    const resultado = await service.executarSync({ motivo: 'app_open', contexto: {} });

    expect(resultado).toEqual({ skipped: true });
    expect(sincronizarDadosUsuario).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith(
      '[autoSync] Sync automático ignorado sem usuário local.',
      { motivo: 'app_open', error: undefined }
    );
  });

  test('não executa sincronizações simultâneas e processa a última pendente', async () => {
    const primeiraSync = criarDeferred();
    const sincronizarDadosUsuario = jest.fn()
      .mockImplementationOnce(() => primeiraSync.promise)
      .mockResolvedValueOnce({ enviados: 0 });
    const service = criarAutoSyncService({
      sincronizarDadosUsuario,
      logger: { log: jest.fn() },
      debounceMs: 0,
      cooldownMs: 0,
    });

    const syncAtual = service.executarSync({ motivo: 'pet_created', contexto: { idUsuario: '7' } });
    const syncConcorrente = await service.executarSync({ motivo: 'vaccine_created', contexto: { idUsuario: '7' } });

    expect(syncConcorrente).toEqual({ queued: true });
    expect(sincronizarDadosUsuario).toHaveBeenCalledTimes(1);

    primeiraSync.resolve({ enviados: 1 });
    await syncAtual;
    await flushPromises();

    expect(sincronizarDadosUsuario).toHaveBeenCalledTimes(2);
    expect(sincronizarDadosUsuario).toHaveBeenNthCalledWith(1, '7');
    expect(sincronizarDadosUsuario).toHaveBeenNthCalledWith(2, '7');
  });

  test('falha de sync automático é silenciosa e não rejeita a persistência local', async () => {
    const erro = new Error('offline');
    const logger = { log: jest.fn() };
    const sincronizarDadosUsuario = jest.fn().mockRejectedValueOnce(erro);
    const service = criarAutoSyncService({
      sincronizarDadosUsuario,
      logger,
      debounceMs: 0,
      cooldownMs: 0,
    });

    const resultado = await service.executarSync({ motivo: 'pet_updated', contexto: { idUsuario: '7' } });

    expect(resultado).toEqual({ error: erro });
    expect(logger.log).toHaveBeenCalledWith(
      '[autoSync] Falha silenciosa na sincronização automática.',
      { motivo: 'pet_updated', error: 'offline' }
    );
  });

  test('wrappers públicos disparam sync agendado sem alertas de erro', async () => {
    const sincronizarDadosUsuario = jest.fn().mockResolvedValue({ enviados: 0 });
    const service = criarAutoSyncService({
      sincronizarDadosUsuario,
      logger: { log: jest.fn() },
      setTimeout: (callback) => {
        callback();
        return 1;
      },
      clearTimeout: jest.fn(),
      debounceMs: 0,
      cooldownMs: 0,
    });

    service.sincronizarAoAbrirApp('7');
    await flushPromises();

    expect(sincronizarDadosUsuario).toHaveBeenCalledWith('7');
  });
});
