import { readFileSync, writeFileSync } from "fs";
/**
 * 获取默认的课程表配置对象。
 *
 * @returns 默认的 timetableConfig 配置对象。
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
 * 课程表内核类，用于加载和管理课程表配置。
 *
 * @remarks
 * 构造函数会尝试读取并解析指定路径下的配置文件内容。
 * 如果文件读取失败或格式错误，会抛出异常。
 * 配置对象会与默认配置合并，确保 `timetables` 和 `subjects` 字段为数组，`startDate` 字段为 `Date` 类型。
 * 根据当前日期与配置中的 `startDate` 的天数差，自动设置 `weekMode` 属性为 "all"、"even" 或 "odd"。
 *
 * @example
 * ```ts
 * const kernel = new scheduleKernel('./config.json');
 * ```
 *
 * @throws {Error} 如果配置文件读取失败或格式错误。
 */
export class scheduleKernel {
    configPath;
    /**
     * 当前日期（天）。
     */
    today = new Date().getDate();
    /**
     * 当前课程表配置对象。
     */
    config;
    /**
     * 当前周模式，可为 "odd"（单周）、"even"（双周）、"all"（全部）。
     */
    weekMode = "all";
    /**
     * 构造函数，初始化配置文件路径并加载配置。
     *
     * @param configPath 配置文件路径。
     *
     * 该构造函数会尝试读取并解析指定路径下的配置文件内容。
     * 如果文件读取失败或格式错误，会抛出异常。
     * 配置对象会与默认配置合并，确保 `timetables` 和 `subjects` 字段为数组，`startDate` 字段为 `Date` 类型。
     *
     * @throws {Error} 如果配置文件读取失败或格式错误。
     */
    constructor(configPath) {
        this.configPath = configPath;
        let raw;
        try {
            raw = readFileSync(this.configPath, "utf-8");
        }
        catch (e) {
            throw new Error(`配置文件读取失败: ${e instanceof Error ? e.message : String(e)}`);
        }
        let parsed = {};
        try {
            parsed = JSON.parse(raw);
        }
        catch (e) {
            throw new Error(`配置文件格式错误: ${e instanceof Error ? e.message : String(e)}`);
        }
        const def = getDefaultConfig();
        this.config = {
            ...def,
            ...parsed,
            schedules: Array.isArray(parsed.schedules) ? parsed.schedules : [],
            subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [],
            startDate: parsed.startDate ? new Date(parsed.startDate) : def.startDate,
        };
        this.setWeekMode(this.config.startDate);
    }
    /**
     * 设定单双周状态
     * @param date - 今天的日期对象
     * @returns {void}
     * 根据当前日期与 `date` 的天数差，自动设置 `weekMode` 属性为 "all"、"even" 或 "odd"。
     * - `weekMode = "all"`：天数差为7的倍数
     * - `weekMode = "even"`：天数差为14的倍数
     * - `weekMode = "odd"`：天数差为21的倍数
     * - 其他情况默认为 "all"
     */
    setWeekMode(date) {
        const dateGap = date.getDate() - this.config.startDate.getDate();
        if (dateGap % 14 === 0) {
            this.weekMode = "odd";
        }
        else if (dateGap % 7 === 0) {
            this.weekMode = "even";
        }
        else {
            this.weekMode = "all";
        }
    }
    /**
     * 获取今日课程数据（已处理单双周）
     * @returns {lessonTaget[]} 今日课程数组
     */
    getTodayLessons() {
        const today = new Date();
        const day = today.getDay() || 7; // 将周日的0转换为7
        // 查找今天的课程表
        const todaySchedule = this.config.schedules.find((schedule) => (schedule.dateMode &&
            schedule.activeDate?.getDate() === today.getDate()) ||
            (!schedule.dateMode &&
                schedule.activeDay === day &&
                (schedule.activeWeek === undefined ||
                    (this.weekMode === "odd" && schedule.activeWeek % 2 === 1) ||
                    (this.weekMode === "even" && schedule.activeWeek % 2 === 0))));
        return todaySchedule?.lessons || [];
    }
    /**
     * 获取当前时间的课程状态
     * @returns {{
     *   status: "not_started" | "in_class" | "break" | "ended",
     *   currentLesson?: lessonTaget,
     *   nextLesson?: lessonTaget,
     *   timeTarget?: timeTarget
     * }}
     */
    getCurrentLessonStatus() {
        const now = new Date();
        const timeStr = now.toTimeString().slice(0, 8);
        const lessons = this.getTodayLessons();
        const timeTargets = this.config.timeTargets;
        // 按开始时间排序时间表
        const sortedTimeTargets = [...timeTargets].sort((a, b) => a.startTime.localeCompare(b.startTime));
        // 如果当前时间早于第一节课
        if (sortedTimeTargets[0] && timeStr < sortedTimeTargets[0].startTime) {
            return {
                status: "not_started",
                nextLesson: lessons[0],
                timeTarget: sortedTimeTargets[0],
            };
        }
        // 遍历时间段找到当前状态
        for (let i = 0; i < sortedTimeTargets.length; i++) {
            const current = sortedTimeTargets[i];
            const next = sortedTimeTargets[i + 1];
            if (timeStr >= current.startTime && timeStr <= current.endTime) {
                return {
                    status: "in_class",
                    currentLesson: lessons[i],
                    nextLesson: lessons[i + 1],
                    timeTarget: current,
                };
            }
            if (next && timeStr > current.endTime && timeStr < next.startTime) {
                return {
                    status: "break",
                    currentLesson: lessons[i],
                    nextLesson: lessons[i + 1],
                    timeTarget: next,
                };
            }
        }
        // 如果当前时间晚于最后一节课
        return {
            status: "ended",
            currentLesson: lessons[lessons.length - 1],
        };
    }
    /**
     * 获取所有科目信息
     * @returns {subjectTagret[]} 所有科目信息
     */
    getAllSubjects() {
        return this.config.subjects;
    }
    /**
     * 获取指定科目信息
     * @param uuid 科目UUID
     * @returns {subjectTagret | undefined} 科目信息
     */
    getSubject(uuid) {
        return this.config.subjects.find((subject) => subject.uuid === uuid);
    }
    /**
     * 根据科目名称获取科目UUID
     * @param name 科目名称
     * @returns {UUID | undefined} 科目UUID
     */
    getSubjectUuidByName(name) {
        return this.config.subjects.find((subject) => subject.name === name)?.uuid;
    }
    /**
     * 根据科目UUID获取科目名称
     * @param uuid 科目UUID
     * @returns {string | undefined} 科目名称
     */
    getSubjectNameByUuid(uuid) {
        return this.config.subjects.find((subject) => subject.uuid === uuid)?.name;
    }
    /**
     * 索引单个老师的全部课程
     * @param teacherName 教师姓名
     * @returns {{ subject: subjectTagret, lessons: { dayIndex: number, lessonIndex: number, schedule: schedules }[] }[]}
     */
    getTeacherLessons(teacherName) {
        const teacherSubjects = this.config.subjects.filter(subject => subject.teacherName === teacherName);
        return teacherSubjects.map(subject => {
            const lessons = this.config.schedules.flatMap(schedule => schedule.lessons
                .map((lesson, index) => ({
                dayIndex: schedule.activeDay || 0,
                lessonIndex: index,
                schedule,
                lesson
            }))
                .filter(item => item.lesson.subjectUuid === subject.uuid));
            return {
                subject,
                lessons
            };
        });
    }
    /**
     * 索引某个科目的全部课程
     * @param subjectUuid 科目UUID
     * @returns {{ dayIndex: number, lessonIndex: number, schedule: schedules }[]}
     */
    getSubjectLessons(subjectUuid) {
        return this.config.schedules.flatMap(schedule => schedule.lessons
            .map((lesson, index) => ({
            dayIndex: schedule.activeDay || 0,
            lessonIndex: index,
            schedule,
            lesson
        }))
            .filter(item => item.lesson.subjectUuid === subjectUuid));
    }
    /**
     * 编辑周几第几节次的课程
     * @param dayIndex 星期几（1-7）
     * @param lessonIndex 第几节课（0开始）
     * @param subjectUuid 新的科目UUID
     * @param week 可选，指定单双周
     * @returns {boolean} 是否修改成功
     */
    editLesson(dayIndex, lessonIndex, subjectUuid, week) {
        let effectiveWeek = week;
        if (effectiveWeek === undefined) {
            if (this.weekMode === "odd" || this.weekMode === "even") {
                effectiveWeek = this.weekMode;
            }
        }
        const schedule = this.config.schedules.find(s => !s.dateMode &&
            s.activeDay === dayIndex &&
            (effectiveWeek ? (effectiveWeek === "odd" ? s.activeWeek === 1 : s.activeWeek === 2) : true));
        if (!schedule || !schedule.lessons[lessonIndex]) {
            return false;
        }
        schedule.lessons[lessonIndex].subjectUuid = subjectUuid;
        return true;
    }
    /**
     * 交换两个课程
     * @param source 源课程位置
     * @param target 目标课程位置
     * @param date 可选，临时换课的日期
     * @param isTemporary 是否为临时换课，默认为false
     * @returns {boolean} 是否交换成功
     */
    swapLessons(source, target, date, isTemporary = false) {
        // 如果指定了日期，说明是临时换课
        if (date && isTemporary) {
            const { weekType } = this.getWeekTypeForDate(date);
            const dateStr = date.toISOString().split('T')[0];
            // 获取原始课程表
            const sourceSchedule = this.config.schedules.find(s => !s.dateMode &&
                s.activeDay === source.dayIndex &&
                (source.week ? (source.week === "odd" ? s.activeWeek === 1 : s.activeWeek === 2) : s.activeWeek === (weekType === "odd" ? 1 : 2)));
            const targetSchedule = this.config.schedules.find(s => !s.dateMode &&
                s.activeDay === target.dayIndex &&
                (target.week ? (target.week === "odd" ? s.activeWeek === 1 : s.activeWeek === 2) : s.activeWeek === (weekType === "odd" ? 1 : 2)));
            if (!sourceSchedule || !targetSchedule ||
                !sourceSchedule.lessons[source.lessonIndex] ||
                !targetSchedule.lessons[target.lessonIndex]) {
                return false;
            }
            // 初始化临时课程表数组
            if (!this.config.temporarySchedules) {
                this.config.temporarySchedules = [];
            }
            // 查找或创建临时课程表
            let temporarySchedule = this.config.temporarySchedules.find(ts => ts.date === dateStr);
            if (!temporarySchedule) {
                // 如果不存在临时课程表，创建一个新的，复制原始课程表的内容
                const originalSchedule = this.getScheduleForDate(date);
                if (!originalSchedule)
                    return false;
                temporarySchedule = {
                    date: dateStr,
                    lessons: [...originalSchedule.lessons],
                    originalDayIndex: source.dayIndex,
                    originalWeek: weekType === "odd" ? 1 : 2
                };
                this.config.temporarySchedules.push(temporarySchedule);
            }
            // 在临时课程表中交换课程
            const temp = temporarySchedule.lessons[source.lessonIndex].subjectUuid;
            temporarySchedule.lessons[source.lessonIndex].subjectUuid = targetSchedule.lessons[target.lessonIndex].subjectUuid;
            temporarySchedule.lessons[target.lessonIndex].subjectUuid = temp;
            return true;
        }
        else {
            // 非临时换课，执行原有的交换逻辑
            const sourceSchedule = this.config.schedules.find(s => !s.dateMode &&
                s.activeDay === source.dayIndex &&
                (source.week ? (source.week === "odd" ? s.activeWeek === 1 : s.activeWeek === 2) : true));
            const targetSchedule = this.config.schedules.find(s => !s.dateMode &&
                s.activeDay === target.dayIndex &&
                (target.week ? (target.week === "odd" ? s.activeWeek === 1 : s.activeWeek === 2) : true));
            if (!sourceSchedule || !targetSchedule ||
                !sourceSchedule.lessons[source.lessonIndex] ||
                !targetSchedule.lessons[target.lessonIndex]) {
                return false;
            }
            const temp = sourceSchedule.lessons[source.lessonIndex].subjectUuid;
            sourceSchedule.lessons[source.lessonIndex].subjectUuid = targetSchedule.lessons[target.lessonIndex].subjectUuid;
            targetSchedule.lessons[target.lessonIndex].subjectUuid = temp;
            // 如果存在这一天的临时课程表，也需要更新
            if (this.config.temporarySchedules) {
                this.config.temporarySchedules.forEach(ts => {
                    if (ts.originalDayIndex === source.dayIndex || ts.originalDayIndex === target.dayIndex) {
                        const sourceIndex = ts.originalDayIndex === source.dayIndex ? source.lessonIndex : target.lessonIndex;
                        const targetIndex = ts.originalDayIndex === source.dayIndex ? target.lessonIndex : source.lessonIndex;
                        const tempUuid = ts.lessons[sourceIndex].subjectUuid;
                        ts.lessons[sourceIndex].subjectUuid = ts.lessons[targetIndex].subjectUuid;
                        ts.lessons[targetIndex].subjectUuid = tempUuid;
                    }
                });
            }
            return true;
        }
    }
    /**
     * 编辑时间表
     * @param uuid 时间段UUID
     * @param startTime 开始时间
     * @param endTime 结束时间
     * @returns {boolean} 是否修改成功
     */
    editTimeTarget(uuid, startTime, endTime) {
        const timeTarget = this.config.timeTargets.find(t => t.UUID === uuid);
        if (!timeTarget) {
            return false;
        }
        // 验证时间格式
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
        if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
            return false;
        }
        timeTarget.startTime = startTime;
        timeTarget.endTime = endTime;
        return true;
    }
    /**
     * 创建新科目
     * @param subject 科目信息
     * @returns {UUID | undefined} 创建成功返回UUID，失败返回undefined
     */
    createSubject(subject) {
        // 检查是否存在同名科目
        if (this.config.subjects.some(s => s.name === subject.name)) {
            return undefined;
        }
        const newSubject = {
            ...subject,
            uuid: crypto.randomUUID()
        };
        this.config.subjects.push(newSubject);
        return newSubject.uuid;
    }
    /**
     * 编辑科目信息
     * @param uuid 科目UUID
     * @param subject 新的科目信息
     * @returns {boolean} 是否修改成功
     */
    editSubject(uuid, subject) {
        const index = this.config.subjects.findIndex(s => s.uuid === uuid);
        if (index === -1) {
            return false;
        }
        // 如果要修改名称，检查是否存在同名科目
        if (subject.name &&
            this.config.subjects.some(s => s.name === subject.name && s.uuid !== uuid)) {
            return false;
        }
        this.config.subjects[index] = {
            ...this.config.subjects[index],
            ...subject
        };
        return true;
    }
    /**
     * 删除科目
     * @param uuid 科目UUID
     * @returns {boolean} 是否删除成功
     */
    deleteSubject(uuid) {
        const index = this.config.subjects.findIndex(s => s.uuid === uuid);
        if (index === -1) {
            return false;
        }
        // 检查是否有课程正在使用此科目
        const isInUse = this.config.schedules.some(schedule => schedule.lessons.some(lesson => lesson.subjectUuid === uuid));
        if (isInUse) {
            return false;
        }
        this.config.subjects.splice(index, 1);
        return true;
    }
    /**
     * 获取指定日期对应的单双周
     * @param date 日期对象
     * @returns {{ weekType: "odd" | "even", dayIndex: number }} 单双周和星期几信息
     */
    getWeekTypeForDate(date) {
        const startDate = new Date(this.config.startDate);
        const timeDiff = date.getTime() - startDate.getTime();
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const weekNumber = Math.floor(daysDiff / 7);
        const dayIndex = date.getDay() || 7; // 将周日的0转换为7
        return {
            weekType: weekNumber % 2 === 0 ? "odd" : "even",
            dayIndex
        };
    }
    /**
     * 获取指定日期的课程安排
     * @param date 日期对象
     * @returns {scheduleType | undefined} 课程安排
     */
    getScheduleForDate(date) {
        const { weekType, dayIndex } = this.getWeekTypeForDate(date);
        // 首先查找是否存在临时课程安排
        const temporarySchedule = this.config.temporarySchedules?.find(ts => new Date(ts.date).getTime() === date.getTime());
        if (temporarySchedule) {
            return {
                dateMode: true,
                activeDate: date,
                lessons: temporarySchedule.lessons
            };
        }
        // 如果没有临时安排，返回常规课程安排
        return this.config.schedules.find(s => !s.dateMode &&
            s.activeDay === dayIndex &&
            (weekType === "odd" ? s.activeWeek === 1 : s.activeWeek === 2));
    }
    /**
     * 保存当前配置到本地文件
     * @returns {boolean} 是否保存成功
     */
    saveConfig() {
        try {
            const configString = JSON.stringify(this.config, null, 2);
            writeFileSync(this.configPath, configString, 'utf-8');
            return true;
        }
        catch (e) {
            console.error(`保存配置失败: ${e instanceof Error ? e.message : String(e)}`);
            return false;
        }
    }
}
// 导出 scheduleKernel 类
export default scheduleKernel;
// 测试代码
const kernel = new scheduleKernel("./test-config.json");
console.log("Kernel initialized successfully!");
