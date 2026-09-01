 # ChronoRail Gantt

  ChronoRail Gantt is a modern, interactive Gantt chart widget for Mendix applications. It helps teams visualize project schedules, track task progress, and manage time-based work directly from Mendix data.

  ## Features

  - Interactive Day, Week, and Month timeline views
  - Zoom controls for adjusting timeline detail
  - Task bars with names, progress percentages, and status colours
  - Built-in statuses: In Progress, Completed, Not Started, Overdue, and Blocked
  - Today marker for quickly identifying the current date
  - Milestone support for zero-duration project checkpoints
  - Status filter and CSV export
  - Horizontal timeline scrolling
  - Optional drag-and-drop task date editing
  - Task click and task-change Mendix actions

  ## Typical Use Cases

  - Project planning and delivery tracking
  - Production and maintenance scheduling
  - Construction timelines
  - Product roadmaps
  - Release planning
  - Employee or resource planning
  - Event schedules and key delivery milestones

 ## Mendix Configuration

  Configure a list data source containing task objects and map:

    
   Task name     :      String

   Start date    :     Date and time

   End date      :    Date and time
 
   Progress      :    Integer or Decimal, 0–100
  
   Task colour   :    String CSS colour

   Task status   :   String

   Dependencies  :  String; comma-separated predecessor object IDs

  A milestone is created when a task has the same start and end date.

  ## Compatibility

  - Mendix 11.12.1 or higher
  - Web applications
  - Offline-capable widget
  - No third-party runtime dependencies
