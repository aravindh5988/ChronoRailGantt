/**
 * This file was generated from ChronoRailGantt.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { ListActionValue, ListAttributeValue, ListValue, Option } from "mendix";
import { Big } from "big.js";
import { CSSProperties } from "react";

export type ViewModeEnum = "day" | "week" | "month";

export interface ChronoRailGanttContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    data: ListValue;
    taskName: ListAttributeValue<string>;
    taskStart: ListAttributeValue<Date>;
    taskEnd: ListAttributeValue<Date>;
    taskProgress?: ListAttributeValue<Big>;
    taskColor?: ListAttributeValue<string>;
    taskStatus?: ListAttributeValue<string>;
    taskDependencies?: ListAttributeValue<string>;
    viewMode: ViewModeEnum;
    rowHeight: number;
    showToday: boolean;
    emptyMessage: string;
    allowEditing: boolean;
    onTaskClick?: ListActionValue;
    onTaskChanged?: ListActionValue<{ changedStartDate: Option<Date>; changedEndDate: Option<Date> }>;
}

export interface ChronoRailGanttPreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    renderMode: "design" | "xray" | "structure";
    translate: (text: string) => string;
    data: {} | { caption: string } | { type: string } | null;
    taskName: string;
    taskStart: string;
    taskEnd: string;
    taskProgress: string;
    taskColor: string;
    taskStatus: string;
    taskDependencies: string;
    viewMode: ViewModeEnum;
    rowHeight: number | null;
    showToday: boolean;
    emptyMessage: string;
    allowEditing: boolean;
    onTaskClick: {} | null;
    onTaskChanged: {} | null;
}
