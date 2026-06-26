/**
 * 数据缓存模块
 * 核心功能：缓存管理、离线数据加载、状态查询
 */
(function () {
  'use strict';

  var CACHE_KEY = 'gx_gaokao_cache';
  var CACHE_TS_KEY = 'gx_gaokao_cache_ts';

  /**
   * Initialize cache: load data files from network and store in localStorage
   * Only runs if no cache exists
   * @returns {Promise<void>}
   */
  async function initCache() {
    if (!localStorage.getItem(CACHE_KEY)) {
      // Load from data files
      try {
        var results = await Promise.all([
          fetch('data/schools.json'),
          fetch('data/guangxi_2023.json'),
          fetch('data/guangxi_2024.json'),
          fetch('data/guangxi_2025.json')
        ]);

        var schoolsResp = results[0];
        var d2023Resp = results[1];
        var d2024Resp = results[2];
        var d2025Resp = results[3];

        var schools = await schoolsResp.json();
        var data2023 = await d2023Resp.json();
        var data2024 = await d2024Resp.json();
        var data2025 = await d2025Resp.json();

        var cacheData = {
          schools: schools,
          guangxi_2023: data2023,
          guangxi_2024: data2024,
          guangxi_2025: data2025
        };

        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        localStorage.setItem(CACHE_TS_KEY, new Date().toISOString());
      } catch (e) {
        console.warn('Failed to load data files:', e);
      }
    }
  }

  /**
   * Get cached data by key
   * @param {string} key - 'schools', 'guangxi_2023', 'guangxi_2024', 'guangxi_2025'
   * @returns {*} Cached data or null
   */
  function getCachedData(key) {
    try {
      var cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      return typeof cache[key] !== 'undefined' ? cache[key] : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Set or update cache data
   * @param {string} key
   * @param {*} data
   */
  function setCacheData(key, data) {
    var cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    cache[key] = data;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    localStorage.setItem(CACHE_TS_KEY, new Date().toISOString());
  }

  /**
   * Get cache status information
   * @returns {Object} { hasCache, lastUpdate, dataAge, isOffline, cacheSize }
   */
  function getCacheStatus() {
    var ts = localStorage.getItem(CACHE_TS_KEY);
    var cache = localStorage.getItem(CACHE_KEY);

    return {
      hasCache: !!cache,
      lastUpdate: ts || '从未',
      dataAge: ts
        ? Math.floor((Date.now() - new Date(ts).getTime()) / 3600000) + '小时前'
        : '无',
      isOffline: !navigator.onLine,
      cacheSize: cache ? (cache.length / 1024).toFixed(1) + 'KB' : '0KB'
    };
  }

  /**
   * Clear all cached data
   */
  function clearCache() {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TS_KEY);
  }

  // Export all to window
  window.RankCache = {
    initCache: initCache,
    getCachedData: getCachedData,
    setCacheData: setCacheData,
    getCacheStatus: getCacheStatus,
    clearCache: clearCache
  };
})();
