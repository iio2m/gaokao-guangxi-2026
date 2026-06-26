function getStudentProfile() {
  const raw = localStorage.getItem('gx_student_profile');
  return raw ? JSON.parse(raw) : window.GX_CONFIG?.exampleStudent || null;
}

function buildProfileText(profile) {
  if (!profile) return '';
  return `## 考生信息（最高优先级）
- 省份：广西 | 年份：2026 | 选科：物理类
- 总分：${profile.totalScore}分 | 省位次：${profile.rank}
- 单科：语文${profile.subjects?.语文||'?'} 数学${profile.subjects?.数学||'?'} 英语${profile.subjects?.英语||'?'} 物理${profile.subjects?.物理||'?'} 化学${profile.subjects?.化学||'?'} 生物${profile.subjects?.生物||'?'}
- 生源地：${profile.birthPlace || '广西'} | 性别：${profile.gender || '女'}
- 家庭：${profile.family || '普通工人家庭'}
- 硬性约束：仅公办全日制本科，工科大类（电气/自动化/电子信息/测控/通信/机械），弱电优先
- 分数定位：${profile.description || `超本科线${profile.above本科线}分，位次${profile.rank}`}
- ${profile.hasLocalPolicy ? '有地方专项资格（玉林博白户籍）' : ''}`;
}

/**
 * Build authoritative school data context from local cache.
 * This is injected into every API prompt to prevent AI hallucination of admission data.
 */
function buildDataContext(studentRank) {
  // Try loading from RankCache
  var schools = null;
  if (window.RankCache && window.RankCache.getCachedData) {
    schools = window.RankCache.getCachedData('schools');
  }

  if (!schools || !schools.length) {
    return '\n\n⚠️ 院校数据暂未加载，请勿编造任何录取分数和位次。如实告诉用户"本地数据未加载，请刷新页面后重试"。';
  }

  // Filter to schools within student's relevant range (N-20000 to N+25000)
  var rank = studentRank || 76054;
  var relevant = schools.filter(function(s) {
    return s.avgRank >= rank - 20000 && s.avgRank <= rank + 25000;
  });

  // Also include a few top schools for reference
  var topSchools = schools.filter(function(s) { return s.avgRank < rank - 20000; });
  topSchools.sort(function(a, b) { return b.avgRank - a.avgRank; });
  topSchools = topSchools.slice(0, 5);

  // Also include a few safety schools
  var safetySchools = schools.filter(function(s) { return s.avgRank > rank + 25000; });
  safetySchools.sort(function(a, b) { return a.avgRank - b.avgRank; });
  safetySchools = safetySchools.slice(0, 5);

  var allRelevant = topSchools.concat(relevant).concat(safetySchools);

  // Build compact data table
  var ctx = '\n\n## 📊 权威院校数据（广西招生考试院历年投档位次，严禁编造）\n\n';
  ctx += '以下是唯一可信的院校投档数据。如果用户问到的院校不在列表中，如实说"该院校数据暂缺"，禁止编造任何分数或位次。\n\n';
  ctx += '| 院校 | 省份 | 城市 | 2023位次 | 2024位次 | 2025位次 | 均价(元/年) | 专业方向 |\n';
  ctx += '|------|------|------|----------|----------|----------|------------|----------|\n';

  allRelevant.forEach(function(s) {
    var ranks = (s.historyRanks || []).map(function(r) { return r ? r.toLocaleString() : '-'; });
    var majors = (s.majors || []).slice(0, 3).map(function(m) { return m.name; }).join('、');
    var tag = s.isGuangxiLocal ? '【区内】' : '';
    if (s.hasLocalPolicy) tag += '【专项】';
    ctx += '| ' + s.name + tag + ' | ' + s.province + ' | ' + (s.city || '') + ' | ' + (ranks[0] || '-') + ' | ' + (ranks[1] || '-') + ' | ' + (ranks[2] || '-') + ' | ' + (s.tuition || '?') + ' | ' + majors + ' |\n';
  });

  ctx += '\n**数据约束**：学生位次' + rank.toLocaleString() + '。冲刺区间' + (rank - 12000).toLocaleString() + '~' + (rank - 4000).toLocaleString() + '，稳妥区间' + (rank - 4000).toLocaleString() + '~' + (rank + 6000).toLocaleString() + '，保底区间' + (rank + 6000).toLocaleString() + '~' + (rank + 18000).toLocaleString() + '。\n';
  ctx += '**严禁编造**：上述数据外不得虚构任何院校的录取分数、位次、就业薪资、录取人数。不确定就直说不知道。\n';

  return ctx;
}

