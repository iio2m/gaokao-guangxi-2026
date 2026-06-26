let isOnline = navigator.onLine;
let listeners = [];

window.addEventListener('online', () => {
  isOnline = true;
  listeners.forEach(fn => fn(true));
  showToast && showToast('网络已恢复，可获取最新数据');
});

window.addEventListener('offline', () => {
  isOnline = false;
  listeners.forEach(fn => fn(false));
  showToast && showToast('当前为离线模式，使用缓存数据');
});

function onNetworkChange(callback) {
  listeners.push(callback);
  return () => { listeners = listeners.filter(f => f !== callback); };
}

function getNetworkStatus() {
  return {
    online: isOnline,
    type: navigator.connection?.effectiveType || 'unknown',
    downlink: navigator.connection?.downlink || 0
  };
}

window.NetworkStatus = { onNetworkChange, getNetworkStatus, isOnline: () => isOnline };
