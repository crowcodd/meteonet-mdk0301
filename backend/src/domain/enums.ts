export enum Role {
  OBSERVER = 'OBSERVER',
  MANAGER = 'MANAGER',
}

export enum StationType {
  GROUND = 'GROUND',
  AEROLOGICAL = 'AEROLOGICAL',
  MARINE = 'MARINE',
  AUTOMATIC = 'AUTOMATIC',
}

export enum MeasurementStatus {
  /** внесён, но ещё не отправлен, такой замер есть только в очереди на клиенте */
  DRAFT = 'DRAFT',
  RECEIVED = 'RECEIVED',
  FLAGGED = 'FLAGGED',
  RETURNED = 'RETURNED',
  RECHECKED = 'RECHECKED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export enum CheckType {
  RANGE = 'RANGE',
  NEIGHBORS = 'NEIGHBORS',
  OUTLIER = 'OUTLIER',
}

export enum Verdict {
  NORMAL = 'NORMAL',
  SUSPECT = 'SUSPECT',
}

export enum InstrumentRole {
  PRIMARY = 'PRIMARY',
  RESERVE = 'RESERVE',
}

export enum InstrumentState {
  IN_SERVICE = 'IN_SERVICE',
  BROKEN = 'BROKEN',
  VERIFICATION = 'VERIFICATION',
  DECOMMISSIONED = 'DECOMMISSIONED',
}
