import { useState, useMemo } from 'react';
import { useAppStore, Activity, Project, Task } from '@/store';
import clsx from 'clsx';

// Phase colors matching the rest of the app
const PHASE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  design: { bg: 'bg-pink-500/80', text: 'text-pink-400', dot: 'bg-pink-400' },
  engineering: { bg: 'bg-sky-500/80', text: 'text-sky-400', dot: 'bg-sky-400' },
  build: { bg: 'bg-yellow-500/80', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  launch: { bg: 'bg-green-500/80', text: 'text-green-400', dot: 'bg-green-400' },
  closure: { bg: 'bg-teal-500/80', text: 'text-teal-400', dot: 'bg-teal-400' },
};

// Helper to get days in month
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Helper to get first day of month (0 = Sunday, 1 = Monday, etc.)
function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  // Convert to Monday-first (0 = Monday, 6 = Sunday)
  return day === 0 ? 6 : day - 1;
}

// Helper to format date as YYYY-MM-DD
function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Helper to check if two dates are the same day
function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

// Get week start (Monday) for a given date
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Get week dates for a given week start
function getWeekDates(weekStart: Date): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    dates.push(d);
  }
  return dates;
}

// Map hour of day to percentage position across the 4 equal-width time period columns
// Morning (6am-12pm) = 0-25%, Afternoon (12pm-5pm) = 25-50%, Evening (5pm-9pm) = 50-75%, Night (9pm-12am) = 75-100%
function hourToPercent(hour: number): number {
  if (hour <= 6) return 0;
  if (hour >= 24) return 100;
  if (hour < 12) return ((hour - 6) / 6) * 25;       // Morning: 6h span → 0-25%
  if (hour < 17) return 25 + ((hour - 12) / 5) * 25;  // Afternoon: 5h span → 25-50%
  if (hour < 21) return 50 + ((hour - 17) / 4) * 25;  // Evening: 4h span → 50-75%
  return 75 + ((hour - 21) / 3) * 25;                  // Night: 3h span → 75-100%
}

interface DayActivities {
  activities: Activity[];
  projects: Map<string, { project: Project; activities: Activity[] }>;
  tasksDue: Task[];
}

