import { UUID } from "crypto";
import { subjectTagret } from "../types";

export class SubjectManager {
  constructor(private config: any) {}

  /**
   * 获取所有科目信息
   */
  getAllSubjects(): subjectTagret[] {
    return this.config.subjects;
  }

  /**
   * 获取指定科目信息
   */
  getSubject(uuid: UUID): subjectTagret | undefined {
    return this.config.subjects.find((subject: subjectTagret) => subject.uuid === uuid);
  }

  /**
   * 根据科目名称获取科目UUID
   */
  getSubjectUuidByName(name: string): UUID | undefined {
    return this.config.subjects.find((subject: subjectTagret) => subject.name === name)?.uuid;
  }

  /**
   * 根据科目UUID获取科目名称
   */
  getSubjectNameByUuid(uuid: UUID): string | undefined {
    return this.config.subjects.find((subject: subjectTagret) => subject.uuid === uuid)?.name;
  }

  /**
   * 创建新科目
   */
  createSubject(subject: Omit<subjectTagret, 'uuid'>): UUID | undefined {
    if (this.config.subjects.some((s: subjectTagret) => s.name === subject.name)) {
      return undefined;
    }

    const newSubject: subjectTagret = {
      ...subject,
      uuid: crypto.randomUUID() as UUID
    };

    this.config.subjects.push(newSubject);
    return newSubject.uuid;
  }

  /**
   * 编辑科目信息
   */
  editSubject(uuid: UUID, subject: Partial<Omit<subjectTagret, 'uuid'>>): boolean {
    const index = this.config.subjects.findIndex((s: subjectTagret) => s.uuid === uuid);
    if (index === -1) {
      return false;
    }

    if (subject.name && 
        this.config.subjects.some((s: subjectTagret) => s.name === subject.name && s.uuid !== uuid)) {
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
    const index = this.config.subjects.findIndex((s: subjectTagret) => s.uuid === uuid);
    if (index === -1) {
      return false;
    }

    const isInUse = this.config.schedules.some((schedule: any) =>
      schedule.lessons.some((lesson: any) => lesson.subjectUuid === uuid)
    );

    if (isInUse) {
      return false;
    }

    this.config.subjects.splice(index, 1);
    return true;
  }
}
