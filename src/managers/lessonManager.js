"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LessonManager = void 0;
class LessonManager {
    constructor(config) {
        this.config = config;
    }
    /**
     * 获取今日课程数据（已处理单双周）
     * @returns {lessonTaget[]} 今日课程数组
     */
    getTodayLessons(weekMode) {
        const today = new Date();
        const day = today.getDay() || 7; // 将周日的0转换为7
        // 查找今天的课程表
        const todaySchedule = this.config.schedules.find((schedule) => {
            var _a;
            return (schedule.dateMode &&
                ((_a = schedule.activeDate) === null || _a === void 0 ? void 0 : _a.getDate()) === today.getDate()) ||
                (!schedule.dateMode &&
                    schedule.activeDay === day &&
                    (schedule.activeWeek === undefined ||
                        (weekMode === "odd" && schedule.activeWeek % 2 === 1) ||
                        (weekMode === "even" && schedule.activeWeek % 2 === 0)));
        });
        return (todaySchedule === null || todaySchedule === void 0 ? void 0 : todaySchedule.lessons) || [];
    }
    /**
     * 索引单个老师的全部课程
     */
    getTeacherLessons(teacherName) {
        const teacherSubjects = this.config.subjects.filter((subject) => subject.teacherName === teacherName);
        return teacherSubjects.map((subject) => {
            const lessons = this.config.schedules.flatMap((schedule) => schedule.lessons
                .map((lesson, index) => ({
                dayIndex: schedule.activeDay || 0,
                lessonIndex: index,
                schedule,
                lesson,
            }))
                .filter((item) => item.lesson.subjectUuid === subject.uuid));
            return {
                subject,
                lessons,
            };
        });
    }
    /**
     * 索引某个科目的全部课程
     */
    getSubjectLessons(subjectUuid) {
        return this.config.schedules.flatMap((schedule) => schedule.lessons
            .map((lesson, index) => ({
            dayIndex: schedule.activeDay || 0,
            lessonIndex: index,
            schedule,
            lesson,
        }))
            .filter((item) => item.lesson.subjectUuid === subjectUuid));
    }
    /**
     * 编辑周几第几节次的课程
     */
    editLesson(dayIndex, lessonIndex, subjectUuid, weekMode, week) {
        let effectiveWeek = week;
        if (effectiveWeek === undefined) {
            if (weekMode === "odd" || weekMode === "even") {
                effectiveWeek = weekMode;
            }
        }
        const schedule = this.config.schedules.find((s) => !s.dateMode &&
            s.activeDay === dayIndex &&
            (effectiveWeek
                ? effectiveWeek === "odd"
                    ? s.activeWeek === 1
                    : s.activeWeek === 2
                : true));
        if (!schedule || !schedule.lessons[lessonIndex]) {
            return false;
        }
        schedule.lessons[lessonIndex].subjectUuid = subjectUuid;
        return true;
    }
    /**
     * 交换两个课程
     */
    swapLessons(source, target, date, isTemporary = false) {
        if (date && isTemporary) {
            return this.swapTemporaryLessons(source, target, date);
        }
        return this.swapRegularLessons(source, target);
    }
    swapTemporaryLessons(source, target, date) {
        const { weekType } = this.getWeekTypeForDate(date);
        const dateStr = date.toISOString().split("T")[0];
        const sourceSchedule = this.config.schedules.find((s) => !s.dateMode &&
            s.activeDay === source.dayIndex &&
            (source.week
                ? source.week === "odd"
                    ? s.activeWeek === 1
                    : s.activeWeek === 2
                : s.activeWeek === (weekType === "odd" ? 1 : 2)));
        const targetSchedule = this.config.schedules.find((s) => !s.dateMode &&
            s.activeDay === target.dayIndex &&
            (target.week
                ? target.week === "odd"
                    ? s.activeWeek === 1
                    : s.activeWeek === 2
                : s.activeWeek === (weekType === "odd" ? 1 : 2)));
        if (!sourceSchedule ||
            !targetSchedule ||
            !sourceSchedule.lessons[source.lessonIndex] ||
            !targetSchedule.lessons[target.lessonIndex]) {
            return false;
        }
        if (!this.config.temporarySchedules) {
            this.config.temporarySchedules = [];
        }
        let temporarySchedule = this.config.temporarySchedules.find((ts) => ts.date === dateStr);
        if (!temporarySchedule) {
            const originalSchedule = this.getScheduleForDate(date);
            if (!originalSchedule)
                return false;
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
    swapRegularLessons(source, target) {
        const sourceSchedule = this.config.schedules.find((s) => !s.dateMode &&
            s.activeDay === source.dayIndex &&
            (source.week
                ? source.week === "odd"
                    ? s.activeWeek === 1
                    : s.activeWeek === 2
                : true));
        const targetSchedule = this.config.schedules.find((s) => !s.dateMode &&
            s.activeDay === target.dayIndex &&
            (target.week
                ? target.week === "odd"
                    ? s.activeWeek === 1
                    : s.activeWeek === 2
                : true));
        if (!sourceSchedule ||
            !targetSchedule ||
            !sourceSchedule.lessons[source.lessonIndex] ||
            !targetSchedule.lessons[target.lessonIndex]) {
            return false;
        }
        const temp = sourceSchedule.lessons[source.lessonIndex].subjectUuid;
        sourceSchedule.lessons[source.lessonIndex].subjectUuid =
            targetSchedule.lessons[target.lessonIndex].subjectUuid;
        targetSchedule.lessons[target.lessonIndex].subjectUuid = temp;
        this.updateTemporarySchedules(source, target);
        return true;
    }
    updateTemporarySchedules(source, target) {
        if (this.config.temporarySchedules) {
            this.config.temporarySchedules.forEach((ts) => {
                if (ts.originalDayIndex === source.dayIndex ||
                    ts.originalDayIndex === target.dayIndex) {
                    const sourceIndex = ts.originalDayIndex === source.dayIndex
                        ? source.lessonIndex
                        : target.lessonIndex;
                    const targetIndex = ts.originalDayIndex === source.dayIndex
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
    getWeekTypeForDate(date) {
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
    getScheduleForDate(date) {
        var _a;
        const { weekType, dayIndex } = this.getWeekTypeForDate(date);
        const temporarySchedule = (_a = this.config.temporarySchedules) === null || _a === void 0 ? void 0 : _a.find((ts) => new Date(ts.date).getTime() === date.getTime());
        if (temporarySchedule) {
            return {
                dateMode: true,
                activeDate: date,
                lessons: temporarySchedule.lessons,
            };
        }
        return this.config.schedules.find((s) => !s.dateMode &&
            s.activeDay === dayIndex &&
            (weekType === "odd" ? s.activeWeek === 1 : s.activeWeek === 2));
    }
}
exports.LessonManager = LessonManager;
