/**
 * history.js
 * Permanent history per user using Supabase only.
 * No localStorage fallback for persisted history.
 */

const HistoryTracker = (() => {
  const TABLE = 'user_watch_history';

  function _getClient() {
    return window.supabaseClient || null;
  }

  async function _getUser() {
    const supa = _getClient();
    if (!supa) return null;
    try {
      const { data: { user } } = await supa.auth.getUser();
      return user || null;
    } catch {
      return null;
    }
  }

  function _cleanText(value, maxLen) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, maxLen);
  }

  function _cleanRoute(route) {
    const fallback = window.location.pathname.split('/').pop() || 'index.html';
    if (!route) return fallback;
    return String(route).split('?')[0].split('#')[0] || fallback;
  }

  function _serializePayload(entry) {
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) return entry;
    return {};
  }

  function _isPrimitive(value) {
    const t = typeof value;
    return t === 'string' || t === 'number' || t === 'boolean';
  }

  function _buildUrlWithResume(route, resumePayload) {
    const cleanRoute = _cleanRoute(route);
    const params = new URLSearchParams();
    params.set('h_resume', '1');
    params.set('h_route', cleanRoute);
    if (resumePayload.contentId) params.set('h_content_id', String(resumePayload.contentId));
    if (resumePayload.contentType) params.set('h_content_type', String(resumePayload.contentType));
    if (resumePayload.cartoonId) params.set('h_cartoon_id', String(resumePayload.cartoonId));
    if (resumePayload.animeId) params.set('h_anime_id', String(resumePayload.animeId));
    if (resumePayload.season !== undefined && resumePayload.season !== null && resumePayload.season !== '') {
      params.set('h_season', String(resumePayload.season));
    }
    if (resumePayload.audio) params.set('h_audio', String(resumePayload.audio));
    if (resumePayload.filmId) params.set('h_film_id', String(resumePayload.filmId));
    if (resumePayload.mediaType) params.set('h_media_type', String(resumePayload.mediaType));

    Object.entries(resumePayload).forEach(([key, value]) => {
      if ([
        'route',
        'contentId',
        'contentType',
        'cartoonId',
        'animeId',
        'season',
        'audio',
        'filmId',
        'mediaType'
      ].includes(key)) {
        return;
      }
      if (!_isPrimitive(value)) return;

      // Evita URLs gigantes ao abrir itens pelo histórico:
      // campos longos (ex.: descrições de IA) não são necessários para retomar.
      if (['description', 'analysis', 'rawResult', 'content'].includes(String(key))) return;
      const serialized = String(value);
      if (serialized.length > 180) return;

      params.set(`h_payload_${key}`, serialized);
    });

    return `${cleanRoute}?${params.toString()}`;
  }

  function _removeResumeParamsFromUrl() {
    try {
      const current = new URL(window.location.href);
      const cleanParams = new URLSearchParams(current.search);
      const keysToDelete = [];
      cleanParams.forEach((_, key) => {
        if (key.startsWith('h_')) keysToDelete.push(key);
      });
      keysToDelete.forEach(key => cleanParams.delete(key));

      const next = `${current.pathname}${cleanParams.toString() ? `?${cleanParams.toString()}` : ''}${current.hash || ''}`;
      window.history.replaceState({}, '', next);
    } catch {
      // ignore URL cleanup errors
    }
  }

  async function track(entry = {}) {
    const user = await _getUser();
    if (!user) return { ok: false, reason: 'no-user' };

    const incomingPayload = _serializePayload(entry.payload);
    const payload = {
      user_id: user.id,
      content_id: _cleanText(entry.contentId, 140),
      content_type: _cleanText(entry.contentType, 80),
      title: _cleanText(entry.title || 'Conteudo', 220),
      subtitle: _cleanText(entry.subtitle, 320) || null,
      cover_url: _cleanText(entry.coverUrl, 1000) || null,
      route: _cleanRoute(entry.route),
      payload: incomingPayload,
      last_watched_at: new Date().toISOString()
    };

    if (!payload.content_id || !payload.content_type || !payload.title) {
      return { ok: false, reason: 'invalid-payload' };
    }

    const supa = _getClient();
    if (!supa) return { ok: false, reason: 'no-client' };

    try {
      const { data: existing } = await supa
        .from(TABLE)
        .select('title, payload')
        .eq('user_id', user.id)
        .eq('content_id', payload.content_id)
        .eq('content_type', payload.content_type)
        .eq('route', payload.route)
        .maybeSingle();

      const existingPayload = existing?.payload && typeof existing.payload === 'object'
        ? existing.payload
        : {};
      const mergedPayload = { ...existingPayload, ...incomingPayload };

      const customTitleFromExisting = _cleanText(existingPayload.customTitle, 220);
      const customTitleFromIncoming = _cleanText(incomingPayload.customTitle, 220);
      const customTitle = customTitleFromIncoming || customTitleFromExisting;

      if (customTitle) {
        payload.title = customTitle;
        mergedPayload.customTitle = customTitle;
      }
      payload.payload = mergedPayload;

      const { data, error } = await supa
        .from(TABLE)
        .upsert(payload, { onConflict: 'user_id,content_id,content_type,route' })
        .select('id')
        .single();

      if (error) throw error;
      return { ok: true, id: data?.id || null, source: 'supabase' };
    } catch (err) {
      console.error('[HistoryTracker] Failed to persist history in Supabase:', err?.message || err);
      return { ok: false, reason: 'supabase-error', error: err };
    }
  }

  async function list(limit = 120) {
    const user = await _getUser();
    if (!user) return { items: [], source: 'none' };

    const supa = _getClient();
    if (!supa) return { items: [], source: 'no-client' };

    try {
      const { data, error } = await supa
        .from(TABLE)
        .select('*')
        .eq('user_id', user.id)
        .order('last_watched_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { items: data || [], source: 'supabase' };
    } catch (err) {
      console.error('[HistoryTracker] Could not load history from Supabase:', err?.message || err);
      return { items: [], source: 'error', error: err };
    }
  }

  async function remove(id) {
    const user = await _getUser();
    if (!user || !id) return false;

    const supa = _getClient();
    if (!supa) return false;

    try {
      const { error } = await supa
        .from(TABLE)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      return !error;
    } catch {
      return false;
    }
  }

  async function rename(id, newTitle) {
    const user = await _getUser();
    if (!user || !id) return false;

    const supa = _getClient();
    if (!supa) return false;

    const cleanTitle = _cleanText(newTitle, 220);
    if (!cleanTitle) return false;

    try {
      const { data: existing } = await supa
        .from(TABLE)
        .select('payload')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      const currentPayload = existing?.payload && typeof existing.payload === 'object'
        ? existing.payload
        : {};

      const { error } = await supa
        .from(TABLE)
        .update({
          title: cleanTitle,
          payload: { ...currentPayload, customTitle: cleanTitle }
        })
        .eq('id', id)
        .eq('user_id', user.id);
      return !error;
    } catch {
      return false;
    }
  }

  async function clearAll() {
    const user = await _getUser();
    if (!user) return false;

    const supa = _getClient();
    if (!supa) return false;

    try {
      const { error } = await supa
        .from(TABLE)
        .delete()
        .eq('user_id', user.id);
      return !error;
    } catch {
      return false;
    }
  }

  function queueResumeAndOpen(item) {
    if (!item) return;

    const payload = item.payload && typeof item.payload === 'object' && !Array.isArray(item.payload)
      ? item.payload
      : {};
    const resumePayload = {
      route: item.route || 'index.html',
      contentId: item.content_id,
      contentType: item.content_type,
      ...payload
    };

    window.location.href = _buildUrlWithResume(resumePayload.route, resumePayload);
  }

  function consumeResumeFromUrl(routeName) {
    let params;
    try {
      params = new URLSearchParams(window.location.search);
    } catch {
      return null;
    }

    if (params.get('h_resume') !== '1') return null;

    const expectedRoute = _cleanRoute(routeName || window.location.pathname.split('/').pop() || 'index.html');
    const paramRoute = _cleanRoute(params.get('h_route') || expectedRoute);
    if (paramRoute !== expectedRoute) return null;

    const resume = {
      route: paramRoute,
      contentId: params.get('h_content_id') || '',
      contentType: params.get('h_content_type') || '',
      cartoonId: params.get('h_cartoon_id') || '',
      animeId: params.get('h_anime_id') || '',
      season: params.get('h_season') || '',
      audio: params.get('h_audio') || '',
      filmId: params.get('h_film_id') || '',
      mediaType: params.get('h_media_type') || ''
    };

    params.forEach((value, key) => {
      if (!key.startsWith('h_payload_')) return;
      const payloadKey = key.slice('h_payload_'.length);
      if (!payloadKey) return;
      resume[payloadKey] = value;
    });

    _removeResumeParamsFromUrl();
    return resume;
  }

  return {
    track,
    list,
    remove,
    rename,
    clearAll,
    queueResumeAndOpen,
    consumeResumeFromUrl
  };
})();

window.HistoryTracker = HistoryTracker;
