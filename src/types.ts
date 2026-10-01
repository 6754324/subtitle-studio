/** A single subtitle cue. Times are in milliseconds. */
export interface Cue {
  id: string
  start: number
  end: number
  text: string
}

export interface OverlapIssue {
  cueId: string
  index: number
  message: string
}

export interface SpeedIssue {
  cueId: string
  index: number
  /** Characters per second. */
  cps: number
  text: string
}
