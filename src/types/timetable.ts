// src/types/timetable.ts

export type SchoolType = 'PRIMARY_KSSR' | 'SECONDARY_KSSM';
export type SchoolCategory = 'NATIONAL_ACADEMIC' | 'INTEGRATED_RELIGIOUS_DINIYAH'; // Biasa (10 slot) vs Integrasi (13 slot)
export type SchoolSession = 'SINGLE_SESSION' | 'DOUBLE_SESSION';
export type StateGroup = 'GROUP_A' | 'GROUP_B';
export type SessionType = 'MORNING' | 'AFTERNOON';
export type AcademicStage = 'STAGE_1' | 'STAGE_2' | 'LOWER_SEC' | 'UPPER_SEC';
export type SlotType = 'NORMAL' | 'ASSEMBLY' | 'RECESS' | 'CO_CURRICULAR' | 'PRAYER_LUNCH' | 'BUFFER';
export type BlockSize = 'SINGLE' | 'DOUBLE' | 'TRIPLE';

export type TeacherRole = 
  | 'NORMAL'           // Guru Biasa (22 - 28 waktu)
  | 'ADMIN_GB'         // Guru Besar / Pengetua (5 waktu)
  | 'ADMIN_PK'         // Penolong Kanan (12 waktu)
  | 'COUNSELOR'        // Kaunselor Sepenuh Masa (0 waktu PdP teras)
  | 'MEDIA_ICT'        // Guru Perpustakaan / Guru Media / ICT (10 - 14 waktu)
  | 'PREGNANT'         // Mengandung Trimester 3 (16 - 18 waktu, tiada PJK padang)
  | 'MEDICAL_CHRONIC'  // Sakit Kronik / Kurang Upaya (16 - 18 waktu)
  | 'MATERNITY_LEAVE'; // Cuti Bersalin (0 waktu aktif)

export type RoomType = 
  | 'CLASSROOM' 
  | 'SCIENCE_LAB' 
  | 'RBT_WORKSHOP' 
  | 'FIELD' 
  | 'SURAU' 
  | 'ART_STUDIO' 
  | 'COMPUTER_LAB' 
  | 'HALL';

export type RecessMode = 'SINGLE' | 'STAGGERED';
export type DistributionProfile = 'OPTION_A' | 'OPTION_B' | 'OPTION_C' | 'CUSTOM';

export interface CocurricularConfig {
  enabled: boolean;
  day: number;           // 1 (Isnin/Ahad) hingga 5 (Jumaat/Khamis)
  startSlot: number;     // 1 hingga 13 (bebas: cth slot 1 pagi atau slot 11 petang)
  slotCount: number;     // cth: 2 waktu (1 jam), 3 waktu (1.5 jam), 4 waktu (2 jam)
  label: string;
  targetStages: AcademicStage[];
}

export interface LockedSlot {
  id: string;
  classId: string;
  subjectCode: string;
  teacherId: string;
  roomId?: string;
  day: number;
  slotIndex: number;
  blockSize: number;
}

export interface RecessGroupConfig {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  targetStages: AcademicStage[];
}

export interface SchoolProfileState {
  code: string;
  name: string;
  schoolType: SchoolType;
  schoolCategory: SchoolCategory;
  sessionStructure: SchoolSession;
  stateGroup: StateGroup;
  effectiveAcademicWeeks: number;
}

export interface TimeGridConfigState {
  morningStartTime: string;
  afternoonStartTime: string;
  slotDurationMinutes: number;
  totalDailySlots: number; // 10 slot (Kebangsaan) atau 13 slot (Integrasi)
  assemblyDay: number;
  assemblySlot: number;
  fridayMaxSlots: number;  // Had PdP Jumaat (cth: maksimum 4 waktu bagi guru)
  fridayDismissalSlot: number; // Waktu bersurai Jumaat (cth: slot 9 / 12:00 tengah hari)
  recessMode: RecessMode;
  recessGroup1: RecessGroupConfig;
  recessGroup2: RecessGroupConfig;
  lunchPrayerSlot?: number; // Slot Rehat Makan/Zohor Integrasi (cth: Slot 11)
  cocurricularConfig: CocurricularConfig; // Tetapan Bebas Kokurikulum
  enforceTeacherRest: boolean;
  maxConsecutiveSlots: number;
}

