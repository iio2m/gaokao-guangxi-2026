function renderVolunteerTable(result, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const tierLabels = { '冲刺': '🚀 冲刺档', '稳妥': '✅ 稳妥档', '保底': '🛡️ 保底档' };
  const tierColors = { '冲刺': '#d32f2f', '稳妥': '#f57c00', '保底': '#388e3c' };

  let html = '';

  ['冲刺', '稳妥', '保底'].forEach(tier => {
    const schools = result[tier] || [];
    if (schools.length === 0) return;

    const color = tierColors[tier];
    const riskRange = tier === '冲刺' ? '65%-85%' : tier === '稳妥' ? '20%-60%' : '0%-20%';

    html += `<div class="tier-section" style="margin-bottom: 24px;">
      <h3 style="color: ${color}; border-left: 4px solid ${color}; padding-left: 12px;">
        ${tierLabels[tier]} <span style="font-size:14px;color:#666;">（共${schools.length}所，建议风险${riskRange}）</span>
      </h3>
      <div class="table-responsive">
        <table class="volunteer-table">
          <thead>
            <tr>
              <th>院校名称</th>
              <th>所在地</th>
              <th>推荐专业</th>
              <th>近3年平均位次</th>
              <th>录取风险</th>
              <th>推荐理由</th>
            </tr>
          </thead>
          <tbody>
            ${schools.map(s => `
              <tr>
                <td><strong>${s.name}</strong>${s.isGuangxiLocal ? ' <span class="badge badge-local">区内</span>' : ''}${s.hasLocalPolicy ? ' <span class="badge badge-policy">专项</span>' : ''}</td>
                <td>${s.city || s.province}</td>
                <td>${(s.majors || []).slice(0, 2).map(m => m.name).join('<br>')}</td>
                <td>${(s.avgRank || 0).toLocaleString()}</td>
                <td>
                  <div class="risk-bar">
                    <div class="risk-fill" style="width:${s.riskPercent || 50}%;background:${s.riskPercent > 65 ? '#d32f2f' : s.riskPercent > 20 ? '#f57c00' : '#388e3c'}"></div>
                  </div>
                  <span style="font-size:12px;">${s.riskPercent || '?'}%</span>
                </td>
                <td style="font-size:13px;">${s.recommendationReason || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
  });

  // Summary
  if (result.summary) {
    html += `<div class="summary-card">
      <h4>📊 志愿方案总结</h4>
      <p>总推荐院校：<strong>${result.summary.totalSchools}</strong>所 | 整体滑档概率：<strong style="color:${result.summary.slipProbability > 5 ? '#d32f2f' : '#388e3c'}">${result.summary.slipProbability}</strong></p>
      <p style="font-size:13px;color:#666;">数据来源：广西招生考试院历年投档公开信息 | 仅供参考，以官方发布为准</p>
    </div>`;
  }

  container.innerHTML = html;
}

window.VolunteerTable = { renderVolunteerTable };
