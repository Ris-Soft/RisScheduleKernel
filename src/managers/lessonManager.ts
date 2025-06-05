import { UUID } from "crypto";
import { lessonTaget, scheduleType, subjectTagret } from "../types";
import { getWeekTypeForDate } from "../utils";

export class LessonManager {
  constructor(private config: any) {}

  /**
   * 获取今日课程数据（已处理单双周）
   * @returns {lessonTaget[]} 今日课程数组
   */  getTodayLessons(weekMode: string): lessonTaget[] {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    // 先检查是否有临时课程安排
    if (this.config.temporarySchedules) {
      const tempSchedule = this.config.temporarySchedules.find(
        (ts: any) => ts.date === dateStr
      );
      if (tempSchedule) {
        return tempSchedule.lessons;
      }
    }

    // 如果没有临时课程，则返回正常课程
    const { dayIndex } = getWeekTypeForDate(this.config.startDate, today);
    const todaySchedule = this.config.schedules.find(
      (schedule: scheduleType) =>
        !schedule.dateMode &&
        schedule.activeDay === dayIndex &&
        (weekMode === "all" ||
          (weekMode === "odd" && schedule.activeWeek === 1) ||
          (weekMode === "even" && schedule.activeWeek === 2))
    );

    return todaySchedule?.lessons || [];
  }

  /**
   * 索引单个老师的全部课程
   */
  getTeacherLessons(teacherName: string) {
    const teacherSubjects = this.config.subjects.filter(
      (subject: subjectTagret) => subject.teacherName === teacherName
    );

    return teacherSubjects.map((subject: subjectTagret) => {
      const lessons = this.config.schedules.flatMap((schedule: scheduleType) =>
        schedule.lessons
          .map((lesson, index) => ({
            dayIndex: schedule.activeDay || 0,
            lessonIndex: index,
            schedule,
            lesson,
          }))
          .filter((item) => item.lesson.subjectUuid === subject.uuid)
      );

      return {
        subject,
        lessons,
      };
    });
  }

  /**
   * 索引某个科目的全部课程
   */
  getSubjectLessons(subjectUuid: UUID) {
    return this.config.schedules.flatMap((schedule: scheduleType) =>
      schedule.lessons
        .map((lesson, index) => ({
          dayIndex: schedule.activeDay || 0,
          lessonIndex: index,
          schedule,
          lesson,
        }))
        .filter((item) => item.lesson.subjectUuid === subjectUuid)
    );
  }

  /**
   * 编辑周几第几节次的课程
   */
  editLesson(
    dayIndex: 1 | 2 | 3 | 4 | 5 | 6 | 7,
    lessonIndex: number,
    subjectUuid: UUID,
    weekMode: string,
    week?: "odd" | "even"
  ): boolean {
    let effectiveWeek: "odd" | "even" | undefined = week;
    if (effectiveWeek === undefined) {
      if (weekMode === "odd" || weekMode === "even") {
        effectiveWeek = weekMode;
      }
    }

    const schedule = this.config.schedules.find(
      (s: scheduleType) =>
        !s.dateMode &&
        s.activeDay === dayIndex &&
        (effectiveWeek
          ? effectiveWeek === "odd"
            ? s.activeWeek === 1
            : s.activeWeek === 2
          : true)
    );

    if (!schedule || !schedule.lessons[lessonIndex]) {
      return false;
    }

    schedule.lessons[lessonIndex].subjectUuid = subjectUuid;
    return true;
  }

  /**
   * 交换两个课程
   */
  swapLessons(
    source: { dayIndex: number; lessonIndex: number; week?: "odd" | "even" },
    target: { dayIndex: number; lessonIndex: number; week?: "odd" | "even" },
    date?: Date,
    isTemporary: boolean = false
  ): boolean {
    if (date && isTemporary) {
      return this.swapTemporaryLessons(source, target, date);
    }
    return this.swapRegularLessons(source, target);
  }

