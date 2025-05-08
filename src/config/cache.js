const cache = {};
const cacheTimes = {};

// Ambil data dari cache
function getCache(key) {
  if (cache[key] && cacheTimes[key] && Date.now() - cacheTimes[key] < cache[key].duration) {
    return cache[key].data;
  }
  return null;
}

// Simpan data ke cache
function setCache(key, data, duration) {
  cache[key] = { data, duration };
  cacheTimes[key] = Date.now();
}

module.exports = { getCache, setCache };