export function CalendarView() {
  const { activities, projects, tasks } = useAppStore();
  const today = new Date();

  // State
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(getWeekStart(today));
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);

  // Memoize activity data grouped by date
  const activitiesByDate = useMemo(() => {
    const map = new Map<string, Activity[]>();
    activities.forEach(activity => {
      const dateKey = formatDateKey(new Date(activity.timestamp));
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(activity);
    });
    return map;
  }, [activities]);

  // Memoize tasks with due dates
  const tasksByDueDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach(task => {
      if (task.dueDate) {
        const dateKey = formatDateKey(new Date(task.dueDate));
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(task);
      }
    });
    return map;
  }, [tasks]);

  // Get project map for quick lookup
  const projectMap = useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach(p => map.set(p.id, p));
    return map;
  }, [projects]);

  // Get activities for a specific date
  const getDateActivities = (date: Date): DayActivities => {
    const dateKey = formatDateKey(date);
    const dayActivities = activitiesByDate.get(dateKey) || [];
    const dayTasks = tasksByDueDate.get(dateKey) || [];

    // Filter by project if filter is set
    const filteredActivities = projectFilter
      ? dayActivities.filter(a => a.projectId === projectFilter)
      : dayActivities;

    // Group by project
    const projectActivities = new Map<string, { project: Project; activities: Activity[] }>();
    filteredActivities.forEach(activity => {
      const project = projectMap.get(activity.projectId);
      if (project) {
        if (!projectActivities.has(activity.projectId)) {
          projectActivities.set(activity.projectId, { project, activities: [] });
        }
        projectActivities.get(activity.projectId)!.activities.push(activity);
      }
    });

    return {
      activities: filteredActivities,
      projects: projectActivities,
      tasksDue: projectFilter
        ? dayTasks.filter(t => t.projectId === projectFilter)
        : dayTasks,
    };
  };

  // Get projects that have activities (for filter)
  const activeProjects = useMemo(() => {
    const projectIds = new Set<string>();
    activities.forEach(a => projectIds.add(a.projectId));
    return projects.filter(p => projectIds.has(p.id));
  }, [activities, projects]);

  // Build month grid
  const monthGrid = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);

    const weeks: Array<Array<{ date: Date; currentMonth: boolean }>> = [];
    let currentWeek: Array<{ date: Date; currentMonth: boolean }> = [];

    // Previous month's days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const date = new Date(currentYear, currentMonth - 1, day);
      currentWeek.push({ date, currentMonth: false });
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      currentWeek.push({ date, currentMonth: true });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Next month's days
    if (currentWeek.length > 0) {
      let nextDay = 1;
      while (currentWeek.length < 7) {
        const date = new Date(currentYear, currentMonth + 1, nextDay++);
        currentWeek.push({ date, currentMonth: false });
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [currentYear, currentMonth]);

  // Navigation handlers
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedWeekStart(getWeekStart(today));
    setSelectedDate(today);
  };

  // Get week dates
  const weekDates = getWeekDates(selectedWeekStart);

  // Navigate week
  const prevWeek = () => {
    const newStart = new Date(selectedWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setSelectedWeekStart(newStart);
  };

  const nextWeek = () => {
    const newStart = new Date(selectedWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setSelectedWeekStart(newStart);
  };

  // Format month name
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Selected date activities
  const selectedDayData = getDateActivities(selectedDate);

  // Calculate week stats
  const weekStats = useMemo(() => {
    let totalActivities = 0;
    const projectHours = new Map<string, number>();

    weekDates.forEach(date => {
      const dayData = getDateActivities(date);
      totalActivities += dayData.activities.length;
      dayData.projects.forEach((data, projectId) => {
        const current = projectHours.get(projectId) || 0;
        // Estimate ~30 min per activity
        projectHours.set(projectId, current + data.activities.length * 0.5);
      });
    });

    const totalHours = Array.from(projectHours.values()).reduce((a, b) => a + b, 0);

    return { totalActivities, totalHours: Math.round(totalHours) };
  }, [weekDates, activitiesByDate, projectFilter]);

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-zinc-800 bg-zinc-900/50 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-white">Calendar</h1>
            <p className="text-sm text-zinc-500">Track your project work history</p>
          </div>

          {/* Project Filter */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">Filter:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setProjectFilter(null)}
                className={clsx(
                  'px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                  projectFilter === null
                    ? 'bg-zinc-800 text-white border-zinc-700'
                    : 'text-zinc-400 border-transparent hover:text-white hover:border-zinc-700'
                )}
              >
                All Projects
              </button>
              {activeProjects.map(project => {
                const colors = PHASE_COLORS[project.currentPhase] || PHASE_COLORS.design;
                return (
                  <button
                    key={project.id}
                    onClick={() => setProjectFilter(projectFilter === project.id ? null : project.id)}
                    className={clsx(
                      'flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                      projectFilter === project.id
                        ? 'bg-zinc-800 text-white border-zinc-700'
                        : 'text-zinc-400 border-transparent hover:text-white hover:border-zinc-700'
                    )}
                  >
                    <div className={clsx('w-2 h-2 rounded-full', colors.dot)} />
                    {project.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-5">
        <div>
          <div className="grid grid-cols-[570px_1fr] gap-4">

            {/* LEFT: Month Grid */}
            <div className="bg-zinc-900/30 rounded-xl border border-zinc-800/50 p-5">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-5">
                <button
                  onClick={prevMonth}
                  className="p-2 hover:bg-zinc-800/50 rounded-lg transition-colors text-zinc-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
                <h2 className="text-base font-semibold text-white">
                  {monthNames[currentMonth]} {currentYear}
                </h2>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-zinc-800/50 rounded-lg transition-colors text-zinc-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1.5 mb-3">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-xs font-medium text-zinc-500 py-1.5">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="space-y-1.5">
                {monthGrid.map((week, weekIdx) => {
                  const weekStart = getWeekStart(week[0].date);
                  const isSelectedWeek = isSameDay(weekStart, selectedWeekStart);

                  return (
                    <div
                      key={weekIdx}
                      onClick={() => {
                        setSelectedWeekStart(weekStart);
                        const firstCurrentMonthDay = week.find(d => d.currentMonth);
                        if (firstCurrentMonthDay) {
                          setSelectedDate(firstCurrentMonthDay.date);
                        }
                      }}
                      className={clsx(
                        'grid grid-cols-7 gap-1.5 rounded-lg p-1 cursor-pointer transition-colors',
                        isSelectedWeek
                          ? 'bg-blue-500/10 border border-blue-500/30'
                          : 'hover:bg-zinc-800/30'
                      )}
                    >
                      {week.map(({ date, currentMonth }) => {
                        const isToday = isSameDay(date, today);
                        const isSelected = isSameDay(date, selectedDate);
                        const dayData = getDateActivities(date);
                        const hasActivity = dayData.activities.length > 0;
                        const hasTaskDue = dayData.tasksDue.length > 0;

                        const projectDots = Array.from(dayData.projects.values()).slice(0, 5);

                        return (
                          <div
                            key={date.getTime()}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDate(date);
                              setSelectedWeekStart(getWeekStart(date));
                            }}
                            className={clsx(
                              'aspect-square rounded-md flex flex-col items-center justify-center cursor-pointer transition-colors',
                              !currentMonth && 'opacity-40',
                              isSelected && 'bg-blue-500/20 border border-blue-500/50',
                              isToday && !isSelected && 'border border-blue-500/30 bg-blue-500/10'
                            )}
                          >
                            <span className={clsx(
                              'text-sm font-medium',
                              isToday ? 'text-blue-400' : currentMonth ? 'text-zinc-200' : 'text-zinc-600'
                            )}>
                              {date.getDate()}
                            </span>
                            {(hasActivity || hasTaskDue) && (
                              <div className="flex gap-0.5 mt-1">
                                {projectDots.map(({ project }) => {
                                  const colors = PHASE_COLORS[project.currentPhase] || PHASE_COLORS.design;
                                  return (
                                    <div
                                      key={project.id}
                                      className={clsx('w-1.5 h-1.5 rounded-full', colors.dot)}
                                    />
                                  );
                                })}
                                {hasTaskDue && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Today Button */}
              <div className="mt-5 pt-4 border-t border-zinc-800/50">
                <button
                  onClick={goToToday}
                  className="w-full px-3 py-2.5 text-sm font-medium bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-700/50 transition-colors"
                >
                  Go to Today
                </button>
              </div>

              {/* Legend */}
              <div className="mt-4 pt-4 border-t border-zinc-800/50">
                <div className="text-xs text-zinc-500 mb-3 font-medium">Projects</div>
                <div className="grid grid-cols-2 gap-2.5">
                  {activeProjects.slice(0, 6).map(project => {
                    const colors = PHASE_COLORS[project.currentPhase] || PHASE_COLORS.design;
                    return (
                      <div key={project.id} className="flex items-center gap-2">
                        <div className={clsx('w-2.5 h-2.5 rounded-full', colors.dot)} />
                        <span className="text-xs text-zinc-400 truncate">{project.name}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs text-zinc-400">Task Due</span>
                </div>
              </div>
            </div>

            {/* RIGHT: Week Timeline */}
            <div className="bg-zinc-900/30 rounded-xl border border-zinc-800/50 overflow-hidden flex flex-col">
              {/* Week Header */}
              <div className="px-4 py-3 border-b border-zinc-800/50 bg-zinc-900/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={prevWeek}
                      className="p-1 hover:bg-zinc-800/50 rounded transition-colors text-zinc-400 hover:text-white"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                      </svg>
                    </button>
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        Week of {monthNames[selectedWeekStart.getMonth()]} {selectedWeekStart.getDate()}, {selectedWeekStart.getFullYear()}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {weekStats.totalHours}h tracked • {weekStats.totalActivities} activities
                      </p>
                    </div>
                    <button
                      onClick={nextWeek}
                      className="p-1 hover:bg-zinc-800/50 rounded transition-colors text-zinc-400 hover:text-white"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                      </svg>
                    </button>
                  </div>
                  {weekDates.some(d => isSameDay(d, today)) && (
                    <span className="px-2 py-1 text-[10px] font-medium bg-blue-500/20 text-blue-400 rounded">
                      This Week
                    </span>
                  )}
                </div>
              </div>

              {/* Timeline Grid */}
              <div className="p-4 flex-1 overflow-auto">
                {/* Time Headers */}
                <div className="flex mb-2">
                  <div className="w-16 flex-shrink-0"></div>
                  <div className="flex-1 grid grid-cols-4 text-center">
                    <div>
                      <span className="text-[10px] font-medium text-zinc-500">Morning</span>
                      <span className="block text-[9px] text-zinc-600">6am - 12pm</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-medium text-zinc-500">Afternoon</span>
                      <span className="block text-[9px] text-zinc-600">12pm - 5pm</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-medium text-zinc-500">Evening</span>
                      <span className="block text-[9px] text-zinc-600">5pm - 9pm</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-medium text-zinc-500">Night</span>
                      <span className="block text-[9px] text-zinc-600">9pm - 12am</span>
                    </div>
                  </div>
                </div>

                {/* Day Rows */}
                <div className="space-y-1.5">
                  {weekDates.map((date, idx) => {
                    const isToday = isSameDay(date, today);
                    const isSelected = isSameDay(date, selectedDate);
                    const dayData = getDateActivities(date);

                    // Group activities by time of day
                    const timeBlocks = {
                      morning: [] as Array<{ project: Project; activities: Activity[] }>,
                      afternoon: [] as Array<{ project: Project; activities: Activity[] }>,
                      evening: [] as Array<{ project: Project; activities: Activity[] }>,
                      night: [] as Array<{ project: Project; activities: Activity[] }>,
                    };

                    dayData.projects.forEach(data => {
                      data.activities.forEach(activity => {
                        const hour = new Date(activity.timestamp).getHours();
                        let block: keyof typeof timeBlocks;
                        if (hour >= 6 && hour < 12) block = 'morning';
                        else if (hour >= 12 && hour < 17) block = 'afternoon';
                        else if (hour >= 17 && hour < 21) block = 'evening';
                        else block = 'night';

                        const existing = timeBlocks[block].find(b => b.project.id === data.project.id);
                        if (existing) {
                          existing.activities.push(activity);
                        } else {
                          timeBlocks[block].push({ project: data.project, activities: [activity] });
                        }
                      });
                    });

                    // Detect deep work sessions (6+ hours = 3+ consecutive time blocks for same project)
                    const periods = ['morning', 'afternoon', 'evening', 'night'] as const;
                    const deepWorkProjects = new Set<string>();

                    dayData.projects.forEach((_, projectId) => {
                      let consecutiveCount = 0;
                      let maxConsecutive = 0;

                      periods.forEach(period => {
                        const hasProject = timeBlocks[period].some(b => b.project.id === projectId);
                        if (hasProject) {
                          consecutiveCount++;
                          maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
                        } else {
                          consecutiveCount = 0;
                        }
                      });

                      // 3+ periods = 6+ hours (morning+afternoon+evening or afternoon+evening+night)
                      if (maxConsecutive >= 3) {
                        deepWorkProjects.add(projectId);
                      }
                    });

                    const hasDeepWork = deepWorkProjects.size > 0;

                    // Calculate continuous spans for each project across the timeline
                    const projectSpans: Array<{
                      project: Project;
                      activities: Activity[];
                      startPct: number;
                      endPct: number;
                      isDeepWork: boolean;
                      lane: number;
                    }> = [];

                    dayData.projects.forEach((data) => {
                      const hours = data.activities.map(a => {
                        const d = new Date(a.timestamp);
                        return d.getHours() + d.getMinutes() / 60;
                      });
                      let minHour = Math.min(...hours);
                      let maxHour = Math.max(...hours);
                      // Ensure minimum 1.5h span for visibility
                      if (maxHour - minHour < 1.5) {
                        const mid = (minHour + maxHour) / 2;
                        minHour = mid - 0.75;
                        maxHour = mid + 0.75;
                      }
                      projectSpans.push({
                        project: data.project,
                        activities: data.activities,
                        startPct: hourToPercent(minHour),
                        endPct: hourToPercent(maxHour),
                        isDeepWork: deepWorkProjects.has(data.project.id),
                        lane: 0,
                      });
                    });

                    // Sort by start position, then wider spans first
                    projectSpans.sort((a, b) => a.startPct - b.startPct || (b.endPct - b.startPct) - (a.endPct - a.startPct));

                    // Greedy lane assignment for overlapping blocks
                    const lanes: Array<number[]> = [];
                    projectSpans.forEach((span, idx) => {
                      let assigned = false;
                      for (let l = 0; l < lanes.length; l++) {
                        const canFit = lanes[l].every(existingIdx => {
                          const existing = projectSpans[existingIdx];
                          return span.startPct >= existing.endPct || span.endPct <= existing.startPct;
                        });
                        if (canFit) {
                          lanes[l].push(idx);
                          span.lane = l;
                          assigned = true;
                          break;
                        }
                      }
                      if (!assigned) {
                        span.lane = lanes.length;
                        lanes.push([idx]);
                      }
                    });

                    const laneCount = Math.max(lanes.length, 1);
                    const laneHeight = 26;

                    return (
                      <div
                        key={date.getTime()}
                        onClick={() => setSelectedDate(date)}
                        className={clsx(
                          'flex items-stretch cursor-pointer rounded-lg transition-colors',
                          isToday && 'bg-blue-500/5 border border-blue-500/20',
                          isSelected && !isToday && 'bg-zinc-800/30',
                          !isToday && !isSelected && 'hover:bg-zinc-800/20',
                          hasDeepWork && 'ring-1 ring-orange-500/30'
                        )}
                      >
                        <div className="w-16 flex-shrink-0 px-2 py-2">
                          <div className={clsx(
                            'text-[10px] font-medium',
                            isToday ? 'text-blue-400' : 'text-zinc-500'
                          )}>
                            {dayNames[idx]}
                          </div>
                          <div className={clsx(
                            'text-sm font-semibold flex items-center gap-1',
                            isToday ? 'text-blue-300' : 'text-zinc-300'
                          )}>
                            {date.getDate()}
                            {isToday && (
                              <span className="text-[8px] px-1 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                                TODAY
                              </span>
                            )}
                          </div>
                          {hasDeepWork && (
                            <div className="mt-1 flex items-center gap-0.5" title="6+ hours deep work">
                              <span className="text-[9px]">🔥</span>
                              <span className="text-[8px] text-orange-400 font-medium">6h+</span>
                            </div>
                          )}
                        </div>
                        {/* Continuous timeline - blocks span across time periods */}
                        <div className="flex-1 relative py-2 pr-2" style={{ minHeight: `${laneCount * laneHeight + 8}px` }}>
                          {/* Period dividers aligned with header columns */}
                          <div className="absolute inset-0 flex">
                            {[0, 1, 2, 3].map(i => (
                              <div key={i} className={clsx('flex-1 rounded mx-0.5', i < 3 && 'border-r border-zinc-800/20')} />
                            ))}
                          </div>
                          {/* Empty state background */}
                          {projectSpans.length === 0 && (
                            <div className="absolute inset-0 flex gap-1">
                              {[0, 1, 2, 3].map(i => (
                                <div key={i} className="flex-1 rounded bg-zinc-800/20" />
                              ))}
                            </div>
                          )}
                          {/* Project blocks positioned across the continuous timeline */}
                          {projectSpans.map((span) => {
                            const colors = PHASE_COLORS[span.project.currentPhase] || PHASE_COLORS.design;
                            const activityCount = span.activities.length;
                            const widthPct = Math.max(span.endPct - span.startPct, 3);
                            return (
                              <div
                                key={span.project.id}
                                className={clsx(
                                  'absolute rounded flex items-center gap-1.5 px-2 overflow-hidden transition-all hover:brightness-110 cursor-pointer',
                                  colors.bg,
                                  span.isDeepWork && 'ring-1 ring-orange-400/50'
                                )}
                                style={{
                                  left: `${span.startPct}%`,
                                  width: `${widthPct}%`,
                                  top: `${span.lane * laneHeight + 4}px`,
                                  height: `${laneHeight - 4}px`,
                                }}
                                title={`${span.project.name} - ${activityCount} activities${span.isDeepWork ? ' (Deep Work 6h+)' : ''}`}
                              >
                                <span className="text-[10px] font-semibold text-white truncate flex-1">
                                  {span.project.name}
                                </span>
                                <span className="text-[9px] text-white/70 flex-shrink-0">
                                  {activityCount}
                                </span>
                                {span.isDeepWork && (
                                  <span className="text-[9px] flex-shrink-0">🔥</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Day Detail */}
              <div className="border-t border-zinc-800/50 p-4 bg-zinc-900/30">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-white">
                    {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })} - Activity Details
                  </h4>
                  <span className="text-[10px] text-zinc-500">
                    {selectedDayData.activities.length} activities
                  </span>
                </div>

                {selectedDayData.activities.length === 0 && selectedDayData.tasksDue.length === 0 ? (
                  <div className="text-center py-6 text-zinc-500 text-sm">
                    <div className="text-2xl mb-2">📅</div>
                    No activities recorded for this day
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {Array.from(selectedDayData.projects.values()).map(({ project, activities }) => {
                      const colors = PHASE_COLORS[project.currentPhase] || PHASE_COLORS.design;
                      return activities.map(activity => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 p-2 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors"
                        >
                          <div className={clsx('w-2 h-2 rounded-full mt-1', colors.dot)} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-zinc-200 truncate">{activity.description}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={clsx('text-[10px]', colors.text)}>{project.name}</span>
                              <span className="text-[10px] text-zinc-600">•</span>
                              <span className="text-[10px] text-zinc-500">
                                {new Date(activity.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ));
                    })}

                    {/* Tasks Due */}
                    {selectedDayData.tasksDue.map(task => {
                      const project = projectMap.get(task.projectId);
                      return (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
                        >
                          <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-white truncate">{task.title}</div>
                            <div className="text-[10px] text-amber-400/80 mt-0.5">
                              {project?.name || 'Unknown Project'} - Due
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