function getSystemPrompt(roleId, studentProfile) {
  var profileText = buildProfileText(studentProfile);
  var dataCtx = buildDataContext(studentProfile ? studentProfile.rank : 76054);

  var antiHallucination = '\n\n## ⚠️ 数据诚信规则（最高优先级）\n' +
    '1. 上面"权威院校数据"表格是唯一可信的投档数据来源。引用录取分数/位次时，必须与表格一致。\n' +
    '2. 如果用户问的院校不在表格中，说"该院校不在我的数据中，建议去广西招生考试院官网查询"。\n' +
    '3. 绝对禁止编造任何院校的录取分数、位次、招生人数、就业薪资。一旦编造会误导考生志愿填报，后果严重。\n' +
    '4. 考生实际分数和位次见上方"考生信息"，不要擅自更改。\n';

  var prompts = {
    'zhangxuefeng': '你是张雪峰风格高考志愿咨询师。说话务实直白，直接从就业和性价比分析。\n' + profileText + dataCtx + antiHallucination + '\n输出规则：\n1. 第一句定位分数档次，给出整体判断\n2. 引用数据时只能使用上述权威表格中的位次，不得自己编数字\n3. 针对物理单科短板和英语优势，明确专业取舍\n4. 分地域对比（广西区内>广东/湖南/贵州/云南邻省>其他），贴合工薪家庭\n5. 提醒避开民办、高收费，服从调剂防退档\n6. 女生就业现实建议（弱电/电控岗位友好）\n7. 每次回答末尾给出一条具体填报建议',

    'policy-expert': '你是广西招生考试院政策解读专员，精通2026广西物理类本科普通批全部规则。\n' + profileText + dataCtx + antiHallucination + '\n输出规则：\n1. 所有政策以广西考试院官网规则为准，不编造\n2. 解读广西平行志愿投档逻辑、一次投档规则\n3. 分析服从调剂/不服从调剂风险\n4. 解读地方专项报考条件（玉林博白户籍适用）\n5. 区分公办一本、二本投档线波动规律\n6. 每次回答给出明确操作建议',

    'engineering-analyst': '你是工科专业就业规划分析师，针对女生、物理短板考生做专业细分规划。\n' + profileText + dataCtx + antiHallucination + '\n输出规则：\n1. 拆分四大工科方向：弱电（电子/通信/测控/自动化）→推荐；强电（电气）→电网对口；传统机械→谨慎；热动重工→不推荐\n2. 引用院校数据只使用上述权威表格\n3. 结合广西本地产业分析（柳州汽车、南宁电子、各地供电局）\n4. 给出大学学习建议：物理薄弱如何弥补，英语优势如何发挥',

    'data-calculator': '你是纯数据量化测算分析师。不做主观评价，仅输出客观数据。\n' + profileText + dataCtx + antiHallucination + '\n输出规则：\n1. 纯数据输出：基于上述权威表格中的位次计算录取风险\n2. 严格按算法分档（冲刺/稳妥/保底），标注加权修正\n3. 不做就业评价、不做好坏判断，只给数据\n4. 输出格式：表格化数据 + 简要统计说明'
  };

  return prompts[roleId] || prompts['zhangxuefeng'];
}

function buildMessages(roleId, conversationHistory, userInput, studentProfile) {
  var systemPrompt = getSystemPrompt(roleId, studentProfile);
  var messages = [{ role: 'system', content: systemPrompt }];

  // Add conversation context (last 15 messages to leave room for data context)
  var recentHistory = (conversationHistory || []).slice(-15);
  messages.push.apply(messages, recentHistory);

  // Add current user input
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

window.RoleManager = { getStudentProfile, buildProfileText, getSystemPrompt, buildMessages, switchRole, getActiveRole, groupChat };
