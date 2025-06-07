import { subjectTarget } from "../types";

export class SubjectManager {
  constructor(private config: any) {}

  /**
   * 获取所有科目列表
   * @returns {subjectTarget[]} 所有科目
   */
  getAllSubjects(): subjectTarget[] {
    return this.config.subjects;
  }

  /**
   * 根据科目名称获取科目
   * @param {string} name - 科目名称
   * @returns {subjectTarget | undefined} 匹配的科目或 undefined
   */
  getSubject(name: string): subjectTarget | undefined {
    return this.config.subjects.find((subject: subjectTarget) => subject.name === name);
  }

  /**
   * 根据科目UUID获取科目
   * @param {UUID} uuid - 科目UUID
   * @returns {subjectTarget | undefined} 匹配的科目或 undefined
   */
  createSubject(subject: subjectTarget): boolean {
    if (this.config.subjects.some((s: subjectTarget) => s.name === subject.name)) {
      return false;
    }

    this.config.subjects.push(subject);
    return true;
  }

  /**
   * 编辑科目
   * @param {string} name - 科目名称
   * @param {Partial<subjectTarget>} subject - 要更新的科目属性
   * @returns {boolean} 是否编辑成功
   */
  editSubject(name: string, subject: Partial<subjectTarget>): boolean {
    const index = this.config.subjects.findIndex((s: subjectTarget) => s.name === name);
    if (index === -1) {
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
   * @param {string} name - 科目名称
   * @returns {boolean} 是否删除成功
   */
  deleteSubject(name: string): boolean {
    const index = this.config.subjects.findIndex((s: subjectTarget) => s.name === name);
    if (index === -1) {
      return false;
    }

    this.config.subjects.splice(index, 1);
    return true;
  }
}
