/** Row from GET /api/spinningReports/production-eff */
export interface SpinningProductionEffRow {
  report_date: string;
  quality_id: number | null;
  quality_name: string | null;
  spell_id: number | null;
  spell_name: string | null;
  frames: number;
  production: number;
  /** Target production for the shift — used to compute eff = SUM(prod)/SUM(tarprod)*100 */
  tarprod: number;
}

/** Row from GET /api/spinningReports/mc-date */
export interface SpinningMcDateRow {
  report_date: string;
  mc_id: number | null;
  mc_name: string | null;
  frames: number;
  production: number;
  /** Target production — used to compute eff = SUM(prod)/SUM(tarprod)*100 */
  tarprod: number;
}

/** Row from GET /api/spinningReports/emp-date */
export interface SpinningEmpDateRow {
  report_date: string;
  emp_id: number | null;
  emp_name: string | null;
  production: number;
  eff: number;
}

/** Row from GET /api/spinningReports/frame-running */
export interface SpinningFrameRunningRow {
  frame_id: number | null;
  frame_name: string | null;
  running_hours: number;
  total_hours: number;
  eff: number;
}

/** Row from GET /api/spinningReports/running-hours-eff */
export interface SpinningRunningHoursEffRow {
  mc_id: number | null;
  mc_name: string | null;
  quality_id: number | null;
  quality_name: string | null;
  production: number;
  running_hours: number;
  eff: number;
}

export interface SpinningReportApiResponse<T> {
  data: T[];
}
