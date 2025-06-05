import { UUID } from "crypto";
import { subjectTarget } from "../types";

export class SubjectManager {
  constructor(private config: any) {}

  /**
   * 获取所有科目信息
   */
  getAllSubjects(): subjectTarget[] {
    return this.config.subjects;
  }

  /**
   * 获取指定科目信息
   */
  getSubject(uuid: UUID): subjectTarget | undefined {
    return this.config.subjects.find((subject: subjectTarget) => subject.uuid === uuid);
  }

  /**
   * 根据科目名称获取科目UUID
   */
  getSubjectUuidByName(name: string): UUID | undefined {
    return this.config.subjects.find((subject: subjectTarget) => subject.name === name)?.uuid;
  }

  /**
   * 根据科目UUID获取科目名称
   */
  getSubjectNameByUuid(uuid: UUID): string | undefined {
    return this.config.subjects.find((subject: subjectTarget) => subject.uuid === uuid)?.name;
  }

  /**
   * 创建新科目
   */
  createSubject(subject: Omit<subjectTarget, 'uuid'>): UUID | undefined {
    if (this.config.subjects.some((s: subjectTarget) => s.name === subject.name)) {
      return undefined;
    }

    const newSubject: subjectTarget = {
      ...subject,
      uuid: crypto.randomUUID() as UUID
    };

    this.config.subjects.push(newSubject);
    return newSubject.uuid;
  }

  /**
   * 编辑科目信息
   */
  editSubject(uuid: UUID, subject: Partial<Omit<subjectTarget, 'uuid'>>): boolean {
    const index = this.config.subjects.findIndex((s: subjectTarget) => s.uuid === uuid);
    if (index === -1) {
      return false;
    }

    if (subject.name && 
        this.config.subjects.some((s: subjectTarget) => s.name === subject.name && s.uuid !== uuid)) {
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
   */
  deleteSubject(uuid: UUID): boolean {
    const index = this.config.subjects.findIndex((s: subjectTarget) => s.uuid === uuid);
    if (index === -1) {
      return false;
    }    // 检查常规课程表中的使用情况
    const isInUse = this.config.schedules.some((schedule: any) =>
      schedule.lessons.some((lesson: any) => lesson.subjectUuid === uuid)
    );

    // 检查临时课程表中的使用情况
    const isInTemporary = this.config.temporarySchedules?.some((schedule: any) =>
      schedule.lessons.some((lesson: any) => lesson.subjectUuid === uuid)
    );

    if (isInUse || isInTemporary) {
      return false;
    }

    this.config.subjects.splice(index, 1);
    return true;
  }
}
