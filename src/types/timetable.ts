// src/types/timetable.ts

export type AcademicStage = 'STAGE_1' | 'STAGE_2';
export type TimeBandPreference = 'ANY' | 'PRE_RECESS' | 'POST_RECESS' | 'AFTERNOON';

export type TeacherRole = 
  | 'GURU_KELAS' 
  | 'GURU_SUBJEK' 
  | 'GURU_AGAMA' 
  | 'GURU_PEMULIHAN' 
  | 'GURU_PRASEKOLAH' 
  | 'GURU_BIMBINGAN'
  | 'GURU_KOKURIKULUM'
  | 'GURU_GANTI'
  | 'GURU_PENGAWAS'
  | 'GURU_PRAKTIKUM'
  | 'ADMIN_GB' 
  | 'ADMIN_PK' 
  | 'COUNSELOR' 
  | 'PREGNANT' 
  | 'MEDICAL_CHRONIC' 
  | 'MATERNITY_LEAVE' 
  | 'LEAVE_HAJI' 
  | 'LEAVE_UMRAH' 
  | 'LEAVE_STUDY' 
  | 'LEAVE_CK'
  | 'CK';

export type RoomType = 
  | 'CLASSROOM' 
  | 'SCIENCE_LAB' 
  | 'COMPUTER_LAB' 
  | 'WORKSHOP' 
  | 'RBT_WORKSHOP' 
  | 'LIBRARY' 
  | 'MUSIC_ROOM' 
  | 'ART_STUDIO' 
  | 'SURAU' 
  | 'FIELD' 
  | 'HALL'
  | 'LAB'
  | 'SPORTS_HALL';

export interface SchoolType {
  id: string;
  name: string;
  category: 'KEBANGSAAN' | 'SJKC' | 'SJKT' | 'AGAMA' | 'MENENGAH' | 'SRAI' | 'INTEGRASI';
  defaultRecessCount: number;
}

export interface CocurricularConfig {
  enabled: boolean;
  day: number;
  startSlot: number;
  slotCount: number;
  label?: string;
  targetStages?: ('STAGE_1' | 'STAGE_2')[];
}

export interface TimeGridConfigState {
  stateGroup: string;
  recessMode: 'SINGLE' | 'STAGGERED';
  totalDailySlots: number;
  fridayMaxSlots: number;
  maxConsecutiveSlots: number;
  recessGroup1Slot?: number;
  recessGroup2Slot?: number;
  recessGroup1?: number;
  recessGroup2?: number;
  lunchPrayerSlot?: number;
  cocurricularConfig?: CocurricularConfig;
  [key: string]: any; // Fallback untuk properties lama
}

export interface TeacherFormState {
  id: string;
  code: string;
  fullName: string;
  role: TeacherRole | string;
  maxWeeklySlots: number;
  maxDailySlots: number;
  availableDays?: number[];
  unavailableDays?: number[];
  isSpecialLeave: boolean;
  majors?: string[];
  minDailySlots?: number;
  minWeeklySlots?: number;
  dailyMinSlots?: number;
  dailyMaxSlots?: number;
  fridayMaxSlots?: number;
}

export interface RoomFormState {
  id: string;
  code: string;
  name: string;
  roomType: RoomType | string;
  capacity: number;
  isSharedAcrossSessions: boolean;
}

export interface TeacherAllocation {
  teacherId: string;
  slots: number;
}

export interface SubjectDemandFormItem {
  id: string;
  code: string;
  name: string;
  weeklySlots: number;
  annualHours?: number;
  assignedTeacherId: string;
  teacherAllocations?: TeacherAllocation[];
  requiredRoomType?: RoomType | string;
  roomId?: string;
  category?: 'CORE_ACADEMIC' | 'DINIYAH_RELIGIOUS' | 'ELECTIVE' | 'SPECIAL' | string;
  blockSize?: 'SINGLE' | 'DOUBLE' | 'TRIPLE';
  distributionProfile?: 'OPTION_A' | 'OPTION_B';
  isParallel?: boolean;
  parallelSyncKey?: string;
  timeBandPreference?: TimeBandPreference | string;
  isPrimeTimePriority?: boolean;
  allowedDays?: number[];
  hasNilamSlot?: boolean;
}

export interface ClassCohortConfig {
  id: string;
  name: string;
  gradeLevel: number;
  yearLevel?: number;
  session?: 'MORNING' | 'AFTERNOON';
  academicStage: AcademicStage | string;
  homeroomId?: string;
  demands: SubjectDemandFormItem[];
}

export interface LockedSlot {
  id: string;
  classId?: string;
  teacherId?: string;
  day: number;
  slot: number;
  reason?: string;
}

export interface TimetableEntry {
  id: string;
  timetableId: string;
  classId: string;
  timeSlotId: string;
  subjectId: string;
  teacherId: string | null;
  roomId: string | null;
  blockInstanceId: string;
  isLocked: boolean;
  isCocurricular?: boolean;
  isParallel?: boolean;
  parallelSyncKey?: string;
}