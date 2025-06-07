import { UUID } from "crypto";
import { timeTarget, timeTargets } from "../types";

export class TimeManager {
  constructor(private config: any) { }

  /**
   * 获取当前时间的课程状态
   */
  getCurrentLessonStatus() {
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 8);

    // 获取当天的课程列表
    const { weekType, dayIndex } = this.getWeekTypeForDate(now);
    const todaySchedule = this.config.schedules.find(
      (s: any) =>
        !s.dateMode &&
        s.activeDay === dayIndex &&
        (weekType === "odd" ? s.activeWeek === 1 : s.activeWeek === 2)
    );
    const lessons = todaySchedule?.lessons || [];

    // 获取今天的时间段
    const timeTargetsObj = this.config.timeTargets.find((t: any) => t.id === todaySchedule?.timeTargetId);
    const targets = timeTargetsObj?.targets || [];

    // 先排序时间段
    const sortedTargets = [...targets].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );

    if (sortedTargets.length === 0) {
      return { status: "no_time_targets" as const };
    }

    if (timeStr < sortedTargets[0].startTime) {
      return {
        status: "not_started" as const,
        nextLesson: lessons[0],
        timeTarget: sortedTargets[0],
      };
    }

    for (let i = 0; i < sortedTargets.length; i++) {
      const current = sortedTargets[i];
      const next = sortedTargets[i + 1];

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
   * 编辑时间表某索引起止时间
   * @param uuid 时间表项的UUID
   * @param tragetIndex 要编辑的时间表项索引
   * @param startTime 新的开始时间 "HH:mm:ss"
   * @param endTime 新的结束时间 "HH:mm:ss"
   * @returns 是否编辑成功
   */
  editTimeTarget(uuid: UUID, tragetIndex: number, startTime: string, endTime: string): boolean {
    const timeTargets: timeTargets = this.config.timeTargets.find((t: any) => t.id === uuid);
    if (!timeTargets) {
      return false;
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return false;
    }

    timeTargets.targets[tragetIndex].startTime = startTime;
    timeTargets.targets[tragetIndex].endTime = endTime;

    return true;
  }

  /**
   * 编辑时间表项
   * @param uuid 时间表项的UUID
   * @param targets 要更新的时间表项属性
   * @returns 是否编辑成功
   */
  editTimeTargets(uuid: UUID, targets: Partial<timeTargets>): boolean {
    const index = this.config.timeTargets.findIndex((t: any) => t.id === uuid);
    const timeTargets: timeTargets = this.config.timeTargets[index];
    if (!timeTargets) {
      return false;
    }

    // 更新时间表项
    const newTargets: timeTargets = {
      ...timeTargets,
      ...targets,
    };

    this.config.timeTargets[index] = newTargets;

    return true;

  }

  /**
   * 创建新的时间表项
   * @param name 时间表项名称
   * @param target 时间表项的目标时间段
   * @return 是否创建成功
   */
  createTimeTargets(name: string, target: timeTarget): boolean {
    const newUuid: UUID = this.generateUUID();

    // 更新时间表项
    const newTargets: timeTargets = {
      id: newUuid,
      name,
      targets: [target]
    };

    this.config.timeTargets.push(newTargets);

    return true;

  }

  /**
   * 在指定时间表项后添加新的时间表项
   * @param afterUuid 在此UUID后添加
   * @param startTime 开始时间 "HH:mm:ss"
   * @param endTime 结束时间 "HH:mm:ss"
   * @returns 新创建的时间表项的UUID，如果创建失败则返回undefined
   */
  insertTimeTargetAfter(
    id: UUID,
    index: number,
    startTime: string,
    endTime: string,
  ): UUID | undefined {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return undefined;
    }

    // 检查时间是否有冲突
    if (this.hasTimeConflict(id, startTime, endTime)) {
      return undefined;
    }

    const index2 = this.config.timeTargets.findIndex((t: any) => t.id === id);
    const timeTargets: timeTargets = this.config.timeTargets[index2];

    const newUuid = this.generateUUID();
    const newTimeTarget: timeTarget = {
      startTime,
      endTime,
    };

    this.config.timeTargets[index2].targets.splice(index + 1, 0, newTimeTarget);
    this.sortTimeTargets(id);
    return newUuid;
  }

  /**
   * 删除时间表项
   * @param uuid 要删除的时间表项的UUID
   * @returns 是否删除成功
   */
  deleteTimeTargets(uuid: UUID): boolean {
    const index = this.config.timeTargets.findIndex((t: timeTargets) => t.id === uuid);
    if (index === -1) {
      return false;
    }

    this.config.timeTargets.splice(index, 1);
    return true;
  }

  /**
   * 删除时间表项中的某个时间段
   * @param uuid 时间表项的UUID
   * @param targetIndex 要删除的时间段索引
   * @returns 是否删除成功
   */
  deleteTimeTarget(uuid: UUID, targetIndex: number): boolean {
    const timeTargets: timeTargets = this.config.timeTargets.find((t: any) => t.id === uuid);
    if (!timeTargets || targetIndex < 0 || targetIndex >= timeTargets.targets.length) {
      return false;
    }
    timeTargets.targets.splice(targetIndex, 1);
    if (timeTargets.targets.length === 0) {
      // 如果没有时间段了，删除整个时间表项
      this.deleteTimeTargets(uuid);
    }
    return true;
  }

  private hasTimeConflict(
    id: UUID,
    startTime: string,
    endTime: string,
    excludeTargets?: timeTarget[]
  ): boolean {
    // 获取所有 timeTarget 类型的时间段

    const targets: timeTarget[] = excludeTargets || (
      this.config.timeTargets.find((t: timeTargets) => t.id === id)?.targets || []
    );
    return targets.some((target: timeTarget) => {
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

  private sortTimeTargets(id: UUID): void {
    const index = this.config.timeTargets.findIndex((t: any) => t.id === id);
    if (index === -1) {
      return;
    }
    this.config.timeTargets[index].targets.sort((a: timeTarget, b: timeTarget) =>
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
