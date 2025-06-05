import { UUID } from "crypto";

export class TimeManager {
  constructor(private config: any) {}

  /**
   * 获取当前时间的课程状态
   */
  getCurrentLessonStatus() {
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 8);
    const lessons = this.config.lessons || [];
    const timeTargets = this.config.timeTargets;

    const sortedTimeTargets = [...timeTargets].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );

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
}
