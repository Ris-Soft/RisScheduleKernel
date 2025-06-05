import { UUID } from "crypto";
import { configType } from "./types";

/**
 * 获取默认的课程表配置对象。
 */
export function getDefaultConfig(): configType {
  return {
    version: "1.0.0",
    groupName: "",
    groupUuid: "" as UUID,
    startDate: new Date(),
    schedules: [],
    subjects: [],
    timeTargets: [],
  };
}

/**
 * 获取指定日期对应的单双周
 */
export function getWeekTypeForDate(startDate: Date, date: Date): { weekType: "odd" | "even", dayIndex: number } {
  const timeDiff = date.getTime() - startDate.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const weekNumber = Math.floor(daysDiff / 7);
  const dayIndex = date.getDay() || 7; // 将周日的0转换为7

  return {
    weekType: weekNumber % 2 === 0 ? "odd" : "even",
    dayIndex
  };
}
