/**
 * 多条件筛选引擎
 * 核心功能：学校筛选、排序、统计
 */
(function () {
  'use strict';

  /**
   * Filter schools by multiple conditions
   * @param {Array} schools - Full school list
   * @param {Object} filters - Filter criteria
   * @param {number} filters.isPublic - 1=public, 0=private, undefined=all
   * @param {Array} filters.provinces - Array of province names
   * @param {number} filters.maxTuition - Maximum tuition threshold
   * @param {Array} filters.rankRange - [minRank, maxRank]
   * @param {Array} filters.majorCategories - Array of major category names
   * @param {boolean} filters.suitedForGirls - Filter for female-friendly majors
   * @param {string} filters.maxPhysicsDependency - Max physics dependency level
   * @param {number} rank - Student's provincial rank
   * @returns {Array} Filtered school list
   */
  function filterSchools(schools, filters, rank) {
    var result = schools.slice();

    // Filter by public/private
    if (filters.isPublic !== undefined) {
      result = result.filter(function (s) {
        return s.isPublic === filters.isPublic;
      });
    }

    // Filter by province
    if (filters.provinces && filters.provinces.length > 0 && filters.provinces.indexOf('') < 0) {
      result = result.filter(function (s) {
        return filters.provinces.indexOf(s.province) >= 0;
      });
    }

    // Filter by max tuition
    if (filters.maxTuition) {
      result = result.filter(function (s) {
        return s.tuition <= filters.maxTuition;
      });
    }

    // Filter by rank range
    if (filters.rankRange && rank) {
      var min = filters.rankRange[0];
      var max = filters.rankRange[1];
      result = result.filter(function (s) {
        return s.avgRank >= min && s.avgRank <= max;
      });
    }

    // Filter by major categories
    if (filters.majorCategories && filters.majorCategories.length > 0) {
      result = result.filter(function (s) {
        return s.majors.some(function (m) {
          return filters.majorCategories.indexOf(m.category) >= 0;
        });
      });
    }

    // Filter for female-friendly majors
    if (filters.suitedForGirls) {
      result = result.filter(function (s) {
        return s.majors.some(function (m) {
          return m.suitedForGirls;
        });
      });
    }

    // Filter by max physics dependency
    if (filters.maxPhysicsDependency) {
      var levels = ['低', '中低', '中', '中高', '高'];
      var maxIdx = levels.indexOf(filters.maxPhysicsDependency);
      result = result.filter(function (s) {
        return s.majors.some(function (m) {
          return levels.indexOf(m.physicsDependency) <= maxIdx;
        });
      });
    }

    return result;
  }

  /**
   * Sort schools by provincial preference order, then by average rank
   * @param {Array} schools - School list to sort
   * @param {Array} preferenceOrder - Province preference order
   * @returns {Array} Sorted school list
   */
  function sortByPreference(schools, preferenceOrder) {
    return schools.sort(function (a, b) {
      var aIdx = preferenceOrder.indexOf(a.province);
      var bIdx = preferenceOrder.indexOf(b.province);

      var aOrder = aIdx >= 0 ? aIdx : preferenceOrder.length;
      var bOrder = bIdx >= 0 ? bIdx : preferenceOrder.length;

      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }

      // Same province or both not in preference: sort by average rank
      return a.avgRank - b.avgRank;
    });
  }

  /**
   * Get average rank of a school
   * @param {Object} school
   * @returns {number}
   */
  function getAvgRank(school) {
    return school.avgRank;
  }

  /**
   * Get average historical score of a school
   * @param {Object} school
   * @returns {number}
   */
  function getAvgScore(school) {
    return school.historyScores.reduce(function (a, b) {
      return a + b;
    }, 0) / school.historyScores.length;
  }

  // Export all to window
  window.DataFilter = {
    filterSchools: filterSchools,
    sortByPreference: sortByPreference,
    getAvgRank: getAvgRank,
    getAvgScore: getAvgScore
  };
})();
