export interface Details {
  passed: unknown[];
  failed: unknown[];
}

export default interface MatchDetails {
  score?: number;
  requiredFailed?: boolean;
  details?: Details;
  viewportOptions?: Record<string, unknown>;
  displaySetsInfo?: unknown[];
}
