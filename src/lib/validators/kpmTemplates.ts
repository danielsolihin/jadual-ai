// src/lib/validators/kpmTemplates.ts
import { AcademicStage, RoomType, BlockSize } from '@/types/timetable';

export interface DefaultSubjectTemplate {
  code: string;
  name: string;
  annualHours: number;
  weeklySlots: number;
  defaultBlock: BlockSize;
  requiredRoomType: RoomType;
  isParallel: boolean;
  parallelSyncKey?: string;
}

// 1. KSSR TAHAP 1 (Tahun 1, 2, 3) - 704 Jam (44 Waktu)
export const KSSR_STAGE_1_TEMPLATE: DefaultSubjectTemplate[] = [
  { code: 'BM', name: 'Bahasa Melayu', annualHours: 192, weeklySlots: 12, defaultBlock: 'DOUBLE', requiredRoomType: 'CLASSROOM', isParallel: false },
  { code: 'BI', name: 'Bahasa Inggeris', annualHours: 160, weeklySlots: 10, defaultBlock: 'DOUBLE', requiredRoomType: 'CLASSROOM', isParallel: false },
  { code: 'MAT', name: 'Matematik', annualHours: 96, weeklySlots: 6, defaultBlock: 'DOUBLE', requiredRoomType: 'CLASSROOM', isParallel: false },
  { code: 'SN', name: 'Sains', annualHours: 48, weeklySlots: 3, defaultBlock: 'DOUBLE', requiredRoomType: 'SCIENCE_LAB', isParallel: false },
  { code: 'PI', name: 'Pendidikan Islam', annualHours: 96, weeklySlots: 6, defaultBlock: 'DOUBLE', requiredRoomType: 'SURAU', isParallel: true, parallelSyncKey: 'PI_PM' },
  { code: 'PM', name: 'Pendidikan Moral', annualHours: 96, weeklySlots: 6, defaultBlock: 'DOUBLE', requiredRoomType: 'CLASSROOM', isParallel: true, parallelSyncKey: 'PI_PM' },
  { code: 'PSV', name: 'Pendidikan Seni Visual', annualHours: 32, weeklySlots: 2, defaultBlock: 'DOUBLE', requiredRoomType: 'ART_STUDIO', isParallel: false },
  { code: 'MZ', name: 'Pendidikan Muzik', annualHours: 16, weeklySlots: 1, defaultBlock: 'SINGLE', requiredRoomType: 'CLASSROOM', isParallel: false },
  { code: 'PJK', name: 'Pendidikan Jasmani & Kesihatan', annualHours: 48, weeklySlots: 3, defaultBlock: 'DOUBLE', requiredRoomType: 'FIELD', isParallel: false },
  { code: 'PERH', name: 'Perhimpunan Rasmi', annualHours: 16, weeklySlots: 1, defaultBlock: 'SINGLE', requiredRoomType: 'HALL', isParallel: false },
];

