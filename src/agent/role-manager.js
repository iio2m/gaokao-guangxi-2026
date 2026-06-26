function getStudentProfile() {
  var raw = localStorage.getItem('gx_student_profile');
  return raw ? JSON.parse(raw) : window.GX_CONFIG ? window.GX_CONFIG.exampleStudent : null;
}

function buildProfileText(profile) {
  if (!profile) return '';
  return '## 考生信息\n' +
    '- 省份：广西 | 年份：2026 | 选科：物理类\n' +
    '- 总分：' + profile.totalScore + '分 | 省位次：' + (profile.rank ? profile.rank.toLocaleString() : '?') + '\n' +
    '- 单科：语文' + (profile.subjects && profile.subjects['语文'] || '?') +
    ' 数学' + (profile.subjects && profile.subjects['数学'] || '?') +
    ' 英语' + (profile.subjects && profile.subjects['英语'] || '?') +
    ' 物理' + (profile.subjects && profile.subjects['物理'] || '?') +
    ' 化学' + (profile.subjects && profile.subjects['化学'] || '?') +
    ' 生物' + (profile.subjects && profile.subjects['生物'] || '?') + '\n' +
    '- 生源地：' + (profile.birthPlace || '广西') + ' | 性别：' + (profile.gender || '女') + '\n' +
    '- 家庭：' + (profile.family || '普通工人家庭') + '\n' +
    '- 约束：仅公办本科，工科（电气/自动化/电子信息/测控/通信/机械），弱电优先\n' +
    '- 定位：' + (profile.description || '未计算') + '\n' +
    (profile.hasLocalPolicy ? '- 有地方专项资格（博白户籍）\n' : '');
}

/**
 * Build school data context that adapts to ANY student rank.
 * For high ranks (top students), shows best available schools.
 * For mid/low ranks, shows full range with 冲/稳/保 tiers.
 */
