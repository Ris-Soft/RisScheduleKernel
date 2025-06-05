import { UUID } from "crypto";
import { timeTarget } from "../types";

export class TimeManager {
  constructor(private config: any) {}

  /**
   * 获取当前时间的课程状态
   */  getCurrentLessonStatus() {
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 8);
    const timeTargets = this.config.timeTargets;
    
    // 先排序时间段
    const sortedTimeTargets = [...timeTargets].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );

    // 获取当天的课程列表
    const { weekType, dayIndex } = this.getWeekTypeForDate(now);
    const todaySchedule = this.config.schedules.find(
      (s: any) =>
        !s.dateMode &&
        s.activeDay === dayIndex &&
        (weekType === "odd" ? s.activeWeek === 1 : s.activeWeek === 2)
    );
    const lessons = todaySchedule?.lessons || [];

    if (sortedTimeTargets[0] && timeStr < sortedTimeTargets[0].startTime) {
      return {
        status: "not_started" as const,
        nextLesson: lessons[0],
        timeTarget: sortedTimeTargets[0],
      };
    }

    for (let i = 0; i < sortedTimeTargets.length; i++) {
      const current = sortedTimeTargets[i];
      const next = sortedTimeTargets[i + 1];

      if (timeStr >= current.startTime && timeStr <= current.endTime) {
        return {
          status: "in_class" as const,
          currentLesson: lessons[i],
          nextLesson: lessons[i + 1],
          timeTarget: current,
        };
      }

      if (next && timeStr > current.endTime && timeStr < next.startTime) {
        return {
          status: "break" as const,
          currentLesson: lessons[i],
          nextLesson: lessons[i + 1],
          timeTarget: next,
        };
      }
    }

    return {
      status: "ended" as const,
      currentLesson: lessons[lessons.length - 1],
    };
  }

  /**
   * 编辑时间表
   */
  editTimeTarget(uuid: UUID, startTime: string, endTime: string): boolean {
    const timeTarget = this.config.timeTargets.find((t: any) => t.UUID === uuid);
    if (!timeTarget) {
      return false;
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return false;
    }

    timeTarget.startTime = startTime;
    timeTarget.endTime = endTime;
    return true;
  }

  /**
   * 创建新的时间表项
   * @param startTime 开始时间 "HH:mm:ss"
   * @param endTime 结束时间 "HH:mm:ss"
   * @returns 新创建的时间表项的UUID，如果创建失败则返回undefined
   */
  createTimeTarget(startTime: string, endTime: string): UUID | undefined {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return undefined;
    }

    // 检查时间是否有冲突
    if (this.hasTimeConflict(startTime, endTime)) {
      return undefined;
    }

    const newUuid = this.generateUUID();
    const newTimeTarget: timeTarget = {
      UUID: newUuid,
      startTime,
      endTime,
    };

    this.config.timeTargets.push(newTimeTarget);
    this.sortTimeTargets();
    return newUuid;
  }

  /**
   * 在指定时间表项后添加新的时间表项
   * @param afterUuid 在此UUID后添加
   * @param startTime 开始时间 "HH:mm:ss"
   * @param endTime 结束时间 "HH:mm:ss"
   * @returns 新创建的时间表项的UUID，如果创建失败则返回undefined
   */
  insertTimeTargetAfter(
    afterUuid: UUID,
    startTime: string,
    endTime: string
  ): UUID | undefined {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return undefined;
    }

    const index = this.config.timeTargets.findIndex((t: timeTarget) => t.UUID === afterUuid);
    if (index === -1) {
      return undefined;
    }

    // 检查时间是否有冲突
    if (this.hasTimeConflict(startTime, endTime)) {
      return undefined;
    }

    const newUuid = this.generateUUID();
    const newTimeTarget: timeTarget = {
      UUID: newUuid,
      startTime,
      endTime,
    };

    this.config.timeTargets.splice(index + 1, 0, newTimeTarget);
    this.sortTimeTargets();
    return newUuid;
  }

  /**
   * 删除时间表项
   * @param uuid 要删除的时间表项的UUID
   * @returns 是否删除成功
   */
  deleteTimeTarget(uuid: UUID): boolean {
    const index = this.config.timeTargets.findIndex((t: timeTarget) => t.UUID === uuid);
    if (index === -1) {
      return false;
    }

    this.config.timeTargets.splice(index, 1);
    return true;
  }

  /**
   * 替换某一天的时间表
   * @param dayIndex 星期几（1-7）
   * @param timeTargets 新的时间表项数组
   * @returns 是否替换成功
   */
  replaceTimeTargetsForDay(
    dayIndex: 1 | 2 | 3 | 4 | 5 | 6 | 7,
    timeTargets: { startTime: string; endTime: string }[]
  ): boolean {
    // 验证所有时间格式
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    if (!timeTargets.every(t => 
      timeRegex.test(t.startTime) && timeRegex.test(t.endTime)
    )) {
      return false;
    }

    // 检查时间是否有冲突
    for (let i = 0; i < timeTargets.length; i++) {
      if (this.hasTimeConflict(timeTargets[i].startTime, timeTargets[i].endTime, timeTargets)) {
        return false;
      }
    }

    // 删除原有的时间表项
    this.config.timeTargets = this.config.timeTargets.filter((t: timeTarget) => {
      const time = new Date();
      time.setHours(parseInt(t.startTime.split(':')[0]));
      return time.getDay() !== dayIndex;
    });

    // 添加新的时间表项
    const newTimeTargets = timeTargets.map(t => ({
      UUID: this.generateUUID(),
      startTime: t.startTime,
      endTime: t.endTime,
    }));

    this.config.timeTargets.push(...newTimeTargets);
    this.sortTimeTargets();
    return true;
  }

  private hasTimeConflict(
    startTime: string,
    endTime: string,
    excludeTargets?: { startTime: string; endTime: string }[]
  ): boolean {
    const targets = excludeTargets || this.config.timeTargets;
    return targets.some((target: { startTime: string; endTime: string }) => {
      if (target.startTime === startTime || target.endTime === endTime) {
        return true;
      }
      const start1 = this.timeToMinutes(startTime);
      const end1 = this.timeToMinutes(endTime);
      const start2 = this.timeToMinutes(target.startTime);
      const end2 = this.timeToMinutes(target.endTime);
      return (start1 < end2 && end1 > start2);
    });
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private sortTimeTargets(): void {
    this.config.timeTargets.sort((a: timeTarget, b: timeTarget) =>
      a.startTime.localeCompare(b.startTime)
    );
  }
  private generateUUID(): UUID {
    return require('crypto').randomUUID();
  }

  private getWeekTypeForDate(date: Date): { weekType: "odd" | "even"; dayIndex: number } {
    const startDate = new Date(this.config.startDate);
    const timeDiff = date.getTime() - startDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(daysDiff / 7);
    const dayIndex = date.getDay() || 7; // 将周日的0转换为7

    return {
      weekType: weekNumber % 2 === 0 ? "odd" : "even",
      dayIndex,
    };
  }
}