// 2. KSSR TAHAP 2 (Tahun 4, 5, 6) - 752 Jam (47 Waktu)
export const KSSR_STAGE_2_TEMPLATE: DefaultSubjectTemplate[] = [
  { code: 'BM', name: 'Bahasa Melayu', annualHours: 160, weeklySlots: 10, defaultBlock: 'DOUBLE', requiredRoomType: 'CLASSROOM', isParallel: false },
  { code: 'BI', name: 'Bahasa Inggeris', annualHours: 160, weeklySlots: 10, defaultBlock: 'DOUBLE', requiredRoomType: 'CLASSROOM', isParallel: false },
  { code: 'MAT', name: 'Matematik', annualHours: 96, weeklySlots: 6, defaultBlock: 'DOUBLE', requiredRoomType: 'CLASSROOM', isParallel: false },
  { code: 'SN', name: 'Sains', annualHours: 64, weeklySlots: 4, defaultBlock: 'DOUBLE', requiredRoomType: 'SCIENCE_LAB', isParallel: false },
  { code: 'SEJ', name: 'Sejarah', annualHours: 32, weeklySlots: 2, defaultBlock: 'DOUBLE', requiredRoomType: 'CLASSROOM', isParallel: false },
  { code: 'RBT', name: 'Reka Bentuk & Teknologi', annualHours: 32, weeklySlots: 2, defaultBlock: 'DOUBLE', requiredRoomType: 'RBT_WORKSHOP', isParallel: false },
  { code: 'PI', name: 'Pendidikan Islam', annualHours: 96, weeklySlots: 6, defaultBlock: 'DOUBLE', requiredRoomType: 'SURAU', isParallel: true, parallelSyncKey: 'PI_PM' },
  { code: 'PM', name: 'Pendidikan Moral', annualHours: 96, weeklySlots: 6, defaultBlock: 'DOUBLE', requiredRoomType: 'CLASSROOM', isParallel: true, parallelSyncKey: 'PI_PM' },
  { code: 'PSV', name: 'Pendidikan Seni Visual', annualHours: 32, weeklySlots: 2, defaultBlock: 'DOUBLE', requiredRoomType: 'ART_STUDIO', isParallel: false },
  { code: 'MZ', name: 'Pendidikan Muzik', annualHours: 16, weeklySlots: 1, defaultBlock: 'SINGLE', requiredRoomType: 'CLASSROOM', isParallel: false },
  { code: 'PJK', name: 'Pendidikan Jasmani & Kesihatan', annualHours: 48, weeklySlots: 3, defaultBlock: 'DOUBLE', requiredRoomType: 'FIELD', isParallel: false },
  { code: 'PERH', name: 'Perhimpunan Rasmi', annualHours: 16, weeklySlots: 1, defaultBlock: 'SINGLE', requiredRoomType: 'HALL', isParallel: false },
];

// 3. KSSM MENENGAH RENDAH (Tingkatan 1, 2, 3) - 856 Jam (54 Waktu)
export const KSSM_LOWER_SEC_TEMPLATE: DefaultSubjectTemplate[] = [
  { code: 'BM', name: 'Bahasa Melayu', annualHours: 128, weeklySlots: 8, defaultBlock: 'DOUBLE', requiredRoomType: 'CLASSROOM', isParallel: false },
  { code: 'BI', name: 'Bahasa Inggeris', annualHours: 112, weeklySlots: 7, defaultBlock: 'DOUBLE', requiredRoomType: 'CLASSROOM', isParallel: false },
  { code: 'MAT', name: 'Matematik', annualHours: 112, weeklySlots: 7, defaultBlock: 'DOUBLE', requiredRoomType: 'CLASSROOM', isParallel: false },
  { code: 'SN', name: 'Sains', annualHours: 112, weeklySlots: 7, defaultBlock: 'DOUBLE', requiredRoomType: 'SCIENCE_LAB', isParallel: false },
  { code: 'SEJ', name: 'Sejarah', annualHours: 64, weeklySlots: 4, defaultBlock: 'DOUBLE', requiredRoomType: 'CLASSROOM', isParallel: false },
  { code: 'GEO', name: 'Geografi', annualHours: 48, weeklySlots: 3, defaultBlock: 'DOUBLE', requiredRoomType: 'CLASSROOM', isParallel: false },
  { code: 'PI', name: 'Pendidikan Islam', annualHours: 128, weeklySlots: 8, defaultBlock: 'DOUBLE', requiredRoomType: 'SURAU', isParallel: true, parallelSyncKey: 'PI_PM' },
  { code: 'PM', name: 'Pendidikan Moral', annualHours: 128, weeklySlots: 8, defaultBlock: 'DOUBLE', requiredRoomType: 'CLASSROOM', isParallel: true, parallelSyncKey: 'PI_PM' },
  { code: 'RBT_ASK', name: 'RBT / ASK', annualHours: 64, weeklySlots: 4, defaultBlock: 'DOUBLE', requiredRoomType: 'RBT_WORKSHOP', isParallel: true, parallelSyncKey: 'RBT_ASK' },
  { code: 'PJK', name: 'PJK', annualHours: 32, weeklySlots: 2, defaultBlock: 'DOUBLE', requiredRoomType: 'FIELD', isParallel: false },
  { code: 'PSV_MZ', name: 'PSV / Muzik', annualHours: 32, weeklySlots: 2, defaultBlock: 'DOUBLE', requiredRoomType: 'ART_STUDIO', isParallel: false },
  { code: 'PERH', name: 'Perhimpunan Rasmi', annualHours: 16, weeklySlots: 1, defaultBlock: 'SINGLE', requiredRoomType: 'HALL', isParallel: false },
];