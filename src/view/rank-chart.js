async function renderRankChart(canvasId, schools) {
  if (typeof Chart === 'undefined') {
    // Load Chart.js from CDN if not available
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  // Destroy existing chart instance
  const existingChart = Chart.getChart(canvas);
  if (existingChart) existingChart.destroy();

  const topSchools = schools.slice(0, 10); // Show top 10

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: topSchools.map(s => s.name.length > 6 ? s.name.slice(0, 6) + '...' : s.name),
      datasets: [
        {
          label: '2023年位次',
          data: topSchools.map(s => s.historyRanks?.[0] || 0),
          backgroundColor: 'rgba(26, 122, 58, 0.6)',
          borderColor: '#1a7a3a',
          borderWidth: 1
        },
        {
          label: '2024年位次',
          data: topSchools.map(s => s.historyRanks?.[1] || 0),
          backgroundColor: 'rgba(255, 109, 0, 0.6)',
          borderColor: '#ff6d00',
          borderWidth: 1
        },
        {
          label: '2025年位次',
          data: topSchools.map(s => s.historyRanks?.[2] || 0),
          backgroundColor: 'rgba(25, 118, 210, 0.6)',
          borderColor: '#1976d2',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: '推荐院校近三年投档位次对比', font: { size: 16 } },
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.raw.toLocaleString()}名`
          }
        }
      },
      scales: {
        y: {
          reverse: true, // Lower rank = better
          title: { display: true, text: '省位次' },
          ticks: { callback: (v) => v.toLocaleString() }
        }
      }
    }
  });
}

window.RankChart = { renderRankChart };
