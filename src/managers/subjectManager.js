"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubjectManager = void 0;
class SubjectManager {
    constructor(config) {
        this.config = config;
    }
    /**
     * 获取所有科目信息
     */
    getAllSubjects() {
        return this.config.subjects;
    }
    /**
     * 获取指定科目信息
     */
    getSubject(uuid) {
        return this.config.subjects.find((subject) => subject.uuid === uuid);
    }
    /**
     * 根据科目名称获取科目UUID
     */
    getSubjectUuidByName(name) {
        var _a;
        return (_a = this.config.subjects.find((subject) => subject.name === name)) === null || _a === void 0 ? void 0 : _a.uuid;
    }
    /**
     * 根据科目UUID获取科目名称
     */
    getSubjectNameByUuid(uuid) {
        var _a;
        return (_a = this.config.subjects.find((subject) => subject.uuid === uuid)) === null || _a === void 0 ? void 0 : _a.name;
    }
    /**
     * 创建新科目
     */
    createSubject(subject) {
        if (this.config.subjects.some((s) => s.name === subject.name)) {
            return undefined;
        }
        const newSubject = Object.assign(Object.assign({}, subject), { uuid: crypto.randomUUID() });
        this.config.subjects.push(newSubject);
        return newSubject.uuid;
    }
    /**
     * 编辑科目信息
     */
    editSubject(uuid, subject) {
        const index = this.config.subjects.findIndex((s) => s.uuid === uuid);
        if (index === -1) {
            return false;
        }
        if (subject.name &&
            this.config.subjects.some((s) => s.name === subject.name && s.uuid !== uuid)) {
            return false;
        }
        this.config.subjects[index] = Object.assign(Object.assign({}, this.config.subjects[index]), subject);
        return true;
    }
    /**
     * 删除科目
     */
    deleteSubject(uuid) {
        const index = this.config.subjects.findIndex((s) => s.uuid === uuid);
        if (index === -1) {
            return false;
        }
        const isInUse = this.config.schedules.some((schedule) => schedule.lessons.some((lesson) => lesson.subjectUuid === uuid));
        if (isInUse) {
            return false;
        }
        this.config.subjects.splice(index, 1);
        return true;
    }
}
exports.SubjectManager = SubjectManager;
