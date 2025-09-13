// 上海宋庆龄学校 2025-2026 学年校历数据

export interface CalendarEvent {
  date: string; // YYYY-MM-DD 格式
  type: 'teacher-work' | 'holiday' | 'work-holiday' | 'parent-meeting' | 'school-activity' | 'exam';
  title: string;
  description?: string;
}

// 日历事件类型配置
export const eventTypeConfig = {
  'teacher-work': {
    color: 'bg-blue-500',
    textColor: 'text-blue-600',
    label: '教师工作日'
  },
  'holiday': {
    color: 'bg-gray-400',
    textColor: 'text-gray-600',
    label: '假期'
  },
  'work-holiday': {
    color: 'bg-orange-500',
    textColor: 'text-orange-600',
    label: '工作日-国定假日调整'
  },
  'parent-meeting': {
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600',
    label: '家长开放日/见面会'
  },
  'school-activity': {
    color: 'bg-green-500',
    textColor: 'text-green-600',
    label: '学校活动'
  },
  'exam': {
    color: 'bg-purple-500',
    textColor: 'text-purple-600',
    label: '考试'
  }
};

// 2025-2026学年校历事件数据
export const calendarEvents: CalendarEvent[] = [
  // 八月
  { date: '2025-08-25', type: 'teacher-work', title: '中国部全体教师培训会', description: '全体教师研讨日' },
  { date: '2025-08-26', type: 'teacher-work', title: '高一国际教育' },
  { date: '2025-08-29', type: 'teacher-work', title: '开学典礼' },
  
  // 九月
  { date: '2025-09-01', type: 'school-activity', title: '中国部学生开学第一天' },
  { date: '2025-09-01', type: 'school-activity', title: '安全教育周' },
  { date: '2025-09-06', type: 'parent-meeting', title: 'Orientation Week' },
  { date: '2025-09-08', type: 'school-activity', title: '校园活动大会' },
  { date: '2025-09-12', type: 'school-activity', title: '校园、社团活动开始' },
  { date: '2025-09-23', type: 'school-activity', title: '家长沙龙' },
  { date: '2025-09-26', type: 'school-activity', title: '国庆快闪（如遇雨天改期到29日）' },
  { date: '2025-09-28', type: 'work-holiday', title: '工作日（中秋国庆节假日调整）' },
  
  // 十月
  { date: '2025-10-01', type: 'holiday', title: '中秋国庆节假期' },
  { date: '2025-10-08', type: 'holiday', title: '中秋国庆节假期' },
  { date: '2025-10-09', type: 'school-activity', title: '学生会换届选举大会' },
  { date: '2025-10-18', type: 'exam', title: 'ACT考试' },
  { date: '2025-10-24', type: 'school-activity', title: '阅读周' },
  { date: '2025-10-28', type: 'school-activity', title: '运动会（雨天改期至11/4）' },
  
  // 十一月
  { date: '2025-11-11', type: 'school-activity', title: '家长沙龙' },
  { date: '2025-11-14', type: 'exam', title: '期中考试' },
  { date: '2025-11-17', type: 'exam', title: '期中考试' },
  { date: '2025-11-18', type: 'exam', title: '期中考试' },
  { date: '2025-11-19', type: 'school-activity', title: '秋游' },
  { date: '2025-11-17', type: 'school-activity', title: '科技节' },
  { date: '2025-11-28', type: 'school-activity', title: '家长会' },
  
  // 十二月
  { date: '2025-12-13', type: 'exam', title: 'ACT考试' },
  { date: '2025-12-22', type: 'school-activity', title: 'Spirit Week' },
  { date: '2025-12-25', type: 'school-activity', title: '圣诞日活动' },
  { date: '2025-12-31', type: 'school-activity', title: '新年联欢会' },
  
  // 一月
  { date: '2026-01-01', type: 'holiday', title: '元旦假期' },
  { date: '2026-01-03', type: 'school-activity', title: '毕业展（高三）' },
  { date: '2026-01-20', type: 'exam', title: '期末考试' },
  { date: '2026-01-30', type: 'school-activity', title: '寒假、学年第一学期结束' },
  { date: '2026-01-31', type: 'holiday', title: '中国教师结束一工作日' },
  
  // 二月
  { date: '2026-02-26', type: 'school-activity', title: '全体教师返校' },
  
  // 三月
  { date: '2026-03-02', type: 'school-activity', title: '第二学期开学第一天' },
  { date: '2026-03-06', type: 'school-activity', title: '安全教育周' },
  { date: '2026-03-09', type: 'school-activity', title: '校园、社团活动开始' },
  { date: '2026-03-24', type: 'school-activity', title: '家长办法' },
  { date: '2026-03-30', type: 'school-activity', title: '清明节放假' },
  
  // 四月
  { date: '2026-04-03', type: 'holiday', title: '清明节放假' },
  { date: '2026-04-09', type: 'exam', title: 'AP模考' },
  { date: '2026-04-11', type: 'exam', title: 'ACT考试' },
  { date: '2026-04-13', type: 'exam', title: '期中考试' },
  { date: '2026-04-18', type: 'teacher-work', title: '教师工作日' },
  { date: '2026-04-24', type: 'school-activity', title: '家长会' },
  
  // 五月
  { date: '2026-05-01', type: 'holiday', title: '劳动节放假（与国家政策保持所有不同，不涉及调休）' },
  { date: '2026-05-04', type: 'exam', title: 'AP考试' },
  { date: '2026-05-18', type: 'school-activity', title: '社会实践周' },
  { date: '2026-05-29', type: 'school-activity', title: '学生会选举，社团大会；无课教育；艺术节（待定）' },
  { date: '2026-05-04', type: 'school-activity', title: '毕业典礼' },
  { date: '2026-05-05', type: 'school-activity', title: '家长办法' },
  
  // 六月
  { date: '2026-06-13', type: 'exam', title: 'ACT考试' },
  { date: '2026-06-16', type: 'exam', title: '期末考试' },
  { date: '2026-06-19', type: 'school-activity', title: '端午节' },
  { date: '2026-06-26', type: 'school-activity', title: '毕业典礼' },
  { date: '2026-06-30', type: 'school-activity', title: '学生第二学期最后一天，外教最后一工作日' },
  
  // 七月
  { date: '2026-07-01', type: 'school-activity', title: '中国教师工作及培训' },
  { date: '2026-07-06', type: 'school-activity', title: '中国教师中期会议培训' },
  { date: '2026-07-31', type: 'school-activity', title: '学生假期' }
];

// 获取指定月份的事件
export function getEventsForMonth(year: number, month: number): CalendarEvent[] {
  const monthStr = month.toString().padStart(2, '0');
  return calendarEvents.filter(event => 
    event.date.startsWith(`${year}-${monthStr}`)
  );
}

// 获取指定日期的事件
export function getEventsForDate(date: string): CalendarEvent[] {
  return calendarEvents.filter(event => event.date === date);
}

// 检查指定日期是否有事件
export function hasEventOnDate(date: string): boolean {
  return calendarEvents.some(event => event.date === date);
}