import { readFileSync, writeFileSync } from "fs";
import { configType } from "./types";
import { getDefaultConfig, getWeekTypeForDate } from "./utils";
import { LessonManager } from "./managers/lessonManager";
import { SubjectManager } from "./managers/subjectManager";
import { TimeManager } from "./managers/timeManager";

/**
 * 课程表内核类，用于加载和管理课程表配置。
 *
 * @remarks
 * 构造函数会尝试读取并解析指定路径下的配置文件内容。
 * 如果文件读取失败或格式错误，会抛出异常。
 * 配置对象会与默认配置合并，确保 `timetables` 和 `subjects` 字段为数组，`startDate` 字段为 `Date` 类型。
 * 根据当前日期与配置中的 `startDate` 的天数差，自动设置 `weekMode` 属性为 "all"、"even" 或 "odd"。
 */
export class ScheduleKernel {
  /**
   * 当前课程表配置对象。
   */
  config: configType;

  /**
   * 当前周模式，可为 "odd"（单周）、"even"（双周）、"all"（全部）。
   */
  weekMode: "odd" | "even" | "all" = "all";

  /**
   * 课程管理器
   */
  lessonManager: LessonManager;

  /**
   * 科目管理器
   */
  subjectManager: SubjectManager;

  /**
   * 时间管理器
   */
  timeManager: TimeManager;

  /**
   * 构造函数，初始化配置文件路径并加载配置。
   */
  constructor(public configPath: string) {
    let raw: string;
    try {
      raw = readFileSync(this.configPath, "utf-8");
    } catch (e) {
      // 文件不存在则创建并写入默认配置
      if ((e as NodeJS.ErrnoException).code === "ENOENT") {
        const def = getDefaultConfig();
        writeFileSync(this.configPath, JSON.stringify(def, null, 2), "utf-8");
        raw = JSON.stringify(def);
      } else {
        throw new Error(
          `配置文件读取失败: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    }

    let parsed: Partial<configType> = {};
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      throw new Error(
        `配置文件格式错误: ${e instanceof Error ? e.message : String(e)}`
      );
    }

    const def = getDefaultConfig();

    this.config = {
      ...def,
      ...parsed,
      schedules: Array.isArray(parsed.schedules) ? parsed.schedules : [],
      subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [],
      startDate: parsed.startDate ? new Date(parsed.startDate) : def.startDate,
    };

    this.lessonManager = new LessonManager(this.config);
    this.subjectManager = new SubjectManager(this.config);
    this.timeManager = new TimeManager(this.config);

    this.setWeekMode(new Date());
  }

  /**
   * 设定单双周状态
   */
  setWeekMode(date: Date): void {
    const { weekType } = getWeekTypeForDate(this.config.startDate, date);
    this.weekMode = weekType;
  }


  /**
   * 保存当前配置到本地文件
   */
  saveConfig(): boolean {
    try {
      const configString = JSON.stringify(this.config, null, 2);
      writeFileSync(this.configPath, configString, "utf-8");
      return true;
    } catch (e) {
      console.error(
        `保存配置失败: ${e instanceof Error ? e.message : String(e)}`
      );
      return false;
    }
  }
}