export interface TeacherFormState {
  id: string;
  code: string;
  fullName: string;
  role: TeacherRole;
  majors: string[];
  maxWeeklySlots: number;
  dailyMinSlots: number;
  dailyMaxSlots: number;
  fridayMaxSlots: number;
  assignedSession: SessionType | 'CROSS_SESSION';
  exemptFromOutdoor: boolean;
  isActive: boolean;
}

export interface RoomFormState {
  id: string;
  code: string;
  name: string;
  roomType: RoomType;
  capacity: number;
  isSharedAcrossSessions: boolean;
}

export interface SubjectDemandFormItem {
  id: string;
  code: string;
  name: string;
  category: 'CORE_ACADEMIC' | 'DINIYAH_RELIGIOUS' | 'ELECTIVE' | 'SPECIAL';
  annualHours: number;
  weeklySlots: number;
  blockSize: BlockSize;
  distributionProfile: DistributionProfile;
  assignedTeacherId: string;
  requiredRoomType: RoomType;
  preferredRoomId?: string;
  isParallel: boolean;
  parallelSyncKey?: string;
}

export interface ClassCohortConfig {
  id: string;
  name: string;
  gradeLevel: number;
  academicStage: AcademicStage;
  session: SessionType;
  homeroomId?: string;
  demands: SubjectDemandFormItem[];
}

export interface TimetableEntry {
  id: string;
  timetableId: string;
  classId: string;
  timeSlotId: string;
  subjectId: string;
  teacherId: string;
  roomId?: string | null;
  parallelGroupId?: string | null;
  blockInstanceId: string;
  isLocked: boolean;
  isCocurricular?: boolean;
}
// Tambahan di dalam src/types/timetable.ts

export interface TeacherAllocation {
  teacherId: string;
  slots: number;
}

export interface SubjectDemandFormItem {
  id: string;
  code: string;
  name: string;
  category: 'CORE_ACADEMIC' | 'DINIYAH_RELIGIOUS' | 'ELECTIVE' | 'SPECIAL';
  annualHours: number;
  weeklySlots: number;
  blockSize: BlockSize;
  distributionProfile: DistributionProfile;
  assignedTeacherId: string; // Guru utama / lalai
  teacherAllocations?: TeacherAllocation[]; // Sokongan pecahan berbilang guru
  requiredRoomType: RoomType;
  preferredRoomId?: string;
  isParallel: boolean;
  parallelSyncKey?: string;
}
export interface TimeGridConfigState {
  morningStartTime: string;
  afternoonStartTime: string;
  slotDurationMinutes: number;
  totalDailySlots: number;
  assemblyDay: number;
  assemblySlot: number;
  fridayMaxSlots: number;
  fridayDismissalSlot: number;
  recessMode: RecessMode;
  recessGroup1: RecessGroupConfig;
  recessGroup2: RecessGroupConfig;
  lunchPrayerSlot?: number;
  cocurricularConfig: CocurricularConfig;
  enforceTeacherRest: boolean;
  maxConsecutiveSlots: number;
  // Tambah 2 medan ini:
  stateGroup?: StateGroup;
  sessionStructure?: SchoolSession;
}
// Tambahan di dalam src/types/timetable.ts

export type FlexibleScheduleType = 'RAMADAN' | 'EXAM_COMPRESSED' | 'SPECIAL_EVENT' | 'CUSTOM';

export interface FlexibleScheduleConfig {
  enabled: boolean;
  name: string;
  type: FlexibleScheduleType;
  slotDurationMinutes: number; // cth: 20 minit (Ramadan) atau 25 minit
  startTime: string;           // cth: "07:30"
  maxSlotsPerDay?: number;     // cth: 8 waktu (balik awal) atau kekal penuh
  recessDurationMinutes: number; // cth: 15 minit (rehat santai/tazkirah)
  labelBadge: string;
  effectiveNote?: string;
}
// Di dalam src/types/timetable.ts

