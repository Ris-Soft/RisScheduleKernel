# RIS Schedule Kernel

一个功能强大的课程表管理核心模块，专注于提供灵活且可扩展的课程表管理功能。

## 主要特性

- **灵活的课程管理**：支持单双周排课，灵活应对各种教学安排
- **临时调课支持**：内置临时调课机制，轻松处理特殊情况
- **多维度管理**：
  - 课程时间段管理
  - 科目信息管理
  - 教师课程关联
  - 课表导入导出
- **类型安全**：完整的 TypeScript 类型支持
- **CSES 格式支持**：支持导入/导出 CSES 课表格式

## 安装

```bash
npm install schedule-kernel
```

## 基础使用

### 初始化课程表

```typescript
import { ScheduleKernel } from 'schedule-kernel';

// 创建新的课程表实例
const kernel = new ScheduleKernel('config.json');
```

### 课程管理

```typescript
// 获取课程管理器
const lessonManager = kernel.lessonManager;

// 获取今日课程
const todayLessons = lessonManager.getTodayLessons('all');

// 编辑课程
lessonManager.editLesson(
  1,              // 星期一
  2,              // 第三节课
  subjectUuid,    // 科目UUID
  'odd'           // 单周
);

// 临时调课
lessonManager.swapLessons(
  { dayIndex: 1, lessonIndex: 0 },
  { dayIndex: 2, lessonIndex: 1 },
  new Date('2025-06-05'),
  true
);
```

### 科目管理

```typescript
const subjectManager = kernel.subjectManager;

// 创建新科目
const subjectUuid = subjectManager.createSubject({
  name: '物理',
  type: 'subject',
  teacherName: '张老师',
  shortName: '物理'
});

// 获取科目信息
const subject = subjectManager.getSubject(subjectUuid);
```

### 时间管理

```typescript
const timeManager = kernel.timeManager;

// 创建课程时间段
const timeUuid = timeManager.createTimeTarget(
  '08:00:00',  // 开始时间
  '08:45:00'   // 结束时间
);

// 获取当前课程状态
const status = timeManager.getCurrentLessonStatus();
```

## API 文档

### ScheduleKernel

核心类，用于初始化和管理整个课程表系统。

主要方法：
- `constructor(configPath: string)` - 初始化课程表
- `saveConfig(): boolean` - 保存配置到文件
- `setWeekMode(date: Date): void` - 设置单双周状态

### LessonManager

课程管理器，处理具体的课程安排。

主要方法：
- `getTodayLessons(weekMode: string): lessonTaget[]` - 获取今日课程
- `getTeacherLessons(teacherName: string)` - 获取教师课程
- `editLesson(dayIndex, lessonIndex, subjectUuid, weekMode)` - 编辑课程
- `swapLessons(source, target, date?, isTemporary?)` - 课程调换

### SubjectManager

科目管理器，处理科目相关信息。

主要方法：
- `createSubject(subject: Omit<subjectTagret, 'uuid'>)` - 创建科目
- `editSubject(uuid: UUID, subject: Partial<...>)` - 编辑科目
- `deleteSubject(uuid: UUID): boolean` - 删除科目
- `getAllSubjects(): subjectTagret[]` - 获取所有科目

### TimeManager

时间管理器，处理课程时间段。

主要方法：
- `getCurrentLessonStatus()` - 获取当前课程状态
- `createTimeTarget(startTime, endTime)` - 创建时间段
- `editTimeTarget(uuid, startTime, endTime)` - 编辑时间段
- `deleteTimeTarget(uuid): boolean` - 删除时间段

## 数据类型

```typescript
interface lessonTaget {
  subjectUuid: UUID;
  cachedName?: string;
  cachedShortName?: string;
}

interface subjectTagret {
  uuid: UUID;
  name: string;
  type: "subject" | "activity";
  shortName?: string;
  teacherName?: string;
  extra?: {
    outdoor?: boolean;
  };
}

interface timeTarget {
  UUID: UUID;
  startTime: string;  // "HH:mm:ss" 格式
  endTime: string;    // "HH:mm:ss" 格式
}
```

## 贡献代码

欢迎提交 Issue 和 Pull Request。贡献前请先阅读我们的贡献指南。

## 许可证

该项目采用 LGPL-3.0 许可证。详见 [LICENSE](LICENSE) 文件。
