import { ScheduleKernel } from './dist';

// 测试初始化
const kernel = new ScheduleKernel('./test-config.json');
console.log('配置加载成功:', kernel.config);

// 测试获取今日课程
const lessons = kernel.getTodayLessons();
console.log('今日课程:', lessons);
