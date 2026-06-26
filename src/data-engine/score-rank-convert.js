/**
 * 分数-位次转换引擎
 * 核心功能：分数转位次、位次转分数、等效分计算、学生画像构建
 */
(function () {
  'use strict';

  /**
   * Calculate equivalent scores for past years based on rank
   * Uses linear interpolation method
   * @param {number} totalScore - Student's total score in 2026
   * @param {number} rank - Student's provincial rank
   * @param {Array} yearData - [{year, 本科线, 特控线, records: [{rank, score}...]}]
   * @returns {Object} { [year]: equivalent_score }
   */
  function calculateEquivalent(totalScore, rank, yearData) {
    // yearData is an array [{year, 本科线, 特控线, records: [{rank, score}...]}]
    // For 2026→2025: find the score that corresponds to the same percentile rank
    // Simple approach: 2025_equivalent_score = totalScore * (2025_本科线 / 2026_本科线)
    // Better approach: use rank directly since rank is more stable than score
    var baseYear = yearData.find(function (y) { return y.year === 2026; }) || yearData[yearData.length - 1];
    var results = {};

    yearData.forEach(function (y) {
      if (y.year !== 2026) {
        // Same rank → find closest score in that year
        var ratio = y['本科线'] / baseYear['本科线'];
        results[y.year] = Math.round(totalScore * ratio);
      }
    });

    return results;
  }

  /**
   * Convert rank to equivalent score using rank-score mapping
   * @param {number} rank - Provincial rank
   * @param {Array} rankScoreMap - Sorted array of {rank, score}
   * @returns {number} Equivalent score
   */
  function rankToScore(rank, rankScoreMap) {
    // rankScoreMap: sorted array of {rank, score}
    // Binary search for closest rank, return corresponding score
    var idx = rankScoreMap.findIndex(function (r) { return r.rank >= rank; });

    if (idx <= 0) {
      return rankScoreMap[0].score;
    }

    if (idx >= rankScoreMap.length) {
      return rankScoreMap[rankScoreMap.length - 1].score;
    }

    // Linear interpolation between two closest rank entries
    var a = rankScoreMap[idx - 1];
    var b = rankScoreMap[idx];
    return Math.round(a.score + (b.score - a.score) * (rank - a.rank) / (b.rank - a.rank));
  }

  /**
   * Convert score to equivalent rank using score-rank mapping
   * Reverse of rankToScore
   * @param {number} score - Score to convert
   * @param {Array} scoreRankMap - Sorted array of {score, rank}
   * @returns {number} Equivalent rank
   */
  function scoreToRank(score, scoreRankMap) {
    // scoreRankMap: sorted array of {score, rank}
    var idx = scoreRankMap.findIndex(function (r) { return r.score >= score; });

    if (idx <= 0) {
      return scoreRankMap[0].rank;
    }

    if (idx >= scoreRankMap.length) {
      return scoreRankMap[scoreRankMap.length - 1].rank;
    }

    // Linear interpolation between two closest score entries
    var a = scoreRankMap[idx - 1];
    var b = scoreRankMap[idx];
    return Math.round(a.rank + (b.rank - a.rank) * (score - a.score) / (b.score - a.score));
  }

  /**
   * Get score level description relative to baseline
   * @param {number} totalScore - Student's total score
   * @param {number} rank - Student's provincial rank
   * @param {Object} baseline - { 本科线, 特控线 }
   * @returns {Object} Level information
   */
  function getScoreLevelDescription(totalScore, rank, baseline) {
    var above本科 = totalScore - baseline['本科线'];
    var below特控 = totalScore - baseline['特控线'];

    return {
      above本科线: above本科,
      below特控线: below特控,
      description: above本科 >= 0
        ? '超本科线' + above本科 + '分'
        : '低于本科线' + Math.abs(above本科) + '分',
      level: below特控 >= 0 ? '一本区间' : '二本区间',
      rankInterval: [Math.max(0, rank - 12000), rank + 18000]
    };
  }

  /**
   * Build student profile from form data
   * @param {Object} formData - Form input data
   * @returns {Object} Student profile
   */
  function buildStudentProfile(formData) {
    var totalScore = formData.totalScore;
    var rank = formData.rank;
    var subjects = formData.subjects;
    var birthPlace = formData.birthPlace;
    var gender = formData.gender;
    var family = formData.family;
    var preferredMajors = formData.preferredMajors;
    var preferredRegions = formData.preferredRegions;

    var config = window.GX_CONFIG;
    var baseline = {
      '本科线': config.project['本科线'],
      '特控线': config.project['特控线']
    };

    var levelInfo = getScoreLevelDescription(totalScore, rank, baseline);

    return {
      totalScore: totalScore,
      rank: rank,
      subjects: subjects,
      birthPlace: birthPlace,
      gender: gender,
      family: family,
      preferredMajors: preferredMajors || ['电气类', '电子信息类', '自动化类'],
      preferredRegions: preferredRegions || ['广西', '广东'],
      above本科线: levelInfo.above本科线,
      below特控线: levelInfo.below特控线,
      description: levelInfo.description,
      level: levelInfo.level,
      rankInterval: levelInfo.rankInterval,
      hasLocalPolicy: birthPlace && birthPlace.indexOf('博白县') >= 0
    };
  }

  // Export all to window
  window.ScoreRankConvert = {
    calculateEquivalent: calculateEquivalent,
    rankToScore: rankToScore,
    scoreToRank: scoreToRank,
    getScoreLevelDescription: getScoreLevelDescription,
    buildStudentProfile: buildStudentProfile
  };
})();
