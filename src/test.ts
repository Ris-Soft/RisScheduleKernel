import { ScheduleKernel } from "./index";

/**
 * 示例：如何使用 ScheduleKernel
 */

// 假设有一个配置文件路径
const configPath = "./config.json";

// 创建课程表内核实例
const kernel = new ScheduleKernel(configPath);

// 获取今天的课程
const todayLessons = kernel.getTodayLessons();
console.log("今日课程：", todayLessons);

// 获取所有科目
const subjects = kernel.getAllSubjects();
console.log("所有科目：", subjects);

// 新建一个科目
const newSubjectUuid = kernel.createSubject({
  name: "物理",
  teacherName: "张老师",
  type: "subject",
  shortName: "物理",
});
console.log("新建科目UUID：", newSubjectUuid);

// 编辑课程（如将周一第一节课改为新科目）
if (newSubjectUuid) {
  const editResult = kernel.editLesson(1, 0, newSubjectUuid);
  console.log("编辑课程结果：", editResult);
}

// 保存配置
const saveResult = kernel.saveConfig();
console.log("保存配置结果：", saveResult);