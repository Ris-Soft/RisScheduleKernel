# RIS Schedule Kernel

这是一个用于管理和显示课程表的核心模块。

## 安装

```bash
npm install ris-schedule-kernel
```

## 使用方法

```typescript
import { ScheduleKernel, LessonManager, SubjectManager, TimeManager } from 'ris-schedule-kernel';

// 创建新的课程表实例
const kernel = new ScheduleKernel(config);

// 获取课程管理器
const lessonManager = kernel.getLessonManager();

// 获取今日课程
const todayLessons = lessonManager.getTodayLessons('all');
```

## 主要功能

- 支持单双周排课
- 支持临时调课
- 支持课程和时间段管理
- 支持教师课程查询
- TypeScript 类型支持

## API 文档

### ScheduleKernel

课程表核心类，用于管理整个课程表系统。

### LessonManager

课程管理器，用于管理具体的课程安排。

### SubjectManager

科目管理器，用于管理科目信息。

### TimeManager

时间管理器，用于管理课程时间段。

## 许可证

MIT