export type RoomType = 
  | 'CLASSROOM' 
  | 'SCIENCE_LAB' 
  | 'RBT_WORKSHOP' 
  | 'FIELD' 
  | 'SURAU' 
  | 'ART_STUDIO' 
  | 'COMPUTER_LAB' 
  | 'HALL'
  | 'LIBRARY'; // Tambah kategori bilik perpustakaan / PSS

export interface SubjectDemandFormItem {
  id: string;
  code: string;
  name: string;
  category: 'CORE_ACADEMIC' | 'DINIYAH_RELIGIOUS' | 'ELECTIVE' | 'SPECIAL';
  annualHours: number;
  weeklySlots: number;
  blockSize: BlockSize;
  distributionProfile: DistributionProfile;
  assignedTeacherId: string;
  teacherAllocations?: TeacherAllocation[];
  requiredRoomType: RoomType;
  preferredRoomId?: string;
  isParallel: boolean;
  parallelSyncKey?: string;
  hasNilamSlot?: boolean; // Tagging manual admin: 1 waktu PdP dijalankan di PSS untuk NILAM
}

export interface TimetableEntry {
  id: string;
  timetableId: string;
  classId: string;
  timeSlotId: string;
  subjectId: string;
  teacherId: string;
  roomId?: string | null;
  parallelGroupId?: string | null;
  blockInstanceId: string;
  isLocked: boolean;
  isCocurricular?: boolean;
  isNilam?: boolean; // Penanda slot aktiviti NILAM di PSS
}
// Di dalam src/app/wizard/page.tsx (senarai rooms lalai):
  const [rooms, setRooms] = useState<RoomFormState[]>([
    { id: 'r_anggerik', code: 'B_ANGGERIK', name: 'Bilik Anggerik', roomType: 'CLASSROOM', capacity: 1, isSharedAcrossSessions: true },
    { id: 'r_lily', code: 'B_LILY', name: 'Bilik Lily', roomType: 'CLASSROOM', capacity: 1, isSharedAcrossSessions: true },
    { id: 'r_melur', code: 'B_MELUR', name: 'Bilik Melur', roomType: 'CLASSROOM', capacity: 1, isSharedAcrossSessions: true },
    { id: 'r_sn1', code: 'LAB_SN1', name: 'Makmal Sains 1', roomType: 'SCIENCE_LAB', capacity: 1, isSharedAcrossSessions: true },
    { id: 'r_padang', code: 'PADANG', name: 'Padang Utama', roomType: 'FIELD', capacity: 2, isSharedAcrossSessions: true },
    { id: 'r_surau', code: 'SURAU', name: 'Surau An-Nur', roomType: 'SURAU', capacity: 2, isSharedAcrossSessions: true },
    { id: 'r_pss', code: 'PSS', name: 'Pusat Sumber Sekolah (PSS)', roomType: 'LIBRARY', capacity: 1, isSharedAcrossSessions: true },
    { id: 'r_rbt', code: 'BENGKEL_RBT', name: 'Bengkel RBT', roomType: 'RBT_WORKSHOP', capacity: 1, isSharedAcrossSessions: true },
  ]);
  // Tambah/Kemas kini jenis peranan guru di src/types/timetable.ts
export type TeacherRole =
  | 'NORMAL'
  | 'ADMIN_PK'
  | 'COUNSELOR'
  | 'LEAVE_MATERNITY'   // Cuti Bersalin (CK)
  | 'LEAVE_PILGRIMAGE'   // Cuti Haji / Umrah (CK)
  | 'LEAVE_MEDICAL'      // Rawatan Kesihatan Berpanjangan (CK)
  | 'LEAVE_STUDY'        // Cuti Belajar (CK)
  | 'LEAVE_OTHER';       // Cuti Khas Lain (CK)

export interface TeacherFormState {
  id: string;
  code: string;
  fullName: string;
  role: TeacherRole | string;
  subjectCodes: string[];
  maxWeeklySlots: number;
  maxDailySlots: number;
  fridayMaxSlots: number;
  isSpecialLeave?: boolean;
  notes?: string;
}