import { UUID, randomUUID } from "crypto";
import * as yaml from 'js-yaml';
import { configType, subjectTarget, timeTarget, lessonTarget, scheduleType, timeTargets } from "../types";

interface CsesSubject {
    name: string;
    simplified_name?: string;
    teacher?: string;
    room?: string;
}

interface CsesClass {
    subject: string;
    start_time: string;
    end_time: string;
}

interface CsesSchedule {
    name: string;
    enable_day: number;
    weeks: 'all' | 'odd' | 'even';
    classes: CsesClass[];
}

interface CsesConfig {
    version: 1;
    subjects: CsesSubject[];
    schedules: CsesSchedule[];
}

export class CsesTransformer {
    /**
     * 将CSES文件内容转换为内部配置格式
     */
    public static fromCses(content: string): configType {
        const csesData = yaml.load(content) as CsesConfig;

        if (csesData.version !== 1) {
            throw new Error('不支持的CSES版本');
        }

        // 转换科目
        const subjects: subjectTarget[] = csesData.subjects.map(subject => ({
            uuid: randomUUID() as UUID,
            name: subject.name,
            type: 'subject' as const,
            shortName: subject.simplified_name,
            teacherName: subject.teacher,
            extra: { outdoor: false }
        }));

        let times: timeTargets[] = [];
        // 创建时间表（所有不重复的时间段）
        csesData.schedules.forEach((schedule, index) => {
            let Times: timeTarget[] = [];
            schedule.classes.forEach(cls => {
                const startTime = cls.start_time;
                const endTime = cls.end_time;
                let timetarget: timeTarget = {
                    startTime: startTime,
                    endTime: endTime
                };
                Times.push(timetarget);
            });
            let timeTargets: timeTargets = {
                id: randomUUID() as UUID,
                name: '未命名时间表 ' + (index + 1),
                targets: Times
            }
            times.push(timeTargets);
        });


        // 转换课程表
        const schedules: scheduleType[] = [];
        csesData.schedules.forEach((schedule, index) => {
            // 创建课程列表
            const lessons = schedule.classes.map(cls => {
                const subject = subjects.find(s => s.name === cls.subject);
                if (!subject) {
                    throw new Error(`未找到科目: ${cls.subject}`);
                }

                const timeTargetName = '未命名时间表 ' + (index + 1);
                const timeTargetsFound = times.find(t => t.name === timeTargetName);
                if (!timeTargetsFound) {
                    throw new Error(`未找到时间表: ${timeTargetName}`);
                }

                return {
                    subjectName: subject.name,
                    timeUuid: timeTargetsFound.id
                } as lessonTarget;
            });

            // 根据weeks字段创建对应的课程表
            if (schedule.weeks === 'all') {
                schedules.push({
                    dateMode: false,
                    activeDay: schedule.enable_day,
                    activeWeek: 1,
                    lessons
                });
                schedules.push({
                    dateMode: false,
                    activeDay: schedule.enable_day,
                    activeWeek: 2,
                    lessons
                });
            } else {
                schedules.push({
                    dateMode: false,
                    activeDay: schedule.enable_day,
                    activeWeek: schedule.weeks === 'odd' ? 1 : 2,
                    lessons
                });
            }
        });

        return {
            version: '1.0',
            startDate: new Date(),
            schedules,
            subjects,
            timeTargets: times,
        };
    }

    /**
     * 将内部配置格式转换为CSES文件内容
     */
    public static toCses(config: configType): string {
        const csesSubjects: CsesSubject[] = config.subjects.map(subject => ({
            name: subject.name,
            simplified_name: subject.shortName,
            teacher: subject.teacherName
        }));

        // 按天和周数组织课程
        const scheduleMap = new Map<string, CsesSchedule>();
        config.schedules.forEach(schedule => {
            if (schedule.dateMode) return; // 跳过日期模式的课程

            const day = schedule.activeDay!;
            const week = schedule.activeWeek === 1 ? 'odd' : 'even';
            const key = `${day}-${week}`;

            const lessons: CsesClass[] = schedule.lessons.map((lesson, index) => {
                const timeTarget = config.timeTargets.find(t => t.id === schedule.timeUuid);
                if (!timeTarget) {
                    throw new Error(`未找到时间段: ${schedule.timeUuid}`);
                }
                return {
                    subject: lesson.subjectName,
                    start_time: timeTarget.targets[index].startTime,
                    end_time: timeTarget.targets[index].endTime
                };
            });

            if (scheduleMap.has(key)) {
                scheduleMap.get(key)!.classes.push(...lessons);
            } else {
                scheduleMap.set(key, {
                    name: `星期${['一', '二', '三', '四', '五', '六', '日'][day - 1]}-${week === 'odd' ? '单周' : '双周'}`,
                    enable_day: day,
                    weeks: week as 'odd' | 'even',
                    classes: lessons
                });
            }
        });

        // 合并相同天的单双周课程（如果课程表完全相同）
        const mergedSchedules: CsesSchedule[] = [];
        const daySchedules = new Map<number, CsesSchedule[]>();

        // 按天分组
        for (const schedule of scheduleMap.values()) {
            const existingSchedules = daySchedules.get(schedule.enable_day) || [];
            existingSchedules.push(schedule);
            daySchedules.set(schedule.enable_day, existingSchedules);
        }

        // 检查每天的单双周课程是否相同，如果相同则合并
        for (const [day, schedules] of daySchedules.entries()) {
            if (schedules.length === 2) {
                const [schedule1, schedule2] = schedules;
                if (JSON.stringify(schedule1.classes) === JSON.stringify(schedule2.classes)) {
                    // 课程完全相同，合并为all
                    mergedSchedules.push({
                        name: `星期${['一', '二', '三', '四', '五', '六', '日'][day - 1]}`,
                        enable_day: day,
                        weeks: 'all',
                        classes: schedule1.classes
                    });
                } else {
                    // 课程不同，保持分开
                    mergedSchedules.push(...schedules);
                }
            } else {
                // 只有一个课程表，直接添加
                mergedSchedules.push(...schedules);
            }
        }

        const csesConfig: CsesConfig = {
            version: 1,
            subjects: csesSubjects,
            schedules: mergedSchedules
        };

        return yaml.dump(csesConfig, {
            indent: 2,
            lineWidth: -1,
            sortKeys: false,
            forceQuotes: true
        });
    }
}