function buildDataContext(studentRank) {
  var schools = null;
  if (window.RankCache && window.RankCache.getCachedData) {
    schools = window.RankCache.getCachedData('schools');
  }

  if (!schools || !schools.length) {
    return '\n\n> ⚠️ 院校数据暂未加载。请基于你的专业知识给出一般性建议，但不要编造任何具体院校的录取分数和位次。所有数字必须标注"据公开信息"。';
  }

  var rank = studentRank || 76054;

  // Sort all schools by distance from student rank
  var sorted = schools.slice().sort(function(a, b) {
    return Math.abs(a.avgRank - rank) - Math.abs(b.avgRank - rank);
  });

  // Take top 50 closest schools — this adapts to any score
  var closest = sorted.slice(0, 50);

  // Also ensure some top-tier schools are included for reference
  var topTier = schools.filter(function(s) { return s.avgRank < 15000; });
  topTier.sort(function(a, b) { return a.avgRank - b.avgRank; });

  // Merge: top-tier + closest, deduplicate
  var seen = {};
  var merged = [];
  topTier.forEach(function(s) { seen[s.name] = true; merged.push(s); });
  closest.forEach(function(s) {
    if (!seen[s.name]) { seen[s.name] = true; merged.push(s); }
  });

  // Calculate tiers
  var chongMin = rank - 12000;
  var chongMax = rank - 4000;
  var wenMin = rank - 4000;
  var wenMax = rank + 6000;
  var baoMin = rank + 6000;
  var baoMax = rank + 18000;

  // Count schools per tier
  var chongCount = 0, wenCount = 0, baoCount = 0;
  merged.forEach(function(s) {
    if (s.avgRank >= chongMin && s.avgRank < chongMax) chongCount++;
    if (s.avgRank >= wenMin && s.avgRank < wenMax) wenCount++;
    if (s.avgRank >= baoMin && s.avgRank < baoMax) baoCount++;
  });

  // Build context with tier guidance
  var ctx = '\n\n## 院校投档数据（来源：广西招生考试院历年公开信息，部分为估算值，填报前请以官方公布为准）\n\n';
  ctx += '**学生位次：' + rank.toLocaleString() + '** | 广西本科普通批可填 **40个** 院校志愿\n';
  ctx += '- 冲刺档（位次' + chongMin.toLocaleString() + '~' + chongMax.toLocaleString() + '）：建议填6-10所，现有' + chongCount + '所可选\n';
  ctx += '- 稳妥档（位次' + wenMin.toLocaleString() + '~' + wenMax.toLocaleString() + '）：建议填20-25所，现有' + wenCount + '所可选\n';
  ctx += '- 保底档（位次' + baoMin.toLocaleString() + '~' + baoMax.toLocaleString() + '）：建议填8-10所，现有' + baoCount + '所可选\n';
  ctx += '- 区间外但接近的院校也可参考\n\n';

  ctx += '| 院校 | 省份 | 城市 | 近3年位次(23/24/25) | 学费 | 工科专业 | 标签 |\n';
  ctx += '|------|------|------|---------------------|------|----------|------|\n';

  merged.forEach(function(s) {
    var ranks = (s.historyRanks || []).map(function(r) { return r ? r.toLocaleString() : '?'; });
    var majors = (s.majors || []).slice(0, 2).map(function(m) { return m.name; }).join('、');
    var tags = [];
    if (s.isGuangxiLocal) tags.push('区内');
    if (s.hasLocalPolicy) tags.push('专项');
    if (s.level) tags.push(s.level);

    var delta = s.avgRank - rank;
    var tierMark = '';
    if (delta >= chongMin && delta < chongMax) tierMark = '🔴冲';
    else if (delta >= wenMin && delta < wenMax) tierMark = '🟡稳';
    else if (delta >= baoMin && delta < baoMax) tierMark = '🟢保';
    else if (delta < chongMin) tierMark = '⬆高';
    else tierMark = '⬇低';

    ctx += '| ' + s.name + ' | ' + s.province + ' | ' + (s.city || '') + ' | ' + (ranks[0] || '?') + ' / ' + (ranks[1] || '?') + ' / ' + (ranks[2] || '?') + ' | ' + (s.tuition || '?') + ' | ' + majors + ' | ' + tierMark + ' ' + tags.join(' ') + ' |\n';
  });

  ctx += '\n**数据说明**：以上数据部分基于公开信息估算。2026年实际投档线可能有波动，请务必以广西招生考试院官方发布为准。';
  ctx += '\n**诚信规则**：\n';
  ctx += '1. 引用院校录取分数/位次时，只能使用上表中的数据。表中没有的院校，说"该院校不在当前数据中"。\n';
  ctx += '2. 做就业分析、专业评价、地域建议时，可以运用你的专业知识，但不要虚构具体薪资数字。\n';
  ctx += '3. 如果学生分数对应的位次超出数据覆盖范围，如实告知并建议查询官方渠道。\n';
  ctx += '4. 绝对禁止为了迎合用户而编造任何录取数据。\n';

  return ctx;
}

