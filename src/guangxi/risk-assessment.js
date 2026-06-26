/**
 * 风险评估模块
 * 核心功能：单个院校风险评估、整体滑档概率估算
 */
(function () {
  'use strict';

  /**
   * Assess admission risk for a single school relative to student rank
   * @param {Object} school - School object with historyRanks, avgRank, etc.
   * @param {number} studentRank - Student's provincial rank
   * @returns {Object} { positionRisk, volatilityRisk, enrollmentRisk, riskPercent, riskLevel }
   */
  function assessRisk(school, studentRank) {
    var delta = school.avgRank - studentRank;

    // 1. Position risk - based on delta between school avg rank and student rank
    var positionRisk;
    if (delta < -8000) {
      positionRisk = '高风险';
    } else if (delta < -4000) {
      positionRisk = '中高风险';
    } else if (delta < 6000) {
      positionRisk = '中等风险';
    } else if (delta < 12000) {
      positionRisk = '低风险';
    } else {
      positionRisk = '极低风险';
    }

    // 2. Volatility risk - standard deviation of historical ranks
    var ranks = school.historyRanks;
    var stdDev;
    if (ranks.length >= 2) {
      var sumSquaredDiff = ranks.reduce(function (s, r) {
        return s + Math.pow(r - school.avgRank, 2);
      }, 0);
      stdDev = Math.sqrt(sumSquaredDiff / ranks.length);
    } else {
      stdDev = 0;
    }

    var volatilityRisk;
    if (stdDev > 5000) {
      volatilityRisk = '高波动';
    } else if (stdDev > 2000) {
      volatilityRisk = '中等波动';
    } else {
      volatilityRisk = '稳定';
    }

    // 3. Enrollment trend - simplified, could expand with historical enrollment data
    var enrollmentRisk = '稳定';

    // Calculate risk percentage
    var riskPercent = Math.max(1, Math.round((1 - delta / 30000) * 100));

    return {
      positionRisk: positionRisk,
      volatilityRisk: volatilityRisk,
      enrollmentRisk: enrollmentRisk,
      riskPercent: riskPercent,
      riskLevel: delta < -4000 ? '冲刺' : (delta < 6000 ? '稳妥' : '保底')
    };
  }

  /**
   * Calculate overall slip probability based on 保底 school coverage
   * @param {Array} volunteers - Array of volunteer entries with tier property
   * @returns {string} Slip probability range
   */
  function calculateOverallSlipProbability(volunteers) {
    // Simple estimation based on 保底 coverage
    var 保底 = volunteers.filter(function (v) {
      return v.tier === '保底';
    });

    if (保底.length >= 6) {
      return '<2%';
    }
    if (保底.length >= 4) {
      return '3-5%';
    }
    if (保底.length >= 2) {
      return '5-8%';
    }
    return '>10%';
  }

  // Export all to window
  window.RiskAssessment = {
    assessRisk: assessRisk,
    calculateOverallSlipProbability: calculateOverallSlipProbability
  };
})();
