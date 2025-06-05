"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleKernel = void 0;
const fs_1 = require("fs");
const utils_1 = require("./utils");
const lessonManager_1 = require("./managers/lessonManager");
const subjectManager_1 = require("./managers/subjectManager");
const timeManager_1 = require("./managers/timeManager");
/**
 * 课程表内核类，用于加载和管理课程表配置。
 *
 * @remarks
 * 构造函数会尝试读取并解析指定路径下的配置文件内容。
 * 如果文件读取失败或格式错误，会抛出异常。
 * 配置对象会与默认配置合并，确保 `timetables` 和 `subjects` 字段为数组，`startDate` 字段为 `Date` 类型。
 * 根据当前日期与配置中的 `startDate` 的天数差，自动设置 `weekMode` 属性为 "all"、"even" 或 "odd"。
 */
class ScheduleKernel {
    /**
     * 构造函数，初始化配置文件路径并加载配置。
     */
    constructor(configPath) {
        this.configPath = configPath;
        /**
         * 当前周模式，可为 "odd"（单周）、"even"（双周）、"all"（全部）。
         */
        this.weekMode = "all";
        // 委托到 LessonManager 的方法
        this.getTodayLessons = () => this.lessonManager.getTodayLessons(this.weekMode);
        this.getTeacherLessons = (teacherName) => this.lessonManager.getTeacherLessons(teacherName);
        this.getSubjectLessons = (subjectUuid) => this.lessonManager.getSubjectLessons(subjectUuid);
        this.editLesson = (dayIndex, lessonIndex, subjectUuid, week) => this.lessonManager.editLesson(dayIndex, lessonIndex, subjectUuid, this.weekMode, week);
        this.swapLessons = (source, target, date, isTemporary = false) => this.lessonManager.swapLessons(source, target, date, isTemporary);
        // 委托到 SubjectManager 的方法
        this.getAllSubjects = () => this.subjectManager.getAllSubjects();
        this.getSubject = (uuid) => this.subjectManager.getSubject(uuid);
        this.getSubjectUuidByName = (name) => this.subjectManager.getSubjectUuidByName(name);
        this.getSubjectNameByUuid = (uuid) => this.subjectManager.getSubjectNameByUuid(uuid);
        this.createSubject = (subject) => this.subjectManager.createSubject(subject);
        this.editSubject = (uuid, subject) => this.subjectManager.editSubject(uuid, subject);
        this.deleteSubject = (uuid) => this.subjectManager.deleteSubject(uuid);
        // 委托到 TimeManager 的方法
        this.getCurrentLessonStatus = () => this.timeManager.getCurrentLessonStatus();
        this.editTimeTarget = (uuid, startTime, endTime) => this.timeManager.editTimeTarget(uuid, startTime, endTime);
        let raw;
        try {
            raw = (0, fs_1.readFileSync)(this.configPath, "utf-8");
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
        const def = (0, utils_1.getDefaultConfig)();
        // Ensure groupUuid matches the template literal type (UUID format)
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        const groupUuid = typeof parsed.groupUuid === "string" && uuidRegex.test(parsed.groupUuid)
            ? parsed.groupUuid
            : def.groupUuid;
        this.config = Object.assign(Object.assign(Object.assign({}, def), parsed), { groupUuid, schedules: Array.isArray(parsed.schedules) ? parsed.schedules : [], subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [], startDate: parsed.startDate ? new Date(parsed.startDate) : def.startDate });
        this.lessonManager = new lessonManager_1.LessonManager(this.config);
        this.subjectManager = new subjectManager_1.SubjectManager(this.config);
        this.timeManager = new timeManager_1.TimeManager(this.config);
        this.setWeekMode(new Date());
    }
    /**
     * 设定单双周状态
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
     * 保存当前配置到本地文件
     */
    saveConfig() {
        try {
            const configString = JSON.stringify(this.config, null, 2);
            (0, fs_1.writeFileSync)(this.configPath, configString, "utf-8");
            return true;
        }
        catch (e) {
            console.error(`保存配置失败: ${e instanceof Error ? e.message : String(e)}`);
            return false;
        }
    }
}
exports.ScheduleKernel = ScheduleKernel;
