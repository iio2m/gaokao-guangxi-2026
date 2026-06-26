/**
 * 广西专项权重调整模块
 * 核心功能：根据学校属性、专业方向、地域政策等因素调整录取风险评估
 */
(function () {
  'use strict';

  /**
   * Apply Guangxi-specific weight adjustments to a school's risk assessment
   * @param {Object} school - School object with majors, province info
   * @param {number} studentRank - Student's provincial rank
   * @returns {Object} { adjustedDelta, riskAdjustment, reasons }
   */
  function applyWeightAdjustment(school, studentRank) {
    var deltaAdjust = 0;
    var riskAdjust = 0;
    var reasons = [];

    // Rule 1: Guangxi local schools get +3000 rank advantage
    if (school.isGuangxiLocal) {
      deltaAdjust += 3000;
      riskAdjust -= 8;
      reasons.push('广西区内公办，位次权重上浮3000');
    }

    // Rule 2: Weak current majors (electronics/electrical/automation/communications/measurement) - risk down
    var hasWeakCurrent = school.majors.some(function (m) {
      return m.isWeakCurrent;
    });
    if (hasWeakCurrent) {
      deltaAdjust += 1500;
      riskAdjust -= 5;
      reasons.push('弱电专业方向，适配女生/物理低分，风险下调');
    }

    // Rule 3: Heavy machinery - risk up
    var hasHeavyMachinery = school.majors.some(function (m) {
      return m.isHeavyMachinery;
    });
    if (hasHeavyMachinery) {
      deltaAdjust -= 2000;
      riskAdjust += 8;
      reasons.push('重型机械专业，物理要求高，风险上调');
    }

    // Rule 4: Local policy (地方专项) - significant bonus
    if (school.hasLocalPolicy) {
      deltaAdjust += 5000;
      riskAdjust -= 15;
      reasons.push('地方专项计划，可降分录取');
    }

    // Rule 5: Neighbor province threshold check
    var neighborProvinces = ['广东', '湖南', '贵州', '云南'];
    if (neighborProvinces.indexOf(school.province) >= 0) {
      var delta = school.avgRank - studentRank;
      if (Math.abs(delta) < 8000) {
        reasons.push('邻省院校位次差距不足8000，需谨慎评估');
      }
    }

    return {
      adjustedDelta: deltaAdjust,
      riskAdjustment: riskAdjust,
      reasons: reasons
    };
  }

  // Export all to window
  window.WeightAdjust = {
    applyWeightAdjustment: applyWeightAdjustment
  };
})();
