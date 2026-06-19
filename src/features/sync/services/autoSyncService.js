import { sincronizarDadosUsuario } from './syncService';

const DEFAULT_DEBOUNCE_MS = 750;
const DEFAULT_COOLDOWN_MS = 3000;

function criarLoggerPadrao() {
  return {
    log: (...args) => console.log(...args),
  };
}

export function criarAutoSyncService(deps = {}) {
  const sincronizarDadosUsuarioFn = deps.sincronizarDadosUsuario || sincronizarDadosUsuario;
  const logger = deps.logger || criarLoggerPadrao();
  const now = deps.now || Date.now;
  const setTimer = deps.setTimeout || setTimeout;
  const clearTimer = deps.clearTimeout || clearTimeout;
  const debounceMs = deps.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  const cooldownMs = deps.cooldownMs ?? DEFAULT_COOLDOWN_MS;

  let syncInProgress = false;
  let pendingRequest = null;
  let debounceTimer = null;
  let lastSyncAt = 0;
  let lastScheduledRequest = null;

  function logSkip(message, motivo, error) {
    const detail = error instanceof Error ? error.message : error;
    logger.log(`[autoSync] ${message}`, { motivo, error: detail });
  }

  function normalizarIdUsuario(contexto = {}) {
    const idUsuario = String(contexto.idUsuario || '').trim();
    return idUsuario || null;
  }

  async function executarSync(request, options = {}) {
    const idUsuario = normalizarIdUsuario(request.contexto);

    if (!idUsuario) {
      logSkip('Sync automático ignorado sem usuário local.', request.motivo);
      return { skipped: true };
    }

    if (syncInProgress) {
      pendingRequest = request;
      return { queued: true };
    }

    const tempoDesdeUltimoSync = now() - lastSyncAt;
    const esperaCooldown = options.ignoreCooldown
      ? 0
      : Math.max(0, cooldownMs - tempoDesdeUltimoSync);

    if (esperaCooldown > 0) {
      agendar(request, esperaCooldown);
      return { scheduled: true };
    }

    syncInProgress = true;

    try {
      const resultado = await sincronizarDadosUsuarioFn(idUsuario);
      lastSyncAt = now();
      return resultado;
    } catch (error) {
      logSkip('Falha silenciosa na sincronização automática.', request.motivo, error);
      return { error };
    } finally {
      syncInProgress = false;

      if (pendingRequest) {
        const nextRequest = pendingRequest;
        pendingRequest = null;
        void executarSync(nextRequest, { ignoreCooldown: true });
      }
    }
  }

  function agendar(request, delayMs) {
    lastScheduledRequest = request;

    if (debounceTimer) {
      clearTimer(debounceTimer);
    }

    debounceTimer = setTimer(() => {
      debounceTimer = null;
      const requestToRun = lastScheduledRequest;
      lastScheduledRequest = null;
      void executarSync(requestToRun);
    }, Math.max(0, delayMs));
  }

  function solicitarSyncAutomatico(motivo, contexto = {}) {
    const request = { motivo, contexto };
    const idUsuario = normalizarIdUsuario(contexto);

    if (!idUsuario) {
      logSkip('Sync automático ignorado sem usuário local.', motivo);
      return;
    }

    if (syncInProgress) {
      pendingRequest = request;
      return;
    }

    agendar(request, debounceMs);
  }

  function sincronizarAoAbrirApp(idUsuario) {
    solicitarSyncAutomatico('app_open', { idUsuario });
  }

  function sincronizarAoVoltarParaPrimeiroPlano(idUsuario) {
    solicitarSyncAutomatico('app_foreground', { idUsuario });
  }

  function sincronizarAposPersistencia(idUsuario, motivo) {
    solicitarSyncAutomatico(motivo, { idUsuario });
  }

  function getState() {
    return {
      syncInProgress,
      hasPendingRequest: Boolean(pendingRequest),
      hasDebounceTimer: Boolean(debounceTimer),
      lastSyncAt,
    };
  }

  return {
    getState,
    solicitarSyncAutomatico,
    sincronizarAoAbrirApp,
    sincronizarAoVoltarParaPrimeiroPlano,
    sincronizarAposPersistencia,
    executarSync,
  };
}

const defaultAutoSyncService = criarAutoSyncService();

export const solicitarSyncAutomatico = defaultAutoSyncService.solicitarSyncAutomatico;
export const sincronizarAoAbrirApp = defaultAutoSyncService.sincronizarAoAbrirApp;
export const sincronizarAoVoltarParaPrimeiroPlano = defaultAutoSyncService.sincronizarAoVoltarParaPrimeiroPlano;
export const sincronizarAposPersistencia = defaultAutoSyncService.sincronizarAposPersistencia;
