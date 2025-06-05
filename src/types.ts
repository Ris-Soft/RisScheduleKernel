import { UUID } from "crypto";

/**
 * 表示一节课程，包括开始时间、结束时间和关联的科目UUID。
 *
 * @property subjectUuid - 课程对应科目的唯一标识符(UUID)。
 * @property cachedName - 可选属性，缓存的课程名称。
 * @property cachedShortName - 可选属性，缓存的课程短名称。
 */
export interface lessonTaget {
  subjectUuid: UUID;
  cachedName?: string; // 可选属性，缓存的课程名称
  cachedShortName?: string; // 可选属性，缓存的课程短名称
}

/**
 * 表示一个科目，包括唯一标识符、名称、教师姓名和额外信息。
 *
 * @property uuid - 科目的唯一标识符(UUID)。
 * @property name - 科目名称。
 * @property type - 科目类型，可以是 "subject" 或 "activity"。
 * @property shortName - 可选属性，科目的短名称。
 * @property teacherName - 教师姓名。
 * @property extra - 额外信息，如是否为户外课程。
 */
export interface subjectTagret {
  uuid: UUID;
  name: string;
  type: "subject" | "activity"; // activity 下不会显示在列表中，但是会显示当前课程状态
  shortName?: string; // 可选属性，短名称
  teacherName?: string;
  extra?: {
    outdoor?: boolean;
  };
}

/**
 * 表示一个时间段，包括开始时间和结束时间。
 * 时间格式为 "HH:mm:ss"。
 * @property startTime - 开始时间，格式为 "HH:mm:ss"。
 * @property endTime - 结束时间，格式为 "HH:mm:ss"。
 */
export interface timeTarget {
  UUID: UUID; // 唯一标识符(UUID)
  startTime: string; // 开始时间，格式为 "HH:mm:ss"
  endTime: string; // 结束时间，格式为 "HH:mm:ss"
}

/**
 * 临时课程安排，用于特定日期的临时换课
 */
export interface temporarySchedule {
  date: string; // 日期，格式为 "YYYY-MM-DD"
  lessons: lessonTaget[];
  originalDayIndex: number; // 原始星期几（1-7）
  originalWeek: number; // 原始周数（1或2，对应单双周）
}

/**
 * 表示一个课程表，包括课程列表和日期模式等信息。
 */
export interface scheduleType {
  dateMode: boolean; // 是否为日期模式
  activeDate?: Date; // 日期模式下的具体日期
  activeDay?: number; // 非日期模式下的星期几（1-7）
  activeWeek?: number; // 非日期模式下的周数（1,2 分别对应单双周）
  lessons: lessonTaget[]; // 课程列表
}

/**
 * 课程表配置类型
 */
export interface configType {
  version: string;
  groupName?: string;
  groupUuid: UUID;
  startDate: Date;
  schedules: scheduleType[];
  subjects: subjectTagret[];
  timeTargets: timeTarget[];
  temporarySchedules?: temporarySchedule[]; // 临时课程安排
}
