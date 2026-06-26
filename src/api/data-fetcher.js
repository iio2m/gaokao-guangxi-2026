const DATA_SOURCES = window.GX_CONFIG?.dataSources || [
  { name: '广西招生考试院', url: 'https://zyfz.gxeea.cn/Main/Luqu/LQ_Zhineng.aspx', type: 'official' },
  { name: '阳光高考', url: 'https://gaokao.chsi.com.cn/', type: 'official' },
  { name: '夸克高考', url: 'https://vt.quark.cn/blm/pc-gaokao-1089/index', type: 'auxiliary' }
];

async function fetchLatestData() {
  // Due to CORS restrictions, direct API calls to official sites may fail
  // This module provides a framework for data fetching with fallback
  const results = [];

  if (!navigator.onLine) {
    console.warn('离线状态，跳过联网数据获取');
    return { online: false, results: [] };
  }

  for (const source of DATA_SOURCES) {
    try {
      // Attempt to fetch (will likely get CORS error, but we try anyway)
      const resp = await fetch(source.url, { mode: 'no-cors', timeout: 5000 });
      results.push({ name: source.name, status: 'attempted', note: 'CORS限制，使用本地缓存数据' });
    } catch (e) {
      results.push({ name: source.name, status: 'unreachable', note: e.message });
    }
  }

  return { online: navigator.onLine, results, note: '当前使用本地缓存数据，建议访问官方查询最新信息' };
}

async function checkDataFreshness() {
  const status = window.RankCache?.getCacheStatus() || {};
  return {
    ...status,
    needsRefresh: status.dataAge && parseInt(status.dataAge) > 24,
    dataSourceStatus: DATA_SOURCES.map(s => ({ name: s.name, accessible: false, note: '静态部署，使用缓存数据' }))
  };
}

window.DataFetcher = { fetchLatestData, checkDataFreshness, DATA_SOURCES };
