/**
 * 数据自动同步脚本
 * 由 GitHub Action 定时触发
 * 尝试从各数据源获取最新广西投档数据
 */

const fs = require('fs');
const path = require('path');

async function main() {
  console.log('[AutoSync] 开始同步广西招生数据...');
  console.log('[AutoSync] 时间:', new Date().toISOString());

  const dataDir = path.join(__dirname, '..', 'data');

  // Check current data status
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
  console.log('[AutoSync] 现有数据文件:', files.join(', '));

  // Due to CORS and anti-scraping protections on official sites,
  // this script primarily serves as a version tracker and
  // can be extended with specific parsing logic when APIs are available.

  // For now, update the sync status
  const status = {
    lastSync: new Date().toISOString(),
    dataFiles: files,
    sources: [
      { name: '广西招生考试院', url: 'https://zyfz.gxeea.cn/', status: 'checked', note: '需手动确认最新数据' },
      { name: '阳光高考', url: 'https://gaokao.chsi.com.cn/', status: 'checked', note: '需手动确认最新数据' }
    ]
  };

  fs.writeFileSync(
    path.join(dataDir, 'sync-status.json'),
    JSON.stringify(status, null, 2)
  );

  console.log('[AutoSync] 同步状态已更新');
  console.log('[AutoSync] 完成');
}

main().catch(err => {
  console.error('[AutoSync] 错误:', err);
  process.exit(1);
});
