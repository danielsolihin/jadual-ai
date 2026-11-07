// src/types/timetable.ts

export type AcademicStage = 'STAGE_1' | 'STAGE_2' | 'LOWER_SEC' | 'UPPER_SEC' | string;
export type TimeBandPreference = 'ANY' | 'PRE_RECESS' | 'POST_RECESS' | 'AFTERNOON' | string;
export type SchoolSession = 'MORNING' | 'AFTERNOON' | 'FULL_DAY' | string;
export type StateGroup = 'GROUP_A' | 'GROUP_B' | string;
export type BlockSize = 'SINGLE' | 'DOUBLE' | 'TRIPLE' | number | string;

export type TeacherRole = string;
export type RoomType = string;

export interface SchoolProfileState {
  [key: string]: any;
}

export interface FlexibleScheduleConfig {
  [key: string]: any;
}

export interface SubjectDemand {
  [key: string]: any;
}

export interface SchoolType {
  id: string;
  name: string;
  category: string;
  defaultRecessCount: number;
  [key: string]: any;
}

export interface CocurricularConfig {
  enabled: boolean;
  day: number;
  startSlot: number;
  slotCount: number;
  label?: string;
  targetStages?: string[] | any[];
  [key: string]: any;
}

export interface TimeGridConfigState {
  stateGroup: string | any;
  recessMode: string | any;
  totalDailySlots: number;
  fridayMaxSlots: number;
  maxConsecutiveSlots: number;
  recessGroup1Slot?: number;
  recessGroup2Slot?: number;
  recessGroup1?: number;
  recessGroup2?: number;
  lunchPrayerSlot?: number;
  maxConsecutivePeriods?: number;
  maxConsecutive?: number;
  maxFridaySlots?: number;
  fridayLimit?: number;
  cocurricularConfig?: CocurricularConfig | any;
  [key: string]: any;
}

export interface TeacherFormState {
  id: string;
  code: string;
  fullName: string;
  role: TeacherRole | string | any;
  maxWeeklySlots: number;
  maxDailySlots: number;
  availableDays?: any;
  unavailableDays?: any;
  isSpecialLeave: boolean;
  majors?: any;
  minDailySlots?: any;
  minWeeklySlots?: any;
  dailyMinSlots?: any;
  dailyMaxSlots?: any;
  fridayMaxSlots?: any;
  subjectCodes?: any;
  exemptFromOutdoor?: any;
  isActive?: any;
  [key: string]: any;
}

export interface RoomFormState {
  id: string;
  code: string;
  name: string;
  roomType: RoomType | string | any;
  capacity: number;
  isSharedAcrossSessions?: boolean;
  [key: string]: any;
}

export interface TeacherAllocation {
  teacherId: string;
  slots: number;
  [key: string]: any;
}

export interface SubjectDemandFormItem {
  id: string;
  code: string;
  name: string;
  weeklySlots: number;
  annualHours?: number;
  assignedTeacherId: string;
  teacherAllocations?: TeacherAllocation[];
  requiredRoomType?: RoomType | string | any;
  roomId?: string;
  category?: string | any;
  blockSize?: any;
  distributionProfile?: any;
  isParallel?: boolean;
  parallelSyncKey?: string;
  timeBandPreference?: any;
  isPrimeTimePriority?: boolean;
  allowedDays?: any;
  hasNilamSlot?: boolean;
  preferredRoomId?: any;
  [key: string]: any;
}

export interface ClassCohortConfig {
  id: string;
  name: string;
  gradeLevel: number;
  yearLevel?: number;
  session?: any;
  academicStage: AcademicStage | string | any;
  homeroomId?: string;
  demands: SubjectDemandFormItem[] | any[];
  [key: string]: any;
}

export interface LockedSlot {
  id: string;
  classId?: string;
  teacherId?: string;
  day: number;
  slot: number;
  reason?: string;
  blockSize?: any;
  slotIndex?: any;
  subjectCode?: string;
  roomId?: string;
  [key: string]: any;
}

export interface TimetableEntry {
  id: string;
  timetableId: string;
  classId: string;
  timeSlotId: string;
  subjectId: string;
  teacherId: string | null | undefined;
  roomId: string | null | undefined;
  blockInstanceId: string;
  isLocked: boolean;
  isCocurricular?: boolean;
  isParallel?: boolean;
  parallelSyncKey?: string;
  isNilam?: boolean;
  parallelGroupId?: string;
  [key: string]: any;
}