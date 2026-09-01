import { CSSProperties, ReactElement, useMemo, useRef, useState } from "react";
import { ListAttributeValue, ObjectItem } from "mendix";
import { GanttChartContainerProps } from "../typings/GanttChartProps";
import "./ui/GanttChart.css";

type Task = {
  item: ObjectItem;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  color: string;
  status: string;
  dependencies: string;
};
const DAY = 86400000;
const colors: Record<string, string> = {
  completed: "#19a463",
  "in progress": "#2374ed",
  blocked: "#ff5757",
  overdue: "#ff5757",
  "not started": "#738096",
};
const value = (
  property: ListAttributeValue<any> | undefined,
  item: ObjectItem
): any => property?.get(item)?.value;
const number = (input: any): number =>
  typeof input === "number"
    ? input
    : input?.toNumber
    ? input.toNumber()
    : Number(input) || 0;
const midnight = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());
const month = (date: Date) =>
  date.toLocaleDateString(undefined, { month: "short", year: "numeric" });

export default function GanttChart(
  props: GanttChartContainerProps
): ReactElement {
  const {
    data,
    taskName,
    taskStart,
    taskEnd,
    taskProgress,
    taskColor,
    taskStatus,
    taskDependencies,
    viewMode,
    rowHeight,
    showToday,
    emptyMessage,
    allowEditing,
    onTaskClick,
    onTaskChanged,
    class: className,
  } = props;
  const [view, setView] = useState<"day" | "week" | "month">(
    String(viewMode ?? "week").toLowerCase() as "day" | "week" | "month"
  );
  const [zoom, setZoom] = useState(1),
    [filter, setFilter] = useState("all"),
    [drag, setDrag] = useState<{ task: Task; x: number; delta: number }>();
  const [edits, setEdits] = useState<Map<string, { start: Date; end: Date }>>(
    new Map()
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const all = useMemo<Task[]>(
    () =>
      (data.items ?? []).flatMap((item) => {
        const savedStart = value(taskStart, item),
          savedEnd = value(taskEnd, item),
          edited = edits.get(String(item.id)),
          start = edited?.start ?? savedStart,
          end = edited?.end ?? savedEnd,
          name = value(taskName, item);
        if (
          !(start instanceof Date) ||
          !(end instanceof Date) ||
          !name ||
          end < start
        )
          return [];
        const status = String(value(taskStatus, item) ?? "In Progress");
        return [
          {
            item,
            name: String(name),
            start: midnight(start),
            end: midnight(end),
            progress: Math.max(
              0,
              Math.min(100, number(value(taskProgress, item)))
            ),
            color:
              value(taskColor, item) ||
              colors[status.toLowerCase()] ||
              "#2374ed",
            status,
            dependencies: String(value(taskDependencies, item) ?? ""),
          },
        ];
      }),
    [
      data.items,
      taskName,
      taskStart,
      taskEnd,
      taskProgress,
      taskColor,
      taskStatus,
      taskDependencies,
      edits,
    ]
  );
  const statuses = useMemo(
    () => Array.from(new Set(all.map((task) => task.status))).sort(),
    [all]
  );
  const tasks =
    filter === "all" ? all : all.filter((task) => task.status === filter);
  const range = useMemo(() => {
    const points = [
        ...all.flatMap((task) => [task.start.getTime(), task.end.getTime()]),
        Date.now(),
      ],
      first = midnight(new Date(Math.min(...points))),
      last = midnight(new Date(Math.max(...points)));
    return view === "month"
      ? {
          start: new Date(first.getFullYear(), first.getMonth(), 1),
          end: new Date(last.getFullYear(), last.getMonth() + 1, 0),
        }
      : {
          start: midnight(new Date(first.getTime() - DAY * 2)),
          end: midnight(new Date(last.getTime() + DAY * 3)),
        };
  }, [all, view]);
  const days = Math.max(
      1,
      Math.round((range.end.getTime() - range.start.getTime()) / DAY)
    ),
    perDay = (view === "day" ? 72 : view === "week" ? 28 : 10) * zoom,
    width = days * perDay;
  const dates = useMemo(
    () =>
      Array.from(
        { length: days + 1 },
        (_, index) => new Date(range.start.getTime() + index * DAY)
      ),
    [range.start, days]
  );
  const months = useMemo(() => {
    const result: Array<{ date: Date; left: number }> = [];
    for (
      let date = new Date(range.start.getFullYear(), range.start.getMonth(), 1);
      date <= range.end;
      date = new Date(date.getFullYear(), date.getMonth() + 1, 1)
    ) {
      const from = Math.max(
          0,
          ((date.getTime() - range.start.getTime()) / DAY) * perDay
        ),
        to = Math.min(
          width,
          ((new Date(date.getFullYear(), date.getMonth() + 1, 1).getTime() -
            range.start.getTime()) /
            DAY) *
            perDay
        );
      if (to > 0 && from < width)
        result.push({ date, left: from + (to - from) / 2 });
    }
    return result;
  }, [range.start, range.end, perDay, width]);
  const weeks = useMemo(
    () => dates.filter((_, index) => index % 7 === 0),
    [dates]
  );
  const today =
    ((midnight(new Date()).getTime() - range.start.getTime()) / DAY) * perDay;
  const goToday = () => {
    if (scrollRef.current)
      scrollRef.current.scrollLeft = Math.max(
        0,
        today - scrollRef.current.clientWidth / 2
      );
  };
  const exportCsv = () => {
    const rows = [
        "Task,Start,End,Status,Progress (%)",
        ...tasks.map((task) =>
          [
            task.name,
            task.start.toLocaleDateString(),
            task.end.toLocaleDateString(),
            task.status,
            task.progress,
          ]
            .map((cell) => '"' + String(cell).replaceAll('"', '""') + '"')
            .join(",")
        ),
      ],
      url = URL.createObjectURL(
        new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" })
      ),
      link = document.createElement("a");
    link.href = url;
    link.download = "gantt-chart.csv";
    link.click();
    URL.revokeObjectURL(url);
  };
  const finishDrag = () => {
    if (drag?.delta) {
      const start = new Date(drag.task.start.getTime() + drag.delta * DAY),
        end = new Date(drag.task.end.getTime() + drag.delta * DAY);
      setEdits((items) =>
        new Map(items).set(String(drag.task.item.id), { start, end })
      );
      const action = onTaskChanged?.get(drag.task.item);
      if (action?.canExecute)
        action.execute({ changedStartDate: start, changedEndDate: end });
    }
    setDrag(undefined);
  };
  if (data.status !== "available")
    return (
      <div className={"gantt-chart " + (className ?? "")} aria-busy="true" />
    );
  if (!all.length)
    return (
      <div className={"gantt-chart gantt-chart-empty " + (className ?? "")}>
        {emptyMessage}
      </div>
    );
  const style = {
    width,
    "--gantt-row-height": String(rowHeight) + "px",
    "--gantt-day-width": String(perDay) + "px",
    backgroundSize: String(perDay) + "px 100%",
  } as CSSProperties;
  return (
    <div
      className={"gantt-chart " + (className ?? "")}
      onMouseMove={(event) => {
        if (drag && allowEditing)
          setDrag({
            ...drag,
            delta: Math.round((event.clientX - drag.x) / perDay),
          });
      }}
      onMouseUp={finishDrag}
      onMouseLeave={finishDrag}
    >
      <div
        className="gantt-chart__controls"
        role="toolbar"
        aria-label="Gantt chart controls"
      >
        <div className="gantt-chart__view-switcher">
          {(["day", "week", "month"] as const).map((mode) => (
            <button
              type="button"
              key={mode}
              className={
                "gantt-chart__view-button " +
                (view === mode ? "gantt-chart__view-button--active" : "")
              }
              onClick={() => setView(mode)}
            >
              {mode[0].toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
        <label className="gantt-chart__zoom">
          Zoom{" "}
          <button
            type="button"
            className="gantt-chart__tool gantt-chart__zoom-step"
            onClick={() => setZoom((current) => Math.max(0.6, current - 0.1))}
          >
            −
          </button>
          <input
            type="range"
            min="0.6"
            max="2"
            step="0.1"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
          <button
            type="button"
            className="gantt-chart__tool gantt-chart__zoom-step"
            onClick={() => setZoom((current) => Math.min(2, current + 0.1))}
          >
            +
          </button>
        </label>
        {statuses.length > 1 && (
          <select
            className="gantt-chart__filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">All status</option>
            {statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        )}
        <button type="button" className="gantt-chart__tool" onClick={exportCsv}>
          ⇩ Export
        </button>
        <span className="gantt-chart__control-spacer" />
        <button
          type="button"
          className="gantt-chart__icon-button"
          onClick={goToday}
        >
          ⛶
        </button>
        <button
          type="button"
          className="gantt-chart__icon-button gantt-chart__more"
        >
          ⋮
        </button>
      </div>
      <div className="gantt-chart__workspace">
        <div
          className="gantt-chart__names"
          style={
            { "--gantt-row-height": String(rowHeight) + "px" } as CSSProperties
          }
        >
          <div className="gantt-chart__header gantt-chart__task-header">
            Task <span className="gantt-chart__sort">↕</span>
          </div>
          {tasks.map((task) => (
            <div className="gantt-chart__name" key={task.item.id}>
              <span className="gantt-chart__drag-handle">⠿</span>
              <div className="gantt-chart__task-copy">
                <div
                  className="gantt-chart__task-title"
                  style={{ "--task-color": task.color } as CSSProperties}
                >
                  <span className="gantt-chart__status-dot" />
                  <span>{task.name}</span>
                </div>
                <div className="gantt-chart__task-meta">
                  {task.status} · {task.progress}%
                </div>
                <div
                  className="gantt-chart__task-progress"
                  style={{ "--task-color": task.color } as CSSProperties}
                >
                  <span style={{ width: String(task.progress) + "%" }} />
                </div>
              </div>
              <span className="gantt-chart__task-chevron">⌄</span>
            </div>
          ))}
        </div>
        <div className="gantt-chart__scroll" ref={scrollRef}>
          <div className="gantt-chart__timeline" style={style}>
            <div
              className={
                "gantt-chart__header gantt-chart__dates gantt-chart__dates--" +
                view
              }
            >
              {view === "month" ? (
                <div className="gantt-chart__month-labels">
                  {months.map((header) => (
                    <span
                      key={header.date.toISOString()}
                      style={{ left: header.left }}
                    >
                      {month(header.date)}
                    </span>
                  ))}
                </div>
              ) : view === "week" ? (
                <div className="gantt-chart__week-labels">
                  {weeks.map((date) => (
                    <span
                      key={date.toISOString()}
                      style={{
                        left:
                          ((date.getTime() - range.start.getTime()) / DAY) *
                            perDay +
                          perDay * 3.5,
                      }}
                    >
                      {date.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  ))}
                </div>
              ) : (
                <>
                  <div className="gantt-chart__month-labels">
                    {months.map((header) => (
                      <span
                        key={header.date.toISOString()}
                        style={{ left: header.left }}
                      >
                        {month(header.date)}
                      </span>
                    ))}
                  </div>
                  <div className="gantt-chart__day-labels">
                    {dates.map((date, index) => (
                      <span
                        key={date.toISOString()}
                        style={{ left: index * perDay + perDay / 2 }}
                      >
                        {date.getDate()}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
            {showToday && today >= 0 && today <= width && (
              <div className="gantt-chart__today" style={{ left: today }}>
                <span className="gantt-chart__today-label">Today</span>
              </div>
            )}
            {tasks.map((task) => {
              const shift =
                  drag?.task.item.id === task.item.id ? drag.delta : 0,
                left =
                  ((task.start.getTime() - range.start.getTime()) / DAY +
                    shift) *
                  perDay,
                taskWidth = Math.max(
                  perDay,
                  ((task.end.getTime() - task.start.getTime()) / DAY + 1) *
                    perDay
                ),
                milestone = task.start.getTime() === task.end.getTime(),
                action = onTaskClick?.get(task.item);
              return (
                <div className="gantt-chart__row" key={task.item.id}>
                  <button
                    type="button"
                    className={
                      "gantt-chart__bar " +
                      (milestone ? "gantt-chart__bar--milestone" : "")
                    }
                    style={{
                      left,
                      width: taskWidth,
                      backgroundColor: task.color,
                    }}
                    onClick={() => action?.canExecute && action.execute()}
                    onMouseDown={(event) => {
                      if (allowEditing) {
                        event.preventDefault();
                        setDrag({ task, x: event.clientX, delta: 0 });
                      }
                    }}
                  >
                    <span className="gantt-chart__label">
                      {task.name}
                      {taskProgress ? " · " + task.progress + "%" : ""}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="gantt-chart__footer">
        <span className="gantt-chart__legend">
          <i
            className="gantt-chart__legend-dot"
            style={{ "--task-color": "#2374ed" } as CSSProperties}
          />
          In Progress
        </span>
        <span className="gantt-chart__legend">
          <i
            className="gantt-chart__legend-dot"
            style={{ "--task-color": "#19a463" } as CSSProperties}
          />
          Completed
        </span>
        <span className="gantt-chart__legend">
          <i
            className="gantt-chart__legend-dot"
            style={{ "--task-color": "#738096" } as CSSProperties}
          />
          Not Started
        </span>
        <span className="gantt-chart__legend">
          <i
            className="gantt-chart__legend-dot"
            style={{ "--task-color": "#ff5757" } as CSSProperties}
          />
          Overdue
        </span>
        <span className="gantt-chart__legend">
          <i className="gantt-chart__legend-today" />
          Today
        </span>
        <span className="gantt-chart__legend">
          <i className="gantt-chart__legend-milestone" />
          Milestone
        </span>
        <span className="gantt-chart__range">
          Displaying {month(range.start)} – {month(range.end)}
        </span>
        <button type="button" className="gantt-chart__tool" onClick={goToday}>
          ▣ Today
        </button>
      </div>
      <div className="gantt-chart__tip">
        <span className="gantt-chart__tip-icon">☼</span>Tip: Drag the ends of a
        task to resize or drag the entire bar to move it.
      </div>
    </div>
  );
}
