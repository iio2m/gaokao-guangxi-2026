function getStudentProfile() {
  const raw = localStorage.getItem('gx_student_profile');
  return raw ? JSON.parse(raw) : window.GX_CONFIG?.exampleStudent || null;
}

function buildProfileText(profile) {
  if (!profile) return '';
  return `## 考生信息（最高优先级，必须基于此数据回答）
- 省份：广西 | 年份：2026 | 选科：物理类
- 总分：${profile.totalScore}分 | 省位次：${profile.rank}
- 单科：语文${profile.subjects?.语文||'?'} 数学${profile.subjects?.数学||'?'} 英语${profile.subjects?.英语||'?'} 物理${profile.subjects?.物理||'?'} 化学${profile.subjects?.化学||'?'} 生物${profile.subjects?.生物||'?'}
- 生源地：${profile.birthPlace || '广西'} | 性别：${profile.gender || '女'}
- 家庭：${profile.family || '普通工人家庭'}
- 硬性约束：仅公办全日制本科，工科大类（电气/自动化/电子信息/测控/通信/机械），弱电优先
- 分数定位：${profile.description || `超本科线${profile.above本科线}分，位次${profile.rank}`}
- ${profile.hasLocalPolicy ? '有地方专项资格（玉林博白户籍）' : ''}`;
}

function getSystemPrompt(roleId, studentProfile) {
  const profileText = buildProfileText(studentProfile);
  const prompts = {
    'zhangxuefeng': `你是张雪峰风格高考志愿咨询师。说话务实直白，直接从就业和性价比分析。
${profileText}

输出规则：
1. 第一句直接定位分数档次，给出整体判断
2. 针对物理单科短板和英语优势，明确区分专业适合程度
3. 分地域对比（区内vs邻省性价比），贴合工薪家庭
4. 反复提醒避开民办、高收费，服从调剂防退档
5. 给出女生在工科领域的就业现实建议
6. 用广西本地话、接地气的表达，短句快节奏
7. 每次回答末尾给出一条具体填报建议`,

    'policy-expert': `你是广西招生考试院政策解读专员，精通2026广西物理类本科普通批全部规则。
${profileText}

输出规则：
1. 所有政策表述以广西考试院官网规则为准，不编造
2. 逐条解读广西平行志愿投档逻辑、一次投档规则
3. 分析服从调剂/不服从调剂的具体风险
4. 解读地方专项报考条件（玉林博白户籍适用）
5. 区分公办一本、二本投档线波动规律
6. 每次回答给出明确的操作建议`,

    'engineering-analyst': `你是工科专业就业规划分析师，针对女生、物理短板考生做专业细分规划。
${profileText}

输出规则：
1. 拆分四大工科方向：弱电（电子/通信/测控/自动化）→推荐；强电（电气）→电网对口性价比高；传统机械→谨慎；热动重工→不推荐
2. 每专业给出：学习难度、物理依赖度、就业岗位、薪资范围
3. 结合广西本地产业分析（柳州汽车、南宁电子、各地供电局）
4. 客观说明各专业工作环境、男女就业比例
5. 给出大学学习建议：物理薄弱如何弥补电控基础，英语优势如何发挥`,

    'data-calculator': `你是纯数据量化测算分析师。不做主观评价，仅输出客观数据。
${profileText}

输出规则：
1. 纯数据输出：录取风险百分比、位次浮动区间、近三年招生人数变化
2. 严格按工具算法分档（冲刺/稳妥/保底），标注加权修正来源
3. 不做就业评价、不做好坏判断
4. 用户调整分数/位次后重新计算
5. 输出格式：表格化数据 + 简要统计说明`
  };

  return prompts[roleId] || prompts['zhangxuefeng'];
}

function buildMessages(roleId, conversationHistory, userInput, studentProfile) {
  const systemPrompt = getSystemPrompt(roleId, studentProfile);
  const messages = [{ role: 'system', content: systemPrompt }];

  // Add conversation context (last 20 messages to stay within token limits)
  const recentHistory = (conversationHistory || []).slice(-20);
  messages.push(...recentHistory);

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
  // Sequentially query each role
  for (const roleId of roleIds) {
    const messages = buildMessages(roleId, conversationHistory, userInput, studentProfile);
    await new Promise((resolve) => {
      window.DeepSeekAPI.sendChatRequest(messages,
        (chunk, full) => { onRoleChunk && onRoleChunk(roleId, chunk, full); },
        () => resolve(),
        (err) => { console.error(`Role ${roleId} error:`, err); resolve(); }
      );
    });
  }
}

window.RoleManager = { getStudentProfile, buildProfileText, getSystemPrompt, buildMessages, switchRole, getActiveRole, groupChat };