function getSystemPrompt(roleId, studentProfile) {
  var profileText = buildProfileText(studentProfile);
  var dataCtx = buildDataContext(studentProfile ? studentProfile.rank : null);

  var antiHallucination = '\n\n## 数据诚信（最高优先级，覆盖其他所有规则）\n' +
    '1. 录取分数和位次 → 只能用上面"院校投档数据"表中的数字\n' +
    '2. 不在表中的院校 → 说"该院校当前数据暂缺，建议查广西招生考试院官网"\n' +
    '3. 就业分析/专业评价/城市对比 → 可以基于专业知识，但薪资要说"行业一般水平"而非精确数字\n' +
    '4. 广西本科普通批可以填40个志愿，冲稳保分配建议参考上面的统计数据\n' +
    '5. 绝对不要编造任何院校的具体录取分/位次/招生人数。这是底线。\n';

  var prompts = {
    'zhangxuefeng': '你是张雪峰风格高考志愿咨询师。务实直白，就业导向。\n' + profileText + dataCtx + antiHallucination +
      '\n输出要求：\n' +
      '1. 第一句话定位分数档次，给出总体判断\n' +
      '2. 引用录取数据只能用上面表格里的，不确定就直说\n' +
      '3. 结合单科短板（物理弱/英语好）给专业取舍建议\n' +
      '4. 分地域对比：广西区内 > 粤湘黔滇 > 其他省\n' +
      '5. 提醒避坑：民办/高收费/不服从调剂退档风险\n' +
      '6. 给女生就业现实建议，推荐弱电方向\n' +
      '7. 结合广西40个志愿额度，给出冲稳保数量分配建议',

    'policy-expert': '你是广西招生考试院政策解读专员。\n' + profileText + dataCtx + antiHallucination +
      '\n输出要求：\n' +
      '1. 解读广西平行志愿：分数优先、遵循志愿、一次投档\n' +
      '2. 40个志愿怎么分配：冲刺/稳妥/保底的比例建议\n' +
      '3. 服从调剂的具体影响和风险\n' +
      '4. 地方专项/国家专项政策（博白户籍适用）\n' +
      '5. 特控线与本科线的实际意义\n' +
      '6. 征集志愿、滑档补救措施\n' +
      '7. 所有政策以广西考试院官网为准，不编造省外政策',

    'engineering-analyst': '你是工科专业就业规划分析师。\n' + profileText + dataCtx + antiHallucination +
      '\n输出要求：\n' +
      '1. 工科方向分层推荐：\n' +
      '   ⭐5 弱电（电子/通信/测控/自动化控制）→ 物理要求低，女生友好\n' +
      '   ⭐4 强电（电气工程）→ 电网对口，物理中难度\n' +
      '   ⭐2 传统机械 → 物理力学要求高，车间多，谨慎\n' +
      '   ❌ 热动/重工 → 不推荐\n' +
      '2. 结合广西产业：柳州汽车、南宁电子产业园、各地市供电局\n' +
      '3. 物理短板弥补方案 + 英语优势发挥方向\n' +
      '4. 考公/电网/事业单位/珠三角就业路径分析',

    'data-calculator': '你是纯数据测算分析师。不做主观评价，只输出客观数据。\n' + profileText + dataCtx + antiHallucination +
      '\n输出要求：\n' +
      '1. 基于上面"院校投档数据"表，计算各院校录取风险百分比\n' +
      '2. 按冲刺/稳妥/保底分档输出，每档内按风险排序\n' +
      '3. 标注加权修正（区内院校、弱电专业等）\n' +
      '4. 输出整体滑档概率估算\n' +
      '5. 格式：MARKDOWN表格 + 简要统计\n' +
      '6. 参考广西40志愿额度，给出每档建议填充数量'
  };

  return prompts[roleId] || prompts['zhangxuefeng'];
}

function buildMessages(roleId, conversationHistory, userInput, studentProfile) {
  var systemPrompt = getSystemPrompt(roleId, studentProfile);
  var messages = [{ role: 'system', content: systemPrompt }];
  var recentHistory = (conversationHistory || []).slice(-15);
  for (var i = 0; i < recentHistory.length; i++) {
    messages.push(recentHistory[i]);
  }
  messages.push({ role: 'user', content: userInput });
  return messages;
}

function switchRole(newRoleId) {
  localStorage.setItem('gx_active_role', newRoleId);
}

function getActiveRole() {
  return localStorage.getItem('gx_active_role') || 'zhangxuefeng';
}

async function groupChat(roleIds, conversationHistory, userInput, studentProfile, onRoleChunk) {
  for (var i = 0; i < roleIds.length; i++) {
    var roleId = roleIds[i];
    var messages = buildMessages(roleId, conversationHistory, userInput, studentProfile);
    await new Promise(function(resolve) {
      window.DeepSeekAPI.sendChatRequest(messages,
        function(chunk, full) { onRoleChunk && onRoleChunk(roleId, chunk, full); },
        function() { resolve(); },
        function(err) { console.error('Role ' + roleId + ' error:', err); resolve(); }
      );
    });
  }
}

window.RoleManager = {
  getStudentProfile: getStudentProfile,
  buildProfileText: buildProfileText,
  getSystemPrompt: getSystemPrompt,
  buildMessages: buildMessages,
  switchRole: switchRole,
  getActiveRole: getActiveRole,
  groupChat: groupChat
};
