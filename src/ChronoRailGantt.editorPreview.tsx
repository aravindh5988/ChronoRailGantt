import { ReactElement } from "react";
import { GanttChartPreviewProps } from "../typings/GanttChartProps";
import "./ui/GanttChart.css";

export function preview(_props: GanttChartPreviewProps): ReactElement {
  return (
    <div className="gantt-chart gantt-chart-preview">
      <div className="gantt-chart__names">
        <div className="gantt-chart__header">Task</div>
        <div className="gantt-chart__name">Plan project</div>
        <div className="gantt-chart__name">Build feature</div>
        <div className="gantt-chart__name">Release</div>
      </div>
      <div className="gantt-chart__scroll">
        <div className="gantt-chart__timeline">
          <div className="gantt-chart__header gantt-chart__dates">
            <span>Timeline</span>
          </div>
          <div className="gantt-chart__row">
            <span
              className="gantt-chart__bar"
              style={{ left: "8%", width: "35%" }}
            />
          </div>
          <div className="gantt-chart__row">
            <span
              className="gantt-chart__bar"
              style={{ left: "30%", width: "48%" }}
            />
          </div>
          <div className="gantt-chart__row">
            <span
              className="gantt-chart__bar"
              style={{ left: "72%", width: "18%" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function getPreviewCss(): string {
  return require("./ui/GanttChart.css");
}
