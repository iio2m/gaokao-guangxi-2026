/**
 * 动态位次波动图表 — Chart.js 柱状图 + 考生位次参考线
 * 显示推荐院校近三年投档位次变化 + 冲/稳/保分层着色
 */

async function renderRankChart(canvasId, schools, studentRank) {
  // Ensure Chart.js is loaded
  if (typeof Chart === 'undefined') {
    await new Promise(function(resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  var canvas = document.getElementById(canvasId);
  if (!canvas) return;

  // Destroy previous chart
  var existing = Chart.getChart(canvas);
  if (existing) existing.destroy();

  // Sort schools by distance from student rank
  var rank = studentRank || 76054;
  var sorted = schools.slice().sort(function(a, b) {
    return Math.abs(a.avgRank - rank) - Math.abs(b.avgRank - rank);
  });

  // Take top 20 schools, mix of tiers
  var display = sorted.slice(0, 20).sort(function(a, b) {
    return a.avgRank - b.avgRank;
  });

  // Determine tier for each school
  function getTier(avgRank) {
    var d = avgRank - rank;
    if (d >= -8000 && d < -3000) return '冲刺';
    if (d >= -3000 && d < 5000) return '稳妥';
    if (d >= 5000 && d < 15000) return '保底';
    return '其他';
  }

  var tierColors = {
    '冲刺': { bg: 'rgba(211,47,47,0.7)', border: '#d32f2f', label: '冲刺档' },
    '稳妥': { bg: 'rgba(245,124,0,0.7)', border: '#f57c00', label: '稳妥档' },
    '保底': { bg: 'rgba(56,142,60,0.7)', border: '#388e3c', label: '保底档' },
    '其他': { bg: 'rgba(158,158,158,0.5)', border: '#9e9e9e', label: '其他' }
  };

  // Build datasets — one bar group per school, three bars per group
  var labels = display.map(function(s) {
    var name = s.name.length > 8 ? s.name.slice(0, 7) + '…' : s.name;
    var t = getTier(s.avgRank);
    return name;
  });

  // Color each bar by year, but also show tier background shading
  var datasets = [
    {
      label: '2023年位次',
      data: display.map(function(s) { return (s.historyRanks && s.historyRanks[0]) || null; }),
      backgroundColor: 'rgba(26,122,58,0.55)',
      borderColor: '#1a7a3a',
      borderWidth: 1,
      borderRadius: 3
    },
    {
      label: '2024年位次',
      data: display.map(function(s) { return (s.historyRanks && s.historyRanks[1]) || null; }),
      backgroundColor: 'rgba(255,109,0,0.55)',
      borderColor: '#ff6d00',
      borderWidth: 1,
      borderRadius: 3
    },
    {
      label: '2025年位次',
      data: display.map(function(s) { return (s.historyRanks && s.historyRanks[2]) || null; }),
      backgroundColor: 'rgba(25,118,210,0.55)',
      borderColor: '#1976d2',
      borderWidth: 1,
      borderRadius: 3
    }
  ];

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        title: {
          display: true,
          text: '推荐院校近三年投档位次对比 · 虚线=' + rank.toLocaleString() + '(你的位次)',
          font: { size: 14 },
          padding: { bottom: 16 }
        },
        subtitle: {
          display: true,
          text: '柱越短=位次越靠前=学校越好 | 红色虚线以上为冲刺区，附近为稳妥区，以下为保底区',
          font: { size: 11 },
          padding: { bottom: 10 }
        },
        legend: {
          position: 'bottom',
          labels: { usePointStyle: true, padding: 20 }
        },
        tooltip: {
          callbacks: {
            title: function(items) {
              var idx = items[0].dataIndex;
              var s = display[idx];
              return s.name + ' (' + (s.city || s.province) + ') [' + getTier(s.avgRank) + ']';
            },
            label: function(ctx) {
              var val = ctx.raw;
              if (!val) return ctx.dataset.label + ': 无数据';
              var s = display[ctx.dataIndex];
              var delta = val - rank;
              var arrow = delta < 0 ? '↑领先' + Math.abs(delta).toLocaleString() : '↓落后' + delta.toLocaleString();
              return ctx.dataset.label + ': ' + val.toLocaleString() + '名 (' + arrow + ')';
            },
            afterBody: function(items) {
              var idx = items[0].dataIndex;
              var s = display[idx];
              var trends = [];
              var ranks = s.historyRanks || [];
              if (ranks.length >= 2) {
                var diff = ranks[ranks.length - 1] - ranks[0];
                if (diff > 3000) trends.push('📈 位次上升(难度降低)');
                else if (diff < -3000) trends.push('📉 位次下降(难度增加)');
                else trends.push('➡ 位次稳定');
              }
              return trends;
            }
          }
        },
        annotation: false // We'll use a custom plugin instead
      },
      scales: {
        y: {
          reverse: true,
          title: { display: true, text: '省位次（越低越好）', font: { size: 12 } },
          ticks: {
            callback: function(v) { return (v / 10000).toFixed(1) + '万'; },
            stepSize: 5000
          },
          grid: {
            color: function(context) {
              // Highlight student rank area
              if (context.tick.value >= rank - 5000 && context.tick.value <= rank + 5000) {
                return 'rgba(255,109,0,0.3)';
              }
              return 'rgba(0,0,0,0.06)';
            }
          }
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 0,
            font: { size: 10 }
          }
        }
      },
      // Custom plugin for student rank reference line
      plugins: [{
        id: 'studentRankLine',
        afterDraw: function(chart) {
          var ctx = chart.ctx;
          var yScale = chart.scales.y;
          var xScale = chart.scales.x;
          var yVal = yScale.getPixelForValue(rank);

          // Draw dashed reference line at student rank
          ctx.save();
          ctx.setLineDash([6, 4]);
          ctx.strokeStyle = '#d32f2f';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(xScale.left, yVal);
          ctx.lineTo(xScale.right, yVal);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw label
          ctx.fillStyle = '#d32f2f';
          ctx.font = 'bold 12px -apple-system, "PingFang SC", sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText('你的位次 ' + rank.toLocaleString(), xScale.right - 8, yVal - 6);

          // Shade tier zones
          var chongTop = yScale.getPixelForValue(Math.max(0, rank - 10000));
          var wenMid = yScale.getPixelForValue(rank);
          var baoBottom = yScale.getPixelForValue(rank + 15000);

          // 冲刺 zone (red tint, above student)
          ctx.fillStyle = 'rgba(211,47,47,0.04)';
          ctx.fillRect(xScale.left, chongTop, xScale.right - xScale.left, yVal - chongTop);

          // 稳妥 zone (orange tint, around student)
          ctx.fillStyle = 'rgba(245,124,0,0.04)';
          ctx.fillRect(xScale.left, yVal - (yVal - chongTop) * 0.3, xScale.right - xScale.left, baoBottom - yVal + (yVal - chongTop) * 0.3);

          // 保底 zone (green tint, below student)
          ctx.fillStyle = 'rgba(56,142,60,0.04)';
          ctx.fillRect(xScale.left, baoBottom - (baoBottom - yVal) * 0.5, xScale.right - xScale.left, yScale.bottom - baoBottom + (baoBottom - yVal) * 0.5);

          ctx.restore();
        }
      }]
    }
  });

  // Return chart instance for external control
  return Chart.getChart(canvas);
}

window.RankChart = { renderRankChart: renderRankChart };