  private swapTemporaryLessons(
    source: { dayIndex: number; lessonIndex: number; week?: "odd" | "even" },
    target: { dayIndex: number; lessonIndex: number; week?: "odd" | "even" },
    date: Date
  ): boolean {
    const { weekType } = this.getWeekTypeForDate(date);
    const dateStr = date.toISOString().split("T")[0];

    const sourceSchedule = this.config.schedules.find(
      (s: scheduleType) =>
        !s.dateMode &&
        s.activeDay === source.dayIndex &&
        (source.week
          ? source.week === "odd"
            ? s.activeWeek === 1
            : s.activeWeek === 2
          : s.activeWeek === (weekType === "odd" ? 1 : 2))
    );

    const targetSchedule = this.config.schedules.find(
      (s: scheduleType) =>
        !s.dateMode &&
        s.activeDay === target.dayIndex &&
        (target.week
          ? target.week === "odd"
            ? s.activeWeek === 1
            : s.activeWeek === 2
          : s.activeWeek === (weekType === "odd" ? 1 : 2))
    );

    if (
      !sourceSchedule ||
      !targetSchedule ||
      !sourceSchedule.lessons[source.lessonIndex] ||
      !targetSchedule.lessons[target.lessonIndex]
    ) {
      return false;
    }

    if (!this.config.temporarySchedules) {
      this.config.temporarySchedules = [];
    }

    let temporarySchedule = this.config.temporarySchedules.find(
      (ts: any) => ts.date === dateStr
    );

    if (!temporarySchedule) {
      const originalSchedule = this.getScheduleForDate(date);
      if (!originalSchedule) return false;

      temporarySchedule = {
        date: dateStr,
        lessons: [...originalSchedule.lessons],
        originalDayIndex: source.dayIndex,
        originalWeek: weekType === "odd" ? 1 : 2,
      };
      this.config.temporarySchedules.push(temporarySchedule);
    }

    const temp = temporarySchedule.lessons[source.lessonIndex].subjectUuid;
    temporarySchedule.lessons[source.lessonIndex].subjectUuid =
      targetSchedule.lessons[target.lessonIndex].subjectUuid;
    temporarySchedule.lessons[target.lessonIndex].subjectUuid = temp;

    return true;
  }

  private swapRegularLessons(
    source: { dayIndex: number; lessonIndex: number; week?: "odd" | "even" },
    target: { dayIndex: number; lessonIndex: number; week?: "odd" | "even" }
  ): boolean {
    const sourceSchedule = this.config.schedules.find(
      (s: scheduleType) =>
        !s.dateMode &&
        s.activeDay === source.dayIndex &&
        (source.week
          ? source.week === "odd"
            ? s.activeWeek === 1
            : s.activeWeek === 2
          : true)
    );

    const targetSchedule = this.config.schedules.find(
      (s: scheduleType) =>
        !s.dateMode &&
        s.activeDay === target.dayIndex &&
        (target.week
          ? target.week === "odd"
            ? s.activeWeek === 1
            : s.activeWeek === 2
          : true)
    );

    if (
      !sourceSchedule ||
      !targetSchedule ||
      !sourceSchedule.lessons[source.lessonIndex] ||
      !targetSchedule.lessons[target.lessonIndex]
    ) {
      return false;
    }

    const temp = sourceSchedule.lessons[source.lessonIndex].subjectUuid;
    sourceSchedule.lessons[source.lessonIndex].subjectUuid =
      targetSchedule.lessons[target.lessonIndex].subjectUuid;
    targetSchedule.lessons[target.lessonIndex].subjectUuid = temp;

    this.updateTemporarySchedules(source, target);

    return true;
  }

  private updateTemporarySchedules(
    source: { dayIndex: number; lessonIndex: number },
    target: { dayIndex: number; lessonIndex: number }
  ) {
    if (this.config.temporarySchedules) {
      this.config.temporarySchedules.forEach((ts: any) => {
        if (
          ts.originalDayIndex === source.dayIndex ||
          ts.originalDayIndex === target.dayIndex
        ) {
          const sourceIndex =
            ts.originalDayIndex === source.dayIndex
              ? source.lessonIndex
              : target.lessonIndex;
          const targetIndex =
            ts.originalDayIndex === source.dayIndex
              ? target.lessonIndex
              : source.lessonIndex;

          const tempUuid = ts.lessons[sourceIndex].subjectUuid;
          ts.lessons[sourceIndex].subjectUuid =
            ts.lessons[targetIndex].subjectUuid;
          ts.lessons[targetIndex].subjectUuid = tempUuid;
        }
      });
    }
  }

