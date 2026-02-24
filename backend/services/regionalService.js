const axios = require('axios');

const BASE_URL =
  process.env.REGIONAL_API_BASE_URL ||
  'https://www.emsifa.com/api-wilayah-indonesia/api';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

// ─────────────────────────────────────────────────────────────────────────────
// In-memory TTL cache
// Key format: "provinces" | "regencies/{id}" | "districts/{id}" | "villages/{id}"
// TTL: 24 hours — wilayah data is essentially static
// This survives across requests in the same Node.js process instance (warm lambda).
// ─────────────────────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const cache = new Map(); // { key: { data: any, expiresAt: number } }

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers: fetch with 1 retry on timeout/network error
// ─────────────────────────────────────────────────────────────────────────────
async function fetchWithRetry(url) {
  try {
    const { data } = await client.get(url);
    return data;
  } catch (err) {
    if (err.code === 'ECONNABORTED' || err.code === 'ECONNRESET' || !err.response) {
      console.warn(`[regionalService] Retrying ${url} after error: ${err.code || err.message}`);
      const { data } = await client.get(url);
      return data;
    }
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ambil daftar provinsi
 * @returns {Promise<Array<{id:string, name:string}>>}
 */
async function getProvinces() {
  const key = 'provinces';
  const cached = getCached(key);
  if (cached) {
    console.log('[regionalService] cache HIT: provinces');
    return cached;
  }
  console.log('[regionalService] cache MISS: provinces — fetching Emsifa');
  const data = await fetchWithRetry('/provinces.json');
  setCache(key, data);
  return data;
}

/**
 * Ambil kabupaten/kota by id provinsi
 * @param {string} provinceId
 */
async function getRegencies(provinceId) {
  const key = `regencies/${provinceId}`;
  const cached = getCached(key);
  if (cached) {
    console.log(`[regionalService] cache HIT: ${key}`);
    return cached;
  }
  console.log(`[regionalService] cache MISS: ${key} — fetching Emsifa`);
  const data = await fetchWithRetry(`/regencies/${provinceId}.json`);
  setCache(key, data);
  return data;
}

/**
 * Ambil kecamatan by id kabupaten/kota
 * @param {string} regencyId
 */
async function getDistricts(regencyId) {
  const key = `districts/${regencyId}`;
  const cached = getCached(key);
  if (cached) {
    console.log(`[regionalService] cache HIT: ${key}`);
    return cached;
  }
  console.log(`[regionalService] cache MISS: ${key} — fetching Emsifa`);
  const data = await fetchWithRetry(`/districts/${regencyId}.json`);
  setCache(key, data);
  return data;
}

/**
 * Ambil kelurahan/desa by id kecamatan
 * @param {string} districtId
 */
async function getVillages(districtId) {
  const key = `villages/${districtId}`;
  const cached = getCached(key);
  if (cached) {
    console.log(`[regionalService] cache HIT: ${key}`);
    return cached;
  }
  console.log(`[regionalService] cache MISS: ${key} — fetching Emsifa`);
  const data = await fetchWithRetry(`/villages/${districtId}.json`);
  setCache(key, data);
  return data;
}

module.exports = {
  getProvinces,
  getRegencies,
  getDistricts,
  getVillages,
};
