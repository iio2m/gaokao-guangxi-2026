function exportToMarkdown(studentProfile, result) {
  const profile = studentProfile || {};
  const now = new Date().toLocaleDateString('zh-CN');

  let md = `# 广西2026高考志愿填报分析报告\n\n`;
  md += `## 考生信息\n\n`;
  md += `- **总分**：${profile.totalScore || '?'}分 | **位次**：${profile.rank?.toLocaleString() || '?'}\n`;
  md += `- **选科**：物理类 | **生源地**：${profile.birthPlace || '广西'}\n`;
  md += `- **单科成绩**：语文${profile.subjects?.语文||'?'} 数学${profile.subjects?.数学||'?'} 英语${profile.subjects?.英语||'?'} 物理${profile.subjects?.物理||'?'} 化学${profile.subjects?.化学||'?'} 生物${profile.subjects?.生物||'?'}\n`;
  md += `- **等效往年**：约${Math.round((profile.totalScore || 489) * 368/368)}分左右\n`;
  md += `- **家庭条件**：${profile.family || '普通工薪'} | **意向专业**：${(profile.preferredMajors || ['电气','电子','自动化']).join('、')}\n\n`;

  md += `## 冲稳保推荐清单\n\n`;

  ['冲刺', '稳妥', '保底'].forEach(tier => {
    const schools = result[tier] || [];
    if (schools.length === 0) return;
    md += `### ${tier}档（${schools.length}所）\n\n`;
    md += `| 院校 | 所在地 | 推荐专业 | 平均位次 | 录取风险 | 推荐理由 |\n`;
    md += `|------|--------|----------|----------|----------|----------|\n`;
    schools.forEach(s => {
      const majors = (s.majors || []).slice(0, 2).map(m => m.name).join('、');
      md += `| ${s.name} | ${s.city || s.province} | ${majors} | ${(s.avgRank || 0).toLocaleString()} | ${s.riskPercent || '?'}% | ${s.recommendationReason || ''} |\n`;
    });
    md += `\n`;
  });

  md += `## 注意事项\n\n`;
  md += `1. 本报告由AI辅助生成，所有数据请以广西招生考试院官方公布为准\n`;
  md += `2. 建议填报前逐一核实各院校2026年招生章程\n`;
  md += `3. 冲刺院校务必勾选服从专业调剂，防止退档\n`;
  md += `4. 滑档概率为算法估算，不构成录取保证\n\n`;
  md += `---\n生成时间：${now} | 工具：广西2026高考志愿填报助手\n`;

  return md;
}

function exportToExcelText(studentProfile, result) {
  // Tab-separated text that can be pasted into Excel
  let text = `院校名称\t所在地\t推荐专业\t平均位次\t录取风险\t推荐理由\t档次\n`;

  ['冲刺', '稳妥', '保底'].forEach(tier => {
    (result[tier] || []).forEach(s => {
      const majors = (s.majors || []).slice(0, 2).map(m => m.name).join('、');
      text += `${s.name}\t${s.city || s.province}\t${majors}\t${(s.avgRank || 0).toLocaleString()}\t${s.riskPercent || '?'}%\t${s.recommendationReason || ''}\t${tier}\n`;
    });
  });

  return text;
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob(['﻿' + content], { type: mimeType + ';charset=utf-8' }); // BOM for Excel UTF-8 recognition
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportMarkdownFile(studentProfile, result) {
  const md = exportToMarkdown(studentProfile, result);
  downloadFile(md, '广西2026高考志愿报告.md', 'text/markdown');
}

function exportExcelFile(studentProfile, result) {
  const text = exportToExcelText(studentProfile, result);
  downloadFile(text, '广西2026高考志愿清单.txt', 'text/plain');
}

window.ExportReport = { exportToMarkdown, exportToExcelText, exportMarkdownFile, exportExcelFile };
