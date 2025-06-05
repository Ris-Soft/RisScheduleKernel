"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultConfig = getDefaultConfig;
exports.getWeekTypeForDate = getWeekTypeForDate;
/**
 * 获取默认的课程表配置对象。
 */
function getDefaultConfig() {
    return {
        version: "1.0.0",
        groupName: "",
        groupUuid: "",
        startDate: new Date(),
        schedules: [],
        subjects: [],
        timeTargets: [],
    };
}
/**
 * 获取指定日期对应的单双周
 */
function getWeekTypeForDate(startDate, date) {
    const timeDiff = date.getTime() - startDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(daysDiff / 7);
    const dayIndex = date.getDay() || 7; // 将周日的0转换为7
    return {
        weekType: weekNumber % 2 === 0 ? "odd" : "even",
        dayIndex
    };
}