  private getWeekTypeForDate(date: Date): {
    weekType: "odd" | "even";
    dayIndex: number;
  } {
    const startDate = new Date(this.config.startDate);
    const timeDiff = date.getTime() - startDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(daysDiff / 7);
    const dayIndex = date.getDay() || 7;

    return {
      weekType: weekNumber % 2 === 0 ? "odd" : "even",
      dayIndex,
    };
  }

  private getScheduleForDate(date: Date): scheduleType | undefined {
    const { weekType, dayIndex } = this.getWeekTypeForDate(date);

    const temporarySchedule = this.config.temporarySchedules?.find(
      (ts: any) => new Date(ts.date).getTime() === date.getTime()
    );

    if (temporarySchedule) {
      return {
        dateMode: true,
        activeDate: date,
        lessons: temporarySchedule.lessons,
      };
    }

    return this.config.schedules.find(
      (s: scheduleType) =>
        !s.dateMode &&
        s.activeDay === dayIndex &&
        (weekType === "odd" ? s.activeWeek === 1 : s.activeWeek === 2)
    );
  }

  /**
   * 创建新的课节配置
   * @param dayIndex 星期几（1-7）
   * @param subjectUuid 科目UUID
   * @param week 可选的周数设置（单周/双周）
   * @returns 添加的位置索引，失败返回-1
   */
  createLesson(
    dayIndex: 1 | 2 | 3 | 4 | 5 | 6 | 7,
    subjectUuid: UUID,
    week?: "odd" | "even"
  ): number {
    const schedule = this.config.schedules.find(
      (s: scheduleType) =>
        !s.dateMode &&
        s.activeDay === dayIndex &&
        (week
          ? week === "odd"
            ? s.activeWeek === 1
            : s.activeWeek === 2
          : true)
    );

    if (!schedule) {
      const newSchedule: scheduleType = {
        dateMode: false,
        activeDay: dayIndex,
        activeWeek: week === "even" ? 2 : 1,
        lessons: [{ subjectUuid }],
      };
      this.config.schedules.push(newSchedule);
      return 0;
    }

    schedule.lessons.push({ subjectUuid });
    return schedule.lessons.length - 1;
  }

  /**
   * 在指定课节后添加新课节
   * @param dayIndex 星期几（1-7）
   * @param lessonIndex 在此课节后添加
   * @param subjectUuid 科目UUID
   * @param week 可选的周数设置（单周/双周）
   * @returns 是否添加成功
   */
  insertLessonAfter(
    dayIndex: 1 | 2 | 3 | 4 | 5 | 6 | 7,
    lessonIndex: number,
    subjectUuid: UUID,
    week?: "odd" | "even"
  ): boolean {
    const schedule = this.config.schedules.find(
      (s: scheduleType) =>
        !s.dateMode &&
        s.activeDay === dayIndex &&
        (week
          ? week === "odd"
            ? s.activeWeek === 1
            : s.activeWeek === 2
          : true)
    );

    if (!schedule || lessonIndex >= schedule.lessons.length) {
      return false;
    }

    schedule.lessons.splice(lessonIndex + 1, 0, { subjectUuid });
    return true;
  }

  /**
   * 删除课节
   * @param dayIndex 星期几（1-7）
   * @param lessonIndex 要删除的课节索引
   * @param week 可选的周数设置（单周/双周）
   * @returns 是否删除成功
   */
  deleteLesson(
    dayIndex: 1 | 2 | 3 | 4 | 5 | 6 | 7,
    lessonIndex: number,
    week?: "odd" | "even"
  ): boolean {
    const schedule = this.config.schedules.find(
      (s: scheduleType) =>
        !s.dateMode &&
        s.activeDay === dayIndex &&
        (week
          ? week === "odd"
            ? s.activeWeek === 1
            : s.activeWeek === 2
          : true)
    );

    if (!schedule || lessonIndex >= schedule.lessons.length) {
      return false;
    }

    schedule.lessons.splice(lessonIndex, 1);
    return true;
  }
}
