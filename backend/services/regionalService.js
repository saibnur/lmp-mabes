const axios = require('axios');

const BASE_URL =
  process.env.REGIONAL_API_BASE_URL ||
  'https://www.emsifa.com/api-wilayah-indonesia/api';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { Accept: 'application/json' },
});

/**
 * Ambil daftar provinsi (API Emsifa)
 * @returns {Promise<Array<{id:string, name:string}>>}
 */
async function getProvinces() {
  const { data } = await client.get('/provinces.json');
  return data;
}

/**
 * Ambil kabupaten/kota by id provinsi
 * @param {string} provinceId
 */
async function getRegencies(provinceId) {
  const { data } = await client.get(`/regencies/${provinceId}.json`);
  return data;
}

/**
 * Ambil kecamatan by id kabupaten/kota
 * @param {string} regencyId
 */
async function getDistricts(regencyId) {
  const { data } = await client.get(`/districts/${regencyId}.json`);
  return data;
}

/**
 * Ambil kelurahan/desa by id kecamatan
 * @param {string} districtId
 */
async function getVillages(districtId) {
  const { data } = await client.get(`/villages/${districtId}.json`);
  return data;
}

module.exports = {
  getProvinces,
  getRegencies,
  getDistricts,
  getVillages,
};
