/**
 * 冲稳保核心算法
 * 核心功能：根据学生位次，将院校分为冲刺、稳妥、保底三个梯队
 */
(function () {
  'use strict';

  /**
   * Main algorithm: classify schools into 冲刺/稳妥/保底 tiers
   * @param {number} rank - Student's provincial rank (e.g. 76054)
   * @param {Array} schools - Full school list with history data
   * @returns {Object} { 冲刺: [], 稳妥: [], 保底: [], summary: { totalSchools, slipProbability, studentRank } }
   */
  function calculateChongWenBao(rank, schools) {
    var config = window.GX_CONFIG.chongWenBao;
    var result = {
      '冲刺': [],
      '稳妥': [],
      '保底': []
    };

    schools.forEach(function (school) {
      var delta = school.avgRank - rank;

      // Determine base tier
      var tier;
      if (delta >= config['冲刺'].min && delta <= config['冲刺'].max) {
        tier = '冲刺';
      } else if (delta >= config['稳妥'].min && delta <= config['稳妥'].max) {
        tier = '稳妥';
      } else if (delta >= config['保底'].min && delta <= config['保底'].max) {
        tier = '保底';
      } else {
        return; // Skip schools outside all ranges
      }

      // Calculate base risk percentage
      // Risk = (1 - (avgRank - N + 12000) / 30000) * 100%
      var riskPercent = Math.round((1 - (school.avgRank - rank + 12000) / 30000) * 100);
      riskPercent = Math.max(0, Math.min(99, riskPercent));

      // Apply Guangxi weight adjustments
      if (window.WeightAdjust) {
        var adjustment = window.WeightAdjust.applyWeightAdjustment(school, rank);
        riskPercent = Math.max(1, Math.min(95, riskPercent + adjustment.riskAdjustment));
        school._adjustmentReasons = adjustment.reasons;
        school._adjustedDelta = adjustment.adjustedDelta;
      }

      // Rank volatility calculation
      var ranks = school.historyRanks;
      var volatility;
      if (ranks.length >= 2) {
        var sumSquaredDiff = ranks.reduce(function (s, r) {
          return s + Math.pow(r - school.avgRank, 2);
        }, 0);
        volatility = Math.round(Math.sqrt(sumSquaredDiff / ranks.length));
      } else {
        volatility = 0;
      }

      // Enrollment trend
      var enrollmentTrend = 'stable'; // Simplified

      // Build school entry with recommendations
      var entry = {
        name: school.name,
        province: school.province,
        city: school.city,
        isPublic: school.isPublic,
        isGuangxiLocal: school.isGuangxiLocal,
        hasLocalPolicy: school.hasLocalPolicy,
        tuition: school.tuition,
        avgRank: school.avgRank,
        avgScore: school.avgScore,
        historyRanks: school.historyRanks,
        historyScores: school.historyScores,
        majors: school.majors,
        website: school.website,
        tier: tier,
        riskPercent: riskPercent,
        volatility: volatility,
        enrollmentTrend: enrollmentTrend,
        recommendationReason: generateRecommendation(school, tier, riskPercent, rank),
        disadvantages: generateDisadvantages(school, tier)
      };

      result[tier].push(entry);
    });

    // Sort: 冲刺 by difficulty descending (lowest avgRank = hardest), 稳妥/保底 by risk ascending
    result['冲刺'].sort(function (a, b) {
      return a.avgRank - b.avgRank;
    });

    result['稳妥'].sort(function (a, b) {
      return a.riskPercent - b.riskPercent;
    });

    result['保底'].sort(function (a, b) {
      return a.riskPercent - b.riskPercent;
    });

    // Cap counts
    if (result['冲刺'].length > 6) {
      result['冲刺'] = result['冲刺'].slice(0, 6);
    }
    if (result['稳妥'].length > 15) {
      result['稳妥'] = result['稳妥'].slice(0, 15);
    }

    // Calculate overall slip probability
    var totalSchools = result['冲刺'].length + result['稳妥'].length + result['保底'].length;
    var slipProbability = calculateSlipProbability(result);

    return {
      '冲刺': result['冲刺'],
      '稳妥': result['稳妥'],
      '保底': result['保底'],
      summary: {
        totalSchools: totalSchools,
        slipProbability: slipProbability,
        studentRank: rank
      }
    };
  }

  /**
   * Generate recommendation text for a school entry
   * @param {Object} school
   * @param {string} tier
   * @param {number} riskPercent
   * @param {number} studentRank
   * @returns {string}
   */
  function generateRecommendation(school, tier, riskPercent, studentRank) {
    var reasons = [];

    if (school.isGuangxiLocal) {
      reasons.push('广西区内公办，本地就业优势明显');
    }

    if (tier === '稳妥' && riskPercent < 40) {
      reasons.push('位次高度匹配，录取把握大');
    }

    if (tier === '保底') {
      reasons.push('常年录取位次靠后，兜底首选');
    }

    if (school.hasLocalPolicy) {
      reasons.push('地方专项计划可降分录取');
    }

    if (school.majors.some(function (m) { return m.isWeakCurrent; })) {
      reasons.push('弱电专业适配女生/物理短板考生');
    }

    if (school.tuition <= 5000) {
      reasons.push('学费低廉，适合工薪家庭');
    }

    return reasons.join('；') || '综合匹配度尚可';
  }

  /**
   * Generate disadvantage text for a school entry
   * @param {Object} school
   * @param {string} tier
   * @returns {string}
   */
  function generateDisadvantages(school, tier) {
    var dis = [];

    if (tier === '冲刺') {
      dis.push('录取风险较高，建议服从调剂');
    }

    if (!school.isGuangxiLocal && school.province !== '广西') {
      dis.push('外省院校（' + school.province + '），生活成本高');
    }

    if (school.majors.some(function (m) { return m.isHeavyMachinery; })) {
      dis.push('含重型机械专业，物理要求高');
    }

    return dis.join('；') || '无明显劣势';
  }

  /**
   * Calculate overall slip probability based on 保底 coverage
   * @param {Object} result - The classified result object
   * @returns {string}
   */
  function calculateSlipProbability(result) {
    // Simplified: if we have good 保底 coverage, slip probability is very low
    var 保底Count = result['保底'].length;

    if (保底Count >= 6) {
      return '<2%';
    }
    if (保底Count >= 4) {
      return '2-5%';
    }
    if (保底Count >= 2) {
      return '5-10%';
    }
    return '>10%';
  }

  // Export all to window
  window.ChongWenBao = {
    calculateChongWenBao: calculateChongWenBao
  };
})();
