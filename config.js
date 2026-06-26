window.GX_CONFIG = {
  "project": {
    "name": "广西2026高考志愿填报助手",
    "version": "1.0.0",
    "province": "广西",
    "year": 2026,
    "examType": "物理类",
    "本科线": 368,
    "特控线": 510
  },
  "studentTemplate": {
    "defaultProvince": "广西",
    "defaultYear": 2026,
    "defaultSubject": "物理类",
    "defaultBirthPlace": "玉林市博白县",
    "defaultGender": "女",
    "defaultFamily": "普通工人家庭",
    "constraints": [
      "只推荐公办全日制本科",
      "剔除民办、独立学院、高收费中外合作",
      "优先工科：机械/自动化/电气/电子信息/通信/测控/智能制造",
      "弱化重型机械、热能动力等重物理专业",
      "省内公办优先级 > 邻省(粤湘黔滇) > 外省(仅极高性价比)"
    ],
    "preferenceOrder": [
      "广西",
      "广东",
      "湖南",
      "贵州",
      "云南"
    ],
    "feeCap": 8000,
    "majorCategories": [
      "电气类",
      "电子信息类",
      "自动化类",
      "机械类",
      "仪器类",
      "计算机类"
    ]
  },
  "chongWenBao": {
    "totalSlots": 40,
    "description": "广西本科普通批可填40个院校志愿，以下为冲稳保建议分配",
    "冲刺": {
      "min": -12000,
      "max": -4000,
      "riskLabel": "冲刺",
      "riskRange": [65, 85],
      "maxCount": 10,
      "suggestedCount": "6-10所"
    },
    "稳妥": {
      "min": -4000,
      "max": 6000,
      "riskLabel": "稳妥",
      "riskRange": [20, 60],
      "maxCount": 25,
      "suggestedCount": "20-25所"
    },
    "保底": {
      "min": 6000,
      "max": 18000,
      "riskLabel": "保底",
      "riskRange": [0, 20],
      "minCount": 8,
      "suggestedCount": "8-10所"
    },
    "guangxiWeight": 3000,
    "weakCurrentBonus": 1500,
    "heavyMachineryPenalty": -2000,
    "localPolicyBonus": 5000,
    "neighborThreshold": 8000
  },
  "api": {
    "deepseek": {
      "baseUrl": "https://api.deepseek.com/v1",
      "model": "deepseek-chat",
      "endpoint": "/chat/completions"
    }
  },
  "dataSources": [
    {
      "name": "广西招生考试院",
      "url": "https://zyfz.gxeea.cn/Main/Luqu/LQ_Zhineng.aspx",
      "type": "official"
    },
    {
      "name": "阳光高考",
      "url": "https://gaokao.chsi.com.cn/",
      "type": "official"
    },
    {
      "name": "夸克高考",
      "url": "https://vt.quark.cn/blm/pc-gaokao-1089/index",
      "type": "auxiliary"
    }
  ],
  "exampleStudent": {
    "totalScore": 489,
    "subjects": {
      "语文": 102,
      "数学": 74,
      "英语": 113,
      "物理": 50,
      "化学": 70,
      "生物": 80
    },
    "rank": 76054,
    "birthPlace": "玉林市博白县",
    "gender": "女",
    "family": "普通工人家庭",
    "preferredMajors": [
      "电气类",
      "电子信息类",
      "自动化类"
    ],
    "preferredRegions": [
      "广西",
      "广东"
    ]
  }
};