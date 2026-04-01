
export enum PhaseState {
  LOADING = 'LOADING',
  LANDING = 'LANDING',
  STREAMING = 'STREAMING'
}

export interface QTEStatus {
  active: boolean;
  prompt?: string;
  expectedKey?: string;
  loreContext?: string;
}

export interface OperatorStats {
  bondLevel: number;
  mountingStatus: 'unmounted' | 'mounting' | 'mounted';
}
