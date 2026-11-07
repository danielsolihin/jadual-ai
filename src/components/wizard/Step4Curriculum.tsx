// src/components/wizard/Step4Curriculum.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  ClassCohortConfig, 
  TeacherFormState, 
  RoomFormState, 
  SchoolType, 
  LockedSlot, 
  TeacherAllocation, 
  SubjectDemandFormItem, 
  RoomType,
  AcademicStage,
  TimeGridConfigState
} from '@/types/timetable';
import { supabase } from '@/lib/supabase';
import styles from './Step4Curriculum.module.css';
import { 
  BookOpen, 
  CheckCircle, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Users, 
  UserPlus, 
  CheckSquare, 
  Square, 
  AlertCircle,
  Layers,
  Sparkles,
  Library,
  Copy,
  Star,
  Calendar,
  Link2,
  X,
  DoorOpen,
  Clock,
  RotateCcw
} from 'lucide-react';

export type TimeBandPreference = 'ANY' | 'PRE_RECESS' | 'POST_RECESS' | 'AFTERNOON';

export interface PredefinedSubject {
  code: string;
  name: string;
  defaultSlots: number;
  category: 'CORE_ACADEMIC' | 'DINIYAH_RELIGIOUS' | 'ELECTIVE' | 'SPECIAL';
  requiredRoomType: RoomType | string;
  isParallel?: boolean;
  parallelSyncKey?: string;
  timeBandPreference?: TimeBandPreference;
}

const INITIAL_SUBJECT_REGISTRY: PredefinedSubject[] = [
  { code: 'BM', name: 'Bahasa Melayu', defaultSlots: 10, category: 'CORE_ACADEMIC', requiredRoomType: 'CLASSROOM', timeBandPreference: 'ANY' },
  { code: 'BI', name: 'Bahasa Inggeris', defaultSlots: 8, category: 'CORE_ACADEMIC', requiredRoomType: 'CLASSROOM', timeBandPreference: 'ANY' },
  { code: 'MAT', name: 'Matematik', defaultSlots: 6, category: 'CORE_ACADEMIC', requiredRoomType: 'CLASSROOM', timeBandPreference: 'ANY' },
  { code: 'SN', name: 'Sains', defaultSlots: 4, category: 'CORE_ACADEMIC', requiredRoomType: 'SCIENCE_LAB', timeBandPreference: 'ANY' },
  { code: 'PI', name: 'Pendidikan Islam', defaultSlots: 5, category: 'DINIYAH_RELIGIOUS', requiredRoomType: 'SURAU', isParallel: true, parallelSyncKey: 'PI_PM', timeBandPreference: 'ANY' },
  { code: 'PM', name: 'Pendidikan Moral', defaultSlots: 5, category: 'CORE_ACADEMIC', requiredRoomType: 'CLASSROOM', isParallel: true, parallelSyncKey: 'PI_PM', timeBandPreference: 'ANY' },
  { code: 'PJK', name: 'Pendidikan Jasmani & Kesihatan', defaultSlots: 3, category: 'SPECIAL', requiredRoomType: 'FIELD', timeBandPreference: 'ANY' },
  { code: 'PSV', name: 'Pendidikan Seni Visual', defaultSlots: 2, category: 'ELECTIVE', requiredRoomType: 'CLASSROOM', timeBandPreference: 'ANY' },
  { code: 'MZ', name: 'Pendidikan Muzik', defaultSlots: 1, category: 'ELECTIVE', requiredRoomType: 'CLASSROOM', timeBandPreference: 'ANY' },
  { code: 'RBT', name: 'Reka Bentuk & Teknologi', defaultSlots: 2, category: 'ELECTIVE', requiredRoomType: 'RBT_WORKSHOP', timeBandPreference: 'ANY' },
  { code: 'SEJ', name: 'Sejarah', defaultSlots: 2, category: 'CORE_ACADEMIC', requiredRoomType: 'CLASSROOM', timeBandPreference: 'ANY' },
  { code: 'BA', name: 'Bahasa Arab', defaultSlots: 3, category: 'DINIYAH_RELIGIOUS', requiredRoomType: 'CLASSROOM', timeBandPreference: 'ANY' },
  { code: 'FEQ_S', name: "Fiqh Syafi'i", defaultSlots: 3, category: 'DINIYAH_RELIGIOUS', requiredRoomType: 'SURAU', isParallel: true, parallelSyncKey: 'FIQH_MAZHAB', timeBandPreference: 'ANY' },
  { code: 'FEQ_H', name: 'Fiqh Hanafi', defaultSlots: 3, category: 'DINIYAH_RELIGIOUS', requiredRoomType: 'CLASSROOM', isParallel: true, parallelSyncKey: 'FIQH_MAZHAB', timeBandPreference: 'ANY' },
  { code: 'TAH', name: 'Tauhid', defaultSlots: 2, category: 'DINIYAH_RELIGIOUS', requiredRoomType: 'CLASSROOM', timeBandPreference: 'ANY' },
  { code: 'SIR', name: 'Sirah', defaultSlots: 2, category: 'DINIYAH_RELIGIOUS', requiredRoomType: 'CLASSROOM', timeBandPreference: 'ANY' },
  { code: 'AKH', name: 'Akhlak', defaultSlots: 2, category: 'DINIYAH_RELIGIOUS', requiredRoomType: 'CLASSROOM', timeBandPreference: 'ANY' },
  { code: 'TAF', name: 'Tahfiz / Hafazan', defaultSlots: 3, category: 'DINIYAH_RELIGIOUS', requiredRoomType: 'SURAU', timeBandPreference: 'ANY' },
];

interface Props {
  classes?: ClassCohortConfig[];
  teachers?: TeacherFormState[];
  rooms?: RoomFormState[];
  schoolType?: SchoolType;
  timeGridConfig?: TimeGridConfigState;
  stateGroup?: string;
  lockedSlots?: LockedSlot[];
  onUpdateClasses?: (updatedClasses: ClassCohortConfig[]) => void;
  setClasses?: React.Dispatch<React.SetStateAction<ClassCohortConfig[]>> | ((classes: ClassCohortConfig[]) => void);
  onUpdateLockedSlots?: (slots: LockedSlot[]) => void;
  subjectRegistry?: PredefinedSubject[];
  setSubjectRegistry?: React.Dispatch<React.SetStateAction<PredefinedSubject[]>> | ((subs: PredefinedSubject[]) => void);
  onNext: () => void;
  onBack: () => void;
  [key: string]: any;
}

const getSavedTimeBandMap = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('timetable_saved_timebands') || '{}');
  } catch (e) {
    return {};
  }
};

const resolveTimeBand = (
  classId: string | undefined, 
  className: string | undefined, 
  subjectCode: string | undefined, 
  demandId: string | undefined,
  currentVal: string | undefined,
  savedMap: Record<string, string>
): TimeBandPreference => {
  const code = (subjectCode || '').toUpperCase().trim();
  const keys = [
    className && code ? `${className}_${code}` : null,
    classId && code ? `${classId}_${code}` : null,
    demandId || null,
  ].filter(Boolean) as string[];

  for (const k of keys) {
    if (savedMap[k]) return savedMap[k] as TimeBandPreference;
  }

  if (currentVal && currentVal !== 'ANY') return currentVal as TimeBandPreference;
  return 'ANY';
};

const applySavedTimeBands = (classesList: ClassCohortConfig[]): ClassCohortConfig[] => {
  if (!classesList || classesList.length === 0) return classesList;
  const saved = getSavedTimeBandMap();
  return classesList.map(c => ({
    ...c,
    demands: (c.demands || []).map(d => {
      const pref = resolveTimeBand(c.id, c.name, d.code, d.id, d.timeBandPreference, saved);
      return {
        ...d,
        timeBandPreference: pref,
        isPrimeTimePriority: pref === 'PRE_RECESS'
      };
    })
  }));
};

export default function Step4Curriculum(props: Props) {
  const {
    classes = [],
    teachers = [],
    rooms = [],
    schoolType,
    timeGridConfig,
    stateGroup = 'GROUP_B',
    lockedSlots = [],
    onUpdateClasses,
    setClasses,
    onUpdateLockedSlots,
    onNext,
    onBack,
  } = props;

  const [localClasses, setLocalClasses] = useState<ClassCohortConfig[]>(() => {
    return applySavedTimeBands(classes || []);
  });
  const [selectedClassIndex, setSelectedClassIndex] = useState(0);

  const [stageFilter, setStageFilter] = useState<'ALL' | AcademicStage>('ALL');
  const [yearFilter, setYearFilter] = useState<number | 'ALL'>('ALL');

  // Modal ralat apabila Seterusnya diklik
  const [overloadErrorModal, setOverloadErrorModal] = useState<{
    isOpen: boolean;
    errors: { className: string; demanded: number; maxAllowed: number; duplicates: string[] }[];
  }>({ isOpen: false, errors: [] });

  const [subjectRegistry, setSubjectRegistry] = useState<PredefinedSubject[]>(() => {
    let base = INITIAL_SUBJECT_REGISTRY;
    if (props.subjectRegistry && props.subjectRegistry.length > 0) {
      base = props.subjectRegistry;
    }
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('timetable_custom_subjects');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const map = new Map<string, PredefinedSubject>();
            base.forEach(s => map.set(s.code, { ...s, timeBandPreference: 'ANY' }));
            parsed.forEach(s => map.set(s.code, { ...s, timeBandPreference: s.timeBandPreference || 'ANY' }));
            return Array.from(map.values());
          }
        }
      } catch (e) {}
    }
    return base;
  });

  const notifyClassesUpdate = (updated: ClassCohortConfig[]) => {
    setLocalClasses(updated);
    if (typeof onUpdateClasses === 'function') onUpdateClasses(updated);
    if (typeof setClasses === 'function') (setClasses as any)(updated);
    if (typeof props.onUpdate === 'function') props.onUpdate({ classes: updated });
  };

  const handleBackNavigation = () => {
    if (typeof onBack === 'function') {
      onBack();
    }
  };

  useEffect(() => {
    if (classes && classes.length > 0) {
      setLocalClasses(prev => {
        const source = prev.length > 0 ? prev : classes;
        return applySavedTimeBands(source);
      });
    }
  }, [classes]);

  useEffect(() => {
    async function fetchAllDataFromSupabase() {
      try {
        const { data: dbSubjects } = await supabase
          .from('subjects')
          .select('*')
          .order('name', { ascending: true });

        let loadedFromDb: PredefinedSubject[] = [];
        if (dbSubjects && dbSubjects.length > 0) {
          loadedFromDb = dbSubjects.map((s: any) => ({
            code: s.code || s.subject_code,
            name: s.name || s.subject_name,
            defaultSlots: Number(s.default_slots ?? s.defaultSlots ?? 2),
            category: s.category || 'CORE_ACADEMIC',
            requiredRoomType: s.required_room_type || s.requiredRoomType || 'CLASSROOM',
            isParallel: Boolean(s.is_parallel ?? s.isParallel),
            parallelSyncKey: s.parallel_sync_key || s.parallelSyncKey || undefined,
            timeBandPreference: s.time_band_preference || 'ANY',
          }));
        }

        setSubjectRegistry(prev => {
          const map = new Map<string, PredefinedSubject>();
          INITIAL_SUBJECT_REGISTRY.forEach(s => map.set(s.code, s));
          prev.forEach(s => map.set(s.code, s));
          loadedFromDb.forEach(s => map.set(s.code, s));
          return Array.from(map.values());
        });
      } catch (err) {}

      try {
        const { data: dbClasses, error } = await supabase
          .from('classes')
          .select('*, class_subject_demands(*)')
          .order('year_level', { ascending: true });

        if (!error && dbClasses && dbClasses.length > 0) {
          const savedBandsMap = getSavedTimeBandMap();

          const formatted: ClassCohortConfig[] = dbClasses.map((c: any) => ({
            id: c.id,
            name: c.name,
            gradeLevel: c.grade_level ?? c.year_level ?? 1,
            yearLevel: c.year_level ?? c.grade_level ?? 1,
            academicStage: c.academic_stage || ((c.grade_level || c.year_level || 1) <= 3 ? 'STAGE_1' : 'STAGE_2'),
            homeroomId: c.homeroom_id || undefined,
            demands: (c.class_subject_demands || []).map((d: any) => {
              const persistentPreference = resolveTimeBand(
                c.id, 
                c.name, 
                d.subject_code, 
                d.id, 
                d.time_band_preference, 
                savedBandsMap
              );

              return {
                id: d.id,
                code: d.subject_code,
                name: d.subject_name,
                weeklySlots: d.weekly_slots,
                assignedTeacherId: d.subject_code === 'PERH' ? 'ALL_TEACHERS' : (d.assigned_teacher_id || ''),
                requiredRoomType: d.required_room_type,
                roomId: d.room_id || d.roomId || undefined,
                timeBandPreference: persistentPreference,
                isPrimeTimePriority: Boolean(persistentPreference === 'PRE_RECESS'),
                isParallel: d.is_parallel,
                parallelSyncKey: d.parallel_sync_key,
                teacherAllocations: d.teacher_allocations || [],
                allowedDays: d.allowed_days || (d.subject_code === 'PERH' ? [1] : [1, 2, 3, 4, 5]),
              };
            }),
          }));

          setLocalClasses(formatted);
          if (typeof setClasses === 'function') (setClasses as any)(formatted);
          if (typeof onUpdateClasses === 'function') onUpdateClasses(formatted);
        }
      } catch (err) {}
    }

    fetchAllDataFromSupabase();
  }, []);

  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [checkedBankCodes, setCheckedBankCodes] = useState<string[]>([]);
  const [syncBankToAllInGrade, setSyncBankToAllInGrade] = useState(true);

  const [selectedDemandIds, setSelectedDemandIds] = useState<string[]>([]);
  const [splittingDemandId, setSplittingDemandId] = useState<string | null>(null);
  const [modalAllocations, setModalAllocations] = useState<TeacherAllocation[]>([]);

  const activeClassesList = localClasses.length > 0 ? localClasses : classes;

  const isGroupA = stateGroup === 'GROUP_A' || timeGridConfig?.stateGroup === 'GROUP_A';
  const dayPills = isGroupA
    ? [{ day: 1, label: 'A', name: 'Ahad' }, { day: 2, label: 'I', name: 'Isnin' }, { day: 3, label: 'S', name: 'Selasa' }, { day: 4, label: 'R', name: 'Rabu' }, { day: 5, label: 'K', name: 'Khamis' }]
    : [{ day: 1, label: 'I', name: 'Isnin' }, { day: 2, label: 'S', name: 'Selasa' }, { day: 3, label: 'R', name: 'Rabu' }, { day: 4, label: 'K', name: 'Khamis' }, { day: 5, label: 'J', name: 'Jumaat' }];

  const availableYears = useMemo(() => {
    if (stageFilter === 'STAGE_1') return [1, 2, 3];
    if (stageFilter === 'STAGE_2') return [4, 5, 6];
    return [1, 2, 3, 4, 5, 6];
  }, [stageFilter]);

  const getNormalizedGrade = (c: ClassCohortConfig): number => {
    const val = c.gradeLevel ?? c.yearLevel;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const parsed = parseInt(String(val).replace(/\D/g, ''), 10);
      return isNaN(parsed) ? 1 : parsed;
    }
    return 1;
  };

  const getNormalizedStage = (c: ClassCohortConfig): AcademicStage => {
    if (c.academicStage === 'STAGE_1' || c.academicStage === 'STAGE_2') return c.academicStage;
    const g = getNormalizedGrade(c);
    return g <= 3 ? 'STAGE_1' : 'STAGE_2';
  };

  const filteredClassesWithIndex = useMemo(() => {
    return activeClassesList
      .map((c, originalIdx) => ({ classData: c, originalIdx }))
      .filter(({ classData }) => {
        const grade = getNormalizedGrade(classData);
        const stage = getNormalizedStage(classData);

        if (stageFilter !== 'ALL' && stage !== stageFilter) return false;
        if (yearFilter !== 'ALL' && grade !== Number(yearFilter)) return false;
        return true;
      });
  }, [activeClassesList, stageFilter, yearFilter]);

  useEffect(() => {
    if (filteredClassesWithIndex.length > 0) {
      const isCurrentInFilter = filteredClassesWithIndex.some(f => f.originalIdx === selectedClassIndex);
      if (!isCurrentInFilter) {
        setSelectedClassIndex(filteredClassesWithIndex[0].originalIdx);
        setSelectedDemandIds([]);
      }
    }
  }, [filteredClassesWithIndex, selectedClassIndex]);

  const currentClass = activeClassesList[selectedClassIndex] || activeClassesList[0] || null;
  const currentGrade = currentClass ? getNormalizedGrade(currentClass) : 1;

  const currentRoom = useMemo(() => {
    if (!currentClass?.homeroomId) return null;
    return rooms.find(r => r.id === currentClass.homeroomId || r.code === currentClass.homeroomId);
  }, [rooms, currentClass?.homeroomId]);

  const perhDemand = useMemo(() => {
    if (!currentClass?.demands) return null;
    return currentClass.demands.find(d => d.code === 'PERH') || null;
  }, [currentClass]);

  const getTeacherDisplayName = (t: TeacherFormState) => {
    let mark = '';
    if (t.role === 'ADMIN_GB' || t.role === 'ADMIN_PK') mark = ' (P)';
    else if (t.role === 'COUNSELOR') mark = ' (K)';
    else if (t.role === 'PREGNANT') mark = ' (M)';
    else if (t.role === 'MEDICAL_CHRONIC') mark = ' (S)';
    else if (t.role === 'MATERNITY_LEAVE' || (typeof t.role === 'string' && t.role.includes('LEAVE'))) mark = ' (C)';
    return `${t.code} - ${t.fullName}${mark}`;
  };

  const getCategoryBadgeStyle = (category?: string) => {
    switch (category) {
      case 'CORE_ACADEMIC':
        return { backgroundColor: '#eff6ff', color: '#1e40af', borderColor: '#bfdbfe' };
      case 'DINIYAH_RELIGIOUS':
        return { backgroundColor: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' };
      case 'ELECTIVE':
        return { backgroundColor: '#faf5ff', color: '#7e22ce', borderColor: '#e9d5ff' };
      case 'SPECIAL':
        return { backgroundColor: '#fff7ed', color: '#c2410c', borderColor: '#fed7aa' };
      default:
        return { backgroundColor: '#f1f5f9', color: '#334155', borderColor: '#cbd5e1' };
    }
  };

  const checkIsClassComplete = (cls: ClassCohortConfig): boolean => {
    if (!cls || !cls.demands || cls.demands.length === 0) return false;
    for (const d of cls.demands) {
      if (d.code === 'PERH') continue;
      if (d.teacherAllocations && d.teacherAllocations.length > 1) {
        if (!d.teacherAllocations.every(a => Boolean(a.teacherId))) return false;
      } else {
        if (!d.assignedTeacherId) return false;
      }
    }
    return true;
  };

  // KIRAAN BEBAN MINGGUAN KELAS
  const calculateTotalWeeklySlots = (clsDemands: SubjectDemandFormItem[]) => {
    if (!clsDemands) return 0;
    let total = 0;
    const countedParallelKeys = new Set<string>();

    for (const d of clsDemands) {
      if (d.isParallel && d.parallelSyncKey) {
        if (!countedParallelKeys.has(d.parallelSyncKey)) {
          total += Number(d.weeklySlots) || 0;
          countedParallelKeys.add(d.parallelSyncKey);
        }
      } else {
        total += Number(d.weeklySlots) || 0;
      }
    }
    return total;
  };

  const currentTotalSlots = currentClass ? calculateTotalWeeklySlots(currentClass.demands) : 0;
  const targetSlots = currentClass?.academicStage === 'STAGE_1' ? 44 : currentClass?.academicStage === 'STAGE_2' ? 47 : 54;
  const isQuotaMatched = currentTotalSlots <= targetSlots;
  const isOverQuota = currentTotalSlots > targetSlots;

  // Audit Bertindih: Kenal pasti subjek yang didaftarkan dua kali dalam satu kelas (cth: SIR ada 2 baris berasingan)
  const getDuplicateSubjects = (clsDemands: SubjectDemandFormItem[]): string[] => {
    const counts = new Map<string, number>();
    clsDemands.forEach(d => {
      counts.set(d.code, (counts.get(d.code) || 0) + 1);
    });
    return Array.from(counts.entries()).filter(([_, cnt]) => cnt > 1).map(([cd]) => cd);
  };

  const duplicateSubjectsInCurrentClass = currentClass ? getDuplicateSubjects(currentClass.demands) : [];

  const updateCurrentClassDemands = (newDemands: SubjectDemandFormItem[]) => {
    const updated = activeClassesList.map((c, idx) =>
      idx === selectedClassIndex ? { ...c, demands: newDemands } : c
    );
    notifyClassesUpdate(updated);
  };

  // =========================================================================
  // FUNGSI SIMPAN ZON WAKTU KEKAL (MULTI-KEY LOCALSTORAGE + SUPABASE)
  // =========================================================================
  const handleTimeBandChange = async (demandId: string, preference: TimeBandPreference) => {
    if (!currentClass) return;
    const targetDemand = currentClass.demands.find(d => d.id === demandId);
    if (!targetDemand) return;

    const updatedDemands = currentClass.demands.map(d => {
      if (d.id === demandId) {
        return { ...d, timeBandPreference: preference, isPrimeTimePriority: preference === 'PRE_RECESS' };
      }
      return d;
    });
    updateCurrentClassDemands(updatedDemands);

    if (typeof window !== 'undefined') {
      try {
        const savedBands = JSON.parse(localStorage.getItem('timetable_saved_timebands') || '{}');
        const code = (targetDemand.code || '').toUpperCase().trim();
        if (currentClass.name && code) savedBands[`${currentClass.name}_${code}`] = preference;
        if (currentClass.id && code) savedBands[`${currentClass.id}_${code}`] = preference;
        if (demandId) savedBands[demandId] = preference;
        localStorage.setItem('timetable_saved_timebands', JSON.stringify(savedBands));
      } catch (e) {}
    }

    try {
      await supabase.from('class_subject_demands').update({ time_band_preference: preference, is_prime_time_priority: preference === 'PRE_RECESS' }).eq('id', demandId);
    } catch (err) {}
  };

  const handlePerhDayChange = async (demandId: string, dayNum: number) => {
    if (!currentClass) return;
    const updatedDemands = currentClass.demands.map(d => {
      if (d.id === demandId || d.code === 'PERH') return { ...d, allowedDays: [dayNum] };
      return d;
    });
    updateCurrentClassDemands(updatedDemands);
    try { await supabase.from('class_subject_demands').update({ allowed_days: [dayNum] }).eq('id', demandId); } catch (e) {}
  };

  const handlePerhLocationChange = async (demandId: string, locationVal: string) => {
    if (!currentClass) return;
    const isStandardType = locationVal === 'HALL' || locationVal === 'FIELD' || locationVal === 'CLASSROOM';
    const updatedDemands = currentClass.demands.map(d => {
      if (d.id === demandId || d.code === 'PERH') {
        return { 
          ...d, 
          roomId: isStandardType ? undefined : locationVal,
          requiredRoomType: isStandardType ? (locationVal as RoomType) : 'HALL'
        };
      }
      return d;
    });
    updateCurrentClassDemands(updatedDemands);
    try { await supabase.from('class_subject_demands').update({ room_id: isStandardType ? null : locationVal, required_room_type: isStandardType ? locationVal : 'HALL' }).eq('id', demandId); } catch (e) {}
  };

  const handleSyncPerhToAllClasses = async () => {
    if (!currentClass) return;
    const perh = currentClass.demands.find(d => d.code === 'PERH');
    if (!perh) return;
    const day = perh.allowedDays?.[0] || 1;
    const loc = perh.roomId || perh.requiredRoomType || 'HALL';
    const dayName = dayPills.find(p => p.day === day)?.name || 'Isnin';

    if (confirm(`Seragamkan ketetapan Perhimpunan Rasmi (${dayName}, Lokasi: ${loc}) ke SEMUA kelas?`)) {
      const isStandardType = loc === 'HALL' || loc === 'FIELD' || loc === 'CLASSROOM';
      const updated = activeClassesList.map(c => ({
        ...c,
        demands: (c.demands || []).map(d => {
          if (d.code === 'PERH') {
            return {
              ...d,
              allowedDays: [day],
              roomId: isStandardType ? undefined : loc,
              requiredRoomType: isStandardType ? (loc as RoomType) : 'HALL'
            };
          }
          return d;
        })
      }));
      notifyClassesUpdate(updated);

      try {
        await supabase.from('class_subject_demands').update({ allowed_days: [day], room_id: isStandardType ? null : loc, required_room_type: isStandardType ? loc : 'HALL' }).eq('subject_code', 'PERH');
      } catch (e) {}
      alert('Tetapan hari dan lokasi perhimpunan berjaya diseragamkan ke semua kelas!');
    }
  };

  const handleWeeklySlotsChange = (demandId: string, rawVal: string) => {
    if (!currentClass) return;
    const num = parseInt(rawVal, 10);
    const val = isNaN(num) ? 0 : Math.max(0, Math.min(30, num));
    const targetDemand = currentClass.demands.find(d => d.id === demandId);

    const updatedDemands = currentClass.demands.map(d => {
      const isTargetOrPartner = d.id === demandId || (
        targetDemand?.isParallel && targetDemand?.parallelSyncKey && 
        d.isParallel && d.parallelSyncKey === targetDemand.parallelSyncKey
      );

      if (isTargetOrPartner) {
        const isSplit = d.teacherAllocations && d.teacherAllocations.length > 1;
        return {
          ...d,
          weeklySlots: val,
          annualHours: val * 32,
          blockSize: (val >= 2 ? 'DOUBLE' : 'SINGLE') as 'DOUBLE' | 'SINGLE',
          teacherAllocations: isSplit ? d.teacherAllocations : (d.assignedTeacherId ? [{ teacherId: d.assignedTeacherId, slots: val }] : [])
        };
      }
      return d;
    });

    updateCurrentClassDemands(updatedDemands);
  };

  const handleToggleParallel = (demandId: string, enabled: boolean) => {
    if (!currentClass) return;
    const targetDemand = currentClass.demands.find(d => d.id === demandId);
    if (!targetDemand) return;
    const defaultKey = targetDemand.parallelSyncKey || `${targetDemand.code}_GROUP`;
    const updated = currentClass.demands.map(d => d.id === demandId ? { ...d, isParallel: enabled, parallelSyncKey: enabled ? defaultKey : undefined } : d);
    updateCurrentClassDemands(updated);
  };

  const handleUpdateParallelKey = (demandId: string, newKey: string) => {
    if (!currentClass) return;
    const cleanKey = newKey.trim().toUpperCase().replace(/\s+/g, '_');
    const updated = currentClass.demands.map(d => d.id === demandId ? { ...d, parallelSyncKey: cleanKey } : d);
    updateCurrentClassDemands(updated);
  };

  const handleToggleAllowedDay = (demandId: string, dayNum: number) => {
    if (!currentClass) return;
    const demand = currentClass.demands.find(d => d.id === demandId);
    if (!demand) return;
    const currentDays = Array.isArray(demand.allowedDays) && demand.allowedDays.length > 0 ? demand.allowedDays : [1, 2, 3, 4, 5];
    let nextDays: number[];
    if (currentDays.includes(dayNum)) {
      if (currentDays.length === 1) { alert('Sekurang-kurangnya satu hari persekolahan wajib dibenarkan.'); return; }
      nextDays = currentDays.filter(d => d !== dayNum);
    } else {
      nextDays = [...currentDays, dayNum].sort((a, b) => a - b);
    }
    const updated = currentClass.demands.map(d => d.id === demandId ? { ...d, allowedDays: nextDays } : d);
    updateCurrentClassDemands(updated);
  };

  const handleToggleNilam = (demandId: string, enabled: boolean) => {
    if (!currentClass) return;
    const updated = currentClass.demands.map(d => d.id === demandId ? { ...d, hasNilamSlot: enabled } : d);
    updateCurrentClassDemands(updated);
  };

  const handleOpenBankModal = () => {
    if (!currentClass) return;
    const existingCodes = currentClass.demands.map(d => d.code);
    setCheckedBankCodes(existingCodes);
    setIsBankModalOpen(true);
  };

  const handleToggleBankSubjectCode = (code: string) => {
    if (code === 'PERH') return;
    if (checkedBankCodes.includes(code)) {
      setCheckedBankCodes(checkedBankCodes.filter(c => c !== code));
    } else {
      setCheckedBankCodes([...checkedBankCodes, code]);
    }
  };

  const handleApplyBankSubjects = async () => {
    if (!currentClass) return;
    const savedBandsMap = getSavedTimeBandMap();

    const makeDemandsList = (clsTarget: ClassCohortConfig) => {
      const perhDemand = clsTarget.demands.find(d => d.code === 'PERH') || {
        id: `d_perh_${clsTarget.id}`, code: 'PERH', name: 'Perhimpunan Rasmi', category: 'SPECIAL', annualHours: 32, weeklySlots: 1, blockSize: 'SINGLE', distributionProfile: 'OPTION_A', assignedTeacherId: 'ALL_TEACHERS', requiredRoomType: 'HALL', isParallel: false, allowedDays: [1],
      };
      const newDemands: SubjectDemandFormItem[] = [perhDemand];

      checkedBankCodes.forEach(code => {
        if (code === 'PERH') return;
        const reg = subjectRegistry.find(s => s.code === code);
        if (!reg) return;

        const existing = clsTarget.demands.find(d => d.code === code);
        const persistentPref = resolveTimeBand(clsTarget.id, clsTarget.name, code, existing?.id, existing?.timeBandPreference, savedBandsMap);

        if (existing) {
          newDemands.push({ ...existing, timeBandPreference: persistentPref, isPrimeTimePriority: persistentPref === 'PRE_RECESS' });
        } else {
          newDemands.push({
            id: `d_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            code: reg.code, name: reg.name, category: reg.category, annualHours: reg.defaultSlots * 32, weeklySlots: reg.defaultSlots, blockSize: reg.defaultSlots >= 2 ? 'DOUBLE' : 'SINGLE', distributionProfile: 'OPTION_A', assignedTeacherId: '', teacherAllocations: [], requiredRoomType: reg.requiredRoomType as RoomType, isParallel: Boolean(reg.isParallel), parallelSyncKey: reg.parallelSyncKey, timeBandPreference: persistentPref, isPrimeTimePriority: persistentPref === 'PRE_RECESS', hasNilamSlot: reg.code === 'BM', allowedDays: [1, 2, 3, 4, 5],
          });
        }
      });
      return newDemands;
    };

    const targetClasses = syncBankToAllInGrade ? activeClassesList.filter(c => getNormalizedGrade(c) === currentGrade) : [currentClass];

    try {
      for (const targetCls of targetClasses) {
        const dList = makeDemandsList(targetCls);
        await supabase.from('class_subject_demands').delete().eq('class_id', targetCls.id);
        const insertPayload = dList.map(d => ({
          class_id: targetCls.id, subject_code: d.code, subject_name: d.name, weekly_slots: Number(d.weeklySlots) || 0, required_room_type: d.requiredRoomType || 'CLASSROOM', room_id: d.roomId || null, time_band_preference: d.timeBandPreference || 'ANY', is_prime_time_priority: Boolean(d.timeBandPreference === 'PRE_RECESS'), is_parallel: Boolean(d.isParallel), parallel_sync_key: d.parallelSyncKey || null, assigned_teacher_id: d.code === 'PERH' ? 'ALL_TEACHERS' : (d.assignedTeacherId || null), teacher_allocations: d.teacherAllocations || [], allowed_days: d.allowedDays || (d.code === 'PERH' ? [1] : [1, 2, 3, 4, 5]),
        }));
        await supabase.from('class_subject_demands').insert(insertPayload);
      }
    } catch (err) {}

    if (syncBankToAllInGrade) {
      const updatedClasses = activeClassesList.map(c => {
        if (getNormalizedGrade(c) === currentGrade) return { ...c, demands: makeDemandsList(c) };
        return c;
      });
      notifyClassesUpdate(updatedClasses);
    } else {
      updateCurrentClassDemands(makeDemandsList(currentClass));
    }
    setIsBankModalOpen(false);
  };

  const handleCopyPackageToSameGrade = () => {
    if (!currentClass) return;
    if (confirm(`Salin senarai pakej subjek dari ${currentClass.name} ke SEMUA kelas Tahun ${currentGrade}?`)) {
      const updatedClasses = activeClassesList.map(c => {
        if (getNormalizedGrade(c) === currentGrade && c.id !== currentClass.id) {
          const clonedDemands = currentClass.demands.map(d => ({ ...d, id: `d_${c.id}_${d.code}`, assignedTeacherId: d.code === 'PERH' ? 'ALL_TEACHERS' : '', teacherAllocations: [] }));
          return { ...c, demands: clonedDemands };
        }
        return c;
      });
      notifyClassesUpdate(updatedClasses);
      alert(`Pakej subjek berjaya diseragamkan ke semua kelas Tahun ${currentGrade}.`);
    }
  };

  const handleSubjectDropdownChange = (demandId: string, chosenCode: string) => {
    if (!currentClass) return;
    const regItem = subjectRegistry.find(s => s.code === chosenCode);
    if (!regItem) return;
    const savedBandsMap = getSavedTimeBandMap();
    const persistentPref = resolveTimeBand(currentClass.id, currentClass.name, chosenCode, demandId, 'ANY', savedBandsMap);

    const updatedDemands = currentClass.demands.map(d => {
      if (d.id === demandId) {
        return {
          ...d, code: regItem.code, name: regItem.name, weeklySlots: regItem.defaultSlots, category: regItem.category, requiredRoomType: regItem.requiredRoomType as RoomType, isParallel: Boolean(regItem.isParallel), parallelSyncKey: regItem.parallelSyncKey, timeBandPreference: persistentPref, isPrimeTimePriority: persistentPref === 'PRE_RECESS', teacherAllocations: d.assignedTeacherId ? [{ teacherId: d.assignedTeacherId, slots: regItem.defaultSlots }] : [],
        };
      }
      return d;
    });
    updateCurrentClassDemands(updatedDemands);
  };

  const handleTeacherAssignment = (demandId: string, teacherId: string) => {
    if (!currentClass) return;
    const updatedDemands = currentClass.demands.map((d) => {
      if (d.id === demandId) {
        return { ...d, assignedTeacherId: teacherId, teacherAllocations: teacherId ? [{ teacherId, slots: d.weeklySlots }] : [] };
      }
      return d;
    });
    updateCurrentClassDemands(updatedDemands);
  };

  const handleToggleSelectAll = () => {
    if (!currentClass) return;
    const nonPerhDemands = currentClass.demands.filter(d => d.code !== 'PERH').map(d => d.id);
    if (selectedDemandIds.length === nonPerhDemands.length) {
      setSelectedDemandIds([]);
    } else {
      setSelectedDemandIds(nonPerhDemands);
    }
  };

  const handleToggleSelectDemand = (id: string) => {
    setSelectedDemandIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = () => {
    if (!currentClass || selectedDemandIds.length === 0) return;
    if (confirm(`Padam ${selectedDemandIds.length} subjek yang ditanda?`)) {
      const updatedDemands = currentClass.demands.filter(d => !selectedDemandIds.includes(d.id));
      updateCurrentClassDemands(updatedDemands);
      setSelectedDemandIds([]);
    }
  };

  const activeSplittingDemand = currentClass?.demands?.find(d => d.id === splittingDemandId) || null;

  const handleOpenSplitModal = (demand: SubjectDemandFormItem) => {
    setSplittingDemandId(demand.id);
    if (demand.teacherAllocations && demand.teacherAllocations.length > 1) {
      setModalAllocations([...demand.teacherAllocations]);
    } else {
      const initTeacher = demand.assignedTeacherId || teachers[0]?.id || '';
      const half = Math.floor(demand.weeklySlots / 2);
      const otherTeacher = teachers.find(t => t.id !== initTeacher)?.id || teachers[1]?.id || initTeacher;
      setModalAllocations([{ teacherId: initTeacher, slots: demand.weeklySlots - half }, { teacherId: otherTeacher, slots: half }]);
    }
  };

  const handleUpdateSplitSlot = (index: number, newSlotsVal: number) => {
    if (!activeSplittingDemand) return;
    const totalWeekly = activeSplittingDemand.weeklySlots;
    const newAlloc = [...modalAllocations];
    newAlloc[index].slots = newSlotsVal;
    if (newAlloc.length === 2) {
      const otherIdx = index === 0 ? 1 : 0;
      newAlloc[otherIdx].slots = Math.max(0, totalWeekly - newSlotsVal);
    }
    setModalAllocations(newAlloc);
  };

  const handleUpdateSplitTeacher = (index: number, teacherId: string) => {
    const newAlloc = [...modalAllocations];
    newAlloc[index].teacherId = teacherId;
    setModalAllocations(newAlloc);
  };

  const handleAddSplitRow = () => {
    if (!activeSplittingDemand) return;
    const used = modalAllocations.reduce((s, a) => s + (Number(a.slots) || 0), 0);
    const remaining = Math.max(0, activeSplittingDemand.weeklySlots - used);
    const nextTeacher = teachers.find(t => !modalAllocations.some(m => m.teacherId === t.id))?.id || teachers[0]?.id || '';
    setModalAllocations([...modalAllocations, { teacherId: nextTeacher, slots: remaining }]);
  };

  const handleDeleteSplitRow = (index: number) => {
    const newAlloc = modalAllocations.filter((_, i) => i !== index);
    if (newAlloc.length === 1 && activeSplittingDemand) newAlloc[0].slots = activeSplittingDemand.weeklySlots;
    else if (newAlloc.length === 2 && activeSplittingDemand) newAlloc[1].slots = Math.max(0, activeSplittingDemand.weeklySlots - newAlloc[0].slots);
    setModalAllocations(newAlloc);
  };

  const handleResetToSingleTeacher = () => {
    if (!activeSplittingDemand || !currentClass) return;
    const initTeacher = modalAllocations[0]?.teacherId || activeSplittingDemand.assignedTeacherId || teachers[0]?.id || '';
    const updatedDemands = currentClass.demands.map(d => {
      if (d.id === activeSplittingDemand.id) return { ...d, teacherAllocations: [], assignedTeacherId: initTeacher };
      return d;
    });
    updateCurrentClassDemands(updatedDemands);
    setSplittingDemandId(null);
  };

  const modalAllocatedTotal = modalAllocations.reduce((s, a) => s + (Number(a.slots) || 0), 0);
  const isModalAllocationValid = activeSplittingDemand && modalAllocatedTotal === activeSplittingDemand.weeklySlots;

  const handleSaveSplitModal = () => {
    if (!isModalAllocationValid || !activeSplittingDemand || !currentClass) return;
    const isSingleNow = modalAllocations.length <= 1;
    const updatedDemands = currentClass.demands.map(d => {
      if (d.id === activeSplittingDemand.id) {
        return { ...d, teacherAllocations: isSingleNow ? [] : modalAllocations, assignedTeacherId: modalAllocations[0]?.teacherId || d.assignedTeacherId };
      }
      return d;
    });
    updateCurrentClassDemands(updatedDemands);
    setSplittingDemandId(null);
  };

  // =========================================================================
  // SISTEM AUDIT GRID KELAS & PAPARAN AMARAN (DIPINDAHKAN KE LANGKAH 4)
  // =========================================================================
  const handleProceedToNext = () => {
    const errorList: { className: string; demanded: number; maxAllowed: number; duplicates: string[] }[] = [];

    activeClassesList.forEach(cls => {
      const maxAllowed = cls.academicStage === 'STAGE_1' ? 44 : (cls.academicStage === 'STAGE_2' ? 47 : 54);
      const demanded = calculateTotalWeeklySlots(cls.demands);
      
      if (demanded > maxAllowed) {
        errorList.push({
          className: cls.name,
          demanded,
          maxAllowed,
          duplicates: getDuplicateSubjects(cls.demands)
        });
      }
    });

    if (errorList.length > 0) {
      setOverloadErrorModal({ isOpen: true, errors: errorList });
      return;
    }

    if (typeof onNext === 'function') {
      onNext();
    }
  };

  return (
    <div style={{
      background: '#f1f5f9',
      minHeight: '100vh',
      padding: '1.25rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", "Inter", sans-serif'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #cbd5e1',
        padding: '1.5rem 1.75rem',
        maxWidth: '1280px',
        margin: '0 auto',
        boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.03), 0 2px 4px -2px rgba(15, 23, 42, 0.02)'
      }}>

        {/* HEADER LANGKAH 4 */}
        <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
              padding: '2px 8px',
              borderRadius: '9999px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Langkah 4 daripada 6
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Pengurusan Kurikulum & Subjek Berkongsi Masa</span>
          </div>

          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.3px' }}>
            Pengurusan Kurikulum, Bank Subjek & Subjek Selari
          </h1>
          <p style={{ fontSize: '0.80rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
            Tetapkan waktu subjek, pilih zon masa PdP (Pra-Rehat / Pasca-Rehat / Bebas), tetapkan lokasi & hari perhimpunan, serta agihkan guru. Pilihan zon akan disimpan secara kekal.
          </p>
        </div>

        {/* SEKSYEN 1: NAVIGASI BERHIRARKI 3 PERINGKAT */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '12px',
          padding: '0.85rem 1rem',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.65rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={15} color="#2563eb" />
              <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a' }}>Peringkat 1: Tahap Persekolahan:</span>
            </div>

            <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '2px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              {[
                { key: 'ALL', label: 'Semua Tahap' },
                { key: 'STAGE_1', label: 'Tahap 1 (Tahun 1 - 3)' },
                { key: 'STAGE_2', label: 'Tahap 2 (Tahun 4 - 6)' },
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setStageFilter(tab.key as any);
                    setYearFilter('ALL');
                  }}
                  style={{
                    padding: '0.3rem 0.85rem',
                    fontSize: '0.74rem',
                    borderRadius: '6px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    background: stageFilter === tab.key ? '#2563eb' : 'transparent',
                    color: stageFilter === tab.key ? '#ffffff' : '#475569',
                    boxShadow: stageFilter === tab.key ? '0 1px 3px rgba(37,99,235,0.3)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Peringkat 2: Tahun:</span>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setYearFilter('ALL')}
                style={{
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.74rem',
                  borderRadius: '6px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: yearFilter === 'ALL' ? 'none' : '1px solid #cbd5e1',
                  background: yearFilter === 'ALL' ? '#2563eb' : '#ffffff',
                  color: yearFilter === 'ALL' ? '#ffffff' : '#334155',
                  boxShadow: yearFilter === 'ALL' ? '0 1px 3px rgba(37,99,235,0.25)' : 'none'
                }}
              >
                Semua Tahun
              </button>
              {availableYears.map(yr => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setYearFilter(yr)}
                  style={{
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.74rem',
                    borderRadius: '6px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: yearFilter === yr ? 'none' : '1px solid #cbd5e1',
                    background: yearFilter === yr ? '#2563eb' : '#ffffff',
                    color: yearFilter === yr ? '#ffffff' : '#334155',
                    boxShadow: yearFilter === yr ? '0 1px 3px rgba(37,99,235,0.25)' : 'none'
                  }}
                >
                  Tahun {yr}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '0.4rem', fontWeight: 600 }}>
              Peringkat 3: Klik Kelas untuk Pengurusan Subjek (Hijau = Lengkap Selesai, Merah = Melebihi Kuota):
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {filteredClassesWithIndex.length === 0 ? (
                <div style={{ fontSize: '0.76rem', color: '#dc2626', background: '#fef2f2', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={15} color="#dc2626" />
                  <span>Tiada kelas pengajian bagi tapisan ini.</span>
                </div>
              ) : (
                filteredClassesWithIndex.map(({ classData, originalIdx }) => {
                  const isSelected = selectedClassIndex === originalIdx;
                  const isComplete = checkIsClassComplete(classData);
                  const totalW = calculateTotalWeeklySlots(classData.demands);
                  const maxAllowed = classData.academicStage === 'STAGE_1' ? 44 : (classData.academicStage === 'STAGE_2' ? 47 : 54);
                  const isOverload = totalW > maxAllowed;

                  // Warna pintar: Merah jika lebih kuota, Hijau jika siap, Kelabu jika biasa, Biru jika dipilih
                  const bgCol = isOverload ? (isSelected ? '#dc2626' : '#fef2f2') : (isComplete ? (isSelected ? '#16a34a' : '#dcfce7') : (isSelected ? '#2563eb' : '#f1f5f9'));
                  const txtCol = isOverload ? (isSelected ? '#ffffff' : '#b91c1c') : (isComplete ? (isSelected ? '#ffffff' : '#15803d') : (isSelected ? '#ffffff' : '#1e293b'));
                  const brCol = isOverload ? (isSelected ? '1.5px solid #991b1b' : '1px solid #fca5a5') : (isComplete ? (isSelected ? '1.5px solid #15803d' : '1px solid #86efac') : (isSelected ? '1.5px solid #1d4ed8' : '1px solid #cbd5e1'));

                  return (
                    <button
                      key={classData.id || originalIdx}
                      type="button"
                      onClick={() => {
                        setSelectedClassIndex(originalIdx);
                        setSelectedDemandIds([]);
                      }}
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.15s ease',
                        background: bgCol,
                        color: txtCol,
                        border: brCol,
                        boxShadow: isSelected ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                      }}
                    >
                      {isOverload ? (
                        <AlertTriangle size={13} color={isSelected ? '#ffffff' : '#dc2626'} />
                      ) : isComplete ? (
                        <CheckCircle2 size={13} color={isSelected ? '#ffffff' : '#16a34a'} />
                      ) : (
                        <BookOpen size={13} color={isSelected ? '#ffffff' : '#64748b'} />
                      )}
                      <span>{classData.name}</span>
                      {isOverload ? (
                        <span style={{ fontSize: '0.60rem', background: isSelected ? 'rgba(255,255,255,0.25)' : '#fecaca', padding: '1px 4px', borderRadius: '3px', marginLeft: '2px', color: isSelected ? '#ffffff' : '#991b1b' }}>
                          Terlebih!
                        </span>
                      ) : isComplete && (
                        <span style={{ fontSize: '0.60rem', background: isSelected ? 'rgba(255,255,255,0.25)' : '#bbf7d0', padding: '1px 4px', borderRadius: '3px', marginLeft: '2px' }}>
                          Selesai
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* JADUAL SUBJEK KELAS */}
        {currentClass ? (
          <>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.65rem',
              backgroundColor: isOverQuota ? '#fef2f2' : '#f8fafc',
              border: `1px solid ${isOverQuota ? '#fca5a5' : '#cbd5e1'}`,
              borderRadius: '10px',
              padding: '0.65rem 1rem',
              marginBottom: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} color={isOverQuota ? '#dc2626' : '#2563eb'} />
                  <span style={{ fontWeight: 800, fontSize: '0.85rem', color: isOverQuota ? '#b91c1c' : '#0f172a' }}>
                    Kelas Semasa: {currentClass.name} (Tahun {currentGrade})
                  </span>
                </div>

                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.74rem',
                  color: '#334155',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}>
                  <DoorOpen size={13} color="#64748b" />
                  <span>Bilik Asas: <strong>{currentRoom ? `${currentRoom.name} (${currentRoom.code})` : 'Belum Ditetapkan'}</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleOpenBankModal}
                  style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
                >
                  <Library size={13} /> Ambil dari Bank Subjek
                </button>

                <button
                  type="button"
                  onClick={handleCopyPackageToSameGrade}
                  style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
                  title={`Salin senarai subjek ke semua kelas Tahun ${currentGrade}`}
                >
                  <Copy size={13} /> Salin Pakej Tahun {currentGrade}
                </button>

                {selectedDemandIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkDelete}
                    style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                  >
                    <Trash2 size={13} /> Padam ({selectedDemandIds.length})
                  </button>
                )}

                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  backgroundColor: isQuotaMatched ? '#f0fdf4' : '#fef2f2',
                  color: isQuotaMatched ? '#166534' : '#dc2626',
                  border: `1.5px solid ${isQuotaMatched ? '#86efac' : '#fca5a5'}`
                }}>
                  {isQuotaMatched ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                  <span>Jumlah Slot: {currentTotalSlots} / {targetSlots} Waktu</span>
                </div>
              </div>
            </div>

            {/* SEKSYEN KHAS: PERHIMPUNAN RASMI (DI BAWAH MEDAN KELAS SEMASA) */}
            {perhDemand && (
              <div style={{
                background: '#f0fdf4',
                border: '1.5px solid #bbf7d0',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    background: '#16a34a',
                    color: '#ffffff',
                    padding: '2px 7px',
                    borderRadius: '4px'
                  }}>
                    PERH
                  </span>
                  <div>
                    <strong style={{ fontSize: '0.84rem', color: '#166534' }}>
                      Perhimpunan Rasmi [1 Waktu - W1]
                    </strong>
                    <span style={{ fontSize: '0.72rem', color: '#15803d', marginLeft: '6px', fontWeight: 600 }}>
                      ✓ Wajib Semua Guru Terlibat
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  {/* Pemilihan Hari Perhimpunan */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#166534' }}>Hari:</span>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#ffffff', padding: '2px 5px', borderRadius: '6px', border: '1px solid #86efac' }}>
                      {dayPills.map(p => {
                        const perhDays = Array.isArray(perhDemand.allowedDays) && perhDemand.allowedDays.length > 0
                          ? perhDemand.allowedDays
                          : [1];
                        const isSelected = perhDays.includes(p.day);
                        return (
                          <button
                            key={p.day}
                            type="button"
                            onClick={() => handlePerhDayChange(perhDemand.id, p.day)}
                            title={`Tetapkan Perhimpunan pada hari ${p.name}`}
                            style={{
                              width: '22px',
                              height: '22px',
                              fontSize: '0.68rem',
                              fontWeight: isSelected ? 800 : 400,
                              borderRadius: '4px',
                              border: isSelected ? '1.5px solid #16a34a' : '1px dashed #cbd5e1',
                              background: isSelected ? '#16a34a' : '#ffffff',
                              color: isSelected ? '#ffffff' : '#64748b',
                              cursor: 'pointer',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 600 }}>
                      ({dayPills.find(p => (perhDemand.allowedDays || [1]).includes(p.day))?.name || 'Isnin'})
                    </span>
                  </div>

                  {/* Pemilihan Tempat / Lokasi */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DoorOpen size={14} color="#166534" />
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#166534' }}>Tempat:</span>
                    <select
                      value={perhDemand.roomId || perhDemand.requiredRoomType || 'HALL'}
                      onChange={(e) => handlePerhLocationChange(perhDemand.id, e.target.value)}
                      style={{
                        padding: '0.3rem 0.5rem',
                        borderRadius: '6px',
                        border: '1px solid #86efac',
                        fontSize: '0.74rem',
                        backgroundColor: '#ffffff',
                        color: '#1e293b',
                        fontWeight: 600
                      }}
                    >
                      <option value="HALL">🏛️ Dewan Utama Sekolah</option>
                      <option value="FIELD">⛳ Dataran / Padang Utama</option>
                      <option value="CLASSROOM">🚪 Bilik Darjah Asas (Kelas)</option>
                      {rooms.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Butang Seragamkan Semua Kelas */}
                  <button
                    type="button"
                    onClick={handleSyncPerhToAllClasses}
                    title="Seragamkan Hari & Tempat Perhimpunan ke Semua Kelas"
                    style={{
                      background: '#ffffff',
                      color: '#166534',
                      border: '1px solid #86efac',
                      padding: '0.32rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                    }}
                  >
                    <Copy size={12} />
                    <span>Seragamkan ke Semua Kelas</span>
                  </button>
                </div>
              </div>
            )}

            {/* JADUAL MATA PELAJARAN */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #cbd5e1' }}>
                    <th style={{ width: '35px', textAlign: 'center', padding: '0.55rem 0.4rem' }}>
                      <span onClick={handleToggleSelectAll} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                        {selectedDemandIds.length > 0 && selectedDemandIds.length === currentClass.demands.filter(d => d.code !== 'PERH').length ? (
                          <CheckSquare size={15} color="#2563eb" />
                        ) : (
                          <Square size={15} color="#94a3b8" />
                        )}
                      </span>
                    </th>
                    <th style={{ width: '35px', textAlign: 'center', padding: '0.55rem 0.4rem', fontWeight: 700, color: '#334155' }}>Bil.</th>
                    <th style={{ width: '80px', textAlign: 'center', padding: '0.55rem 0.4rem', fontWeight: 700, color: '#334155' }}>Kod</th>
                    <th style={{ minWidth: '170px', textAlign: 'left', padding: '0.55rem 0.6rem', fontWeight: 700, color: '#334155' }}>Mata Pelajaran</th>
                    <th style={{ width: '85px', textAlign: 'center', padding: '0.55rem 0.4rem', fontWeight: 700, color: '#334155' }}>Slot (W)</th>
                    <th style={{ minWidth: '190px', textAlign: 'left', padding: '0.55rem 0.6rem', fontWeight: 700, color: '#334155' }}>Guru Pengajar & Agihan</th>
                    <th style={{ width: '240px', textAlign: 'left', padding: '0.55rem 0.6rem', fontWeight: 700, color: '#334155' }}>Zon Waktu, Lokasi & Selari</th>
                    <th style={{ width: '160px', textAlign: 'center', padding: '0.55rem 0.4rem', fontWeight: 700, color: '#334155' }}>Hari Dibenarkan</th>
                    <th style={{ textAlign: 'center', width: '100px', padding: '0.55rem 0.4rem', fontWeight: 700, color: '#334155' }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {currentClass.demands
                    .filter(d => d.code !== 'PERH')
                    .map((demand, index) => {
                      const isSelected = selectedDemandIds.includes(demand.id);
                      const isSplit = demand.teacherAllocations && demand.teacherAllocations.length > 1;
                      const badgeStyle = getCategoryBadgeStyle(demand.category);
                      
                      // Highlight merah jika subjek ini berganda dalam satu kelas
                      const isDuplicate = duplicateSubjectsInCurrentClass.includes(demand.code);

                      const currentDays = Array.isArray(demand.allowedDays) && demand.allowedDays.length > 0 
                        ? demand.allowedDays 
                        : [1, 2, 3, 4, 5];

                      const isParallelSub = Boolean(demand.isParallel);
                      const isDayOverCapacity = demand.weeklySlots > (currentDays.length * 3);
                      const blockedDaysNames = dayPills.filter(p => !currentDays.includes(p.day)).map(p => p.name);

                      return (
                        <tr key={demand.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: isSelected ? '#f8fafc' : (isDuplicate ? '#fff1f2' : undefined) }}>
                          <td style={{ textAlign: 'center', padding: '0.45rem 0.4rem' }}>
                            <span onClick={() => handleToggleSelectDemand(demand.id)} style={{ cursor: 'pointer', display: 'inline-flex' }}>
                              {isSelected ? <CheckSquare size={15} color="#2563eb" /> : <Square size={15} color="#cbd5e1" />}
                            </span>
                          </td>

                          <td style={{ textAlign: 'center', fontWeight: 400, color: '#64748b', padding: '0.45rem 0.4rem' }}>
                            {index + 1}.
                          </td>

                          <td style={{ textAlign: 'center', padding: '0.45rem 0.4rem' }}>
                            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                              <span 
                                style={{ 
                                  fontWeight: 400,
                                  fontSize: '0.72rem',
                                  padding: '2px 6px', 
                                  borderRadius: '4px', 
                                  border: `1px solid ${isDuplicate ? '#fca5a5' : badgeStyle.borderColor}`,
                                  backgroundColor: isDuplicate ? '#fee2e2' : badgeStyle.backgroundColor,
                                  color: isDuplicate ? '#991b1b' : badgeStyle.color,
                                  display: 'inline-block'
                                }}
                                title={isDuplicate ? "Subjek bertindih / berganda!" : ""}
                              >
                                {demand.code}
                              </span>
                              {isParallelSub && (
                                <span 
                                  style={{ 
                                    fontSize: '0.56rem', 
                                    backgroundColor: '#ede9fe', 
                                    color: '#6d28d9', 
                                    border: '1px solid #ddd6fe', 
                                    padding: '1px 4px', 
                                    borderRadius: '3px', 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    gap: '2px', 
                                    fontWeight: 700
                                  }}
                                  title={`Subjek Selari: Berkongsi masa serentak (Kunci: ${demand.parallelSyncKey || 'SELARI'})`}
                                >
                                  <Link2 size={8} /> {demand.parallelSyncKey || 'SELARI'}
                                </span>
                              )}
                            </div>
                          </td>

                          <td style={{ padding: '0.45rem 0.6rem' }}>
                            <div>
                              <select
                                value={demand.code}
                                onChange={(e) => handleSubjectDropdownChange(demand.id, e.target.value)}
                                style={{ width: '100%', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.76rem', fontWeight: 400, backgroundColor: '#ffffff', color: '#1e293b' }}
                              >
                                {subjectRegistry.map((reg) => (
                                  <option key={reg.code} value={reg.code}>
                                    {reg.name} ({reg.code}) {reg.isParallel ? `[Selari: ${reg.parallelSyncKey}]` : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>

                          <td style={{ textAlign: 'center', padding: '0.45rem 0.4rem' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                              <input
                                type="number"
                                min={1}
                                max={30}
                                value={demand.weeklySlots ?? ''}
                                onChange={(e) => handleWeeklySlotsChange(demand.id, e.target.value)}
                                title="Ubah bilangan waktu"
                                style={{
                                  width: '48px',
                                  padding: '0.3rem 0.35rem',
                                  borderRadius: '6px',
                                  border: isParallelSub ? '1.5px solid #a78bfa' : '1.5px solid #cbd5e1',
                                  fontSize: '0.78rem',
                                  fontWeight: 400,
                                  textAlign: 'center',
                                  color: '#0f172a',
                                  backgroundColor: isParallelSub ? '#faf5ff' : '#ffffff',
                                  boxSizing: 'border-box'
                                }}
                              />
                              <span style={{ fontSize: '0.72rem', fontWeight: 400, color: '#64748b' }}>W</span>
                            </div>
                          </td>

                          <td style={{ padding: '0.45rem 0.6rem' }}>
                            {isSplit ? (
                              <div style={{ fontSize: '0.74rem', background: '#eff6ff', padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                                <div style={{ color: '#1e40af', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px', fontWeight: 400 }}>
                                  <Users size={12} /> Kongsi Pengajaran ({demand.teacherAllocations?.length} Guru):
                                </div>
                                {demand.teacherAllocations?.map((a, i) => {
                                  const t = teachers.find(tc => tc.id === a.teacherId);
                                  return (
                                    <div key={i} style={{ color: '#1e3a8a', fontSize: '0.70rem', fontWeight: 400 }}>
                                      • {t ? getTeacherDisplayName(t) : 'Guru'}: {a.slots}W
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <select
                                  value={demand.assignedTeacherId || ''}
                                  onChange={(e) => handleTeacherAssignment(demand.id, e.target.value)}
                                  style={{ width: '100%', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.76rem', fontWeight: 400, backgroundColor: '#ffffff', color: '#1e293b' }}
                                >
                                  <option value="">-- Pilih Guru Tunggal --</option>
                                  {teachers.map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {getTeacherDisplayName(t)}
                                    </option>
                                  ))}
                                </select>
                                
                                {demand.assignedTeacherId && (
                                  <button
                                    type="button"
                                    onClick={() => handleTeacherAssignment(demand.id, '')}
                                    title="Padam / Kosongkan Guru Ini"
                                    style={{
                                      background: '#fef2f2',
                                      border: '1px solid #fecaca',
                                      color: '#dc2626',
                                      padding: '0.32rem 0.45rem',
                                      borderRadius: '5px',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0,
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>

                          {/* SISTEM ZON WAKTU PDP (LALAI: ZON BEBAS & KEKAL APABILA DITETAPKAN) */}
                          <td style={{ padding: '0.45rem 0.6rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                              
                              <div style={{ width: '100%' }}>
                                <select
                                  value={demand.timeBandPreference || 'ANY'}
                                  onChange={(e) => handleTimeBandChange(demand.id, e.target.value as TimeBandPreference)}
                                  style={{
                                    width: '100%',
                                    fontSize: '0.70rem',
                                    padding: '2px 5px',
                                    borderRadius: '5px',
                                    border: '1px solid #cbd5e1',
                                    backgroundColor: 
                                      demand.timeBandPreference === 'PRE_RECESS' ? '#fefce8' : 
                                      demand.timeBandPreference === 'POST_RECESS' ? '#eff6ff' : '#ffffff',
                                    color: 
                                      demand.timeBandPreference === 'PRE_RECESS' ? '#854d0e' : 
                                      demand.timeBandPreference === 'POST_RECESS' ? '#1e40af' : '#334155',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                  title="Pilihan zon ini akan kekal tersimpan walaupun halaman dimuat semula"
                                >
                                  <option value="ANY">🌐 Zon: Bebas (W1–W10)</option>
                                  <option value="PRE_RECESS">☀️ Zon Pagi: Pra-Rehat (W1–W4)</option>
                                  <option value="POST_RECESS">🌤️ Zon Tengah Hari: Pasca-Rehat (W6–W9)</option>
                                  <option value="AFTERNOON">⛅ Zon Petang: (W10+)</option>
                                </select>
                              </div>

                              <div style={{ width: '100%' }}>
                                <label 
                                  style={{ 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    gap: '4px', 
                                    fontSize: '0.70rem', 
                                    cursor: 'pointer',
                                    padding: '2px 5px',
                                    borderRadius: '4px',
                                    background: isParallelSub ? '#f5f3ff' : 'transparent',
                                    border: isParallelSub ? '1px solid #ddd6fe' : '1px solid transparent'
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isParallelSub}
                                    onChange={(e) => handleToggleParallel(demand.id, e.target.checked)}
                                    style={{ cursor: 'pointer', accentColor: '#7c3aed' }}
                                  />
                                  <span style={{ fontWeight: isParallelSub ? 700 : 400, color: isParallelSub ? '#6d28d9' : '#64748b' }}>
                                    🔗 Kongsi Masa (Selari)
                                  </span>
                                </label>

                                {isParallelSub && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px', paddingLeft: '6px' }}>
                                    <span style={{ fontSize: '0.62rem', color: '#6d28d9', fontWeight: 600 }}>Kumpulan:</span>
                                    <input
                                      type="text"
                                      placeholder="Cth: PI_PM, FIQH"
                                      value={demand.parallelSyncKey || ''}
                                      onChange={(e) => handleUpdateParallelKey(demand.id, e.target.value)}
                                      style={{
                                        width: '90px',
                                        padding: '1px 5px',
                                        fontSize: '0.66rem',
                                        borderRadius: '4px',
                                        border: '1px solid #c4b5fd',
                                        fontWeight: 700,
                                        color: '#6d28d9',
                                        backgroundColor: '#faf5ff'
                                      }}
                                    />
                                  </div>
                                )}
                              </div>

                              <label 
                                style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: '4px', 
                                  fontSize: '0.70rem', 
                                  cursor: 'pointer', 
                                  padding: '2px 5px', 
                                  borderRadius: '4px',
                                  background: demand.hasNilamSlot ? '#f0fdf4' : 'transparent',
                                  border: demand.hasNilamSlot ? '1px solid #bbf7d0' : '1px solid transparent'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={Boolean(demand.hasNilamSlot)}
                                  onChange={(e) => handleToggleNilam(demand.id, e.target.checked)}
                                  style={{ cursor: 'pointer', accentColor: '#16a34a' }}
                                />
                                <span style={{ fontWeight: 400, color: demand.hasNilamSlot ? '#15803d' : '#64748b' }}>
                                  📖 1W NILAM
                                </span>
                              </label>
                            </div>
                          </td>

                          {/* HARI DIBENARKAN */}
                          <td style={{ textAlign: 'center', padding: '0.45rem 0.4rem' }}>
                            <div>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#f8fafc', padding: '2px 5px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                {dayPills.map(p => {
                                  const isAllowed = currentDays.includes(p.day);
                                  return (
                                    <button
                                      key={p.day}
                                      type="button"
                                      onClick={() => handleToggleAllowedDay(demand.id, p.day)}
                                      title={`${p.name}: ${isAllowed ? 'DIBENARKAN (Klik untuk sekat)' : 'DISEKAT (Klik untuk benarkan)'}`}
                                      style={{
                                        width: '22px',
                                        height: '22px',
                                        fontSize: '0.68rem',
                                        fontWeight: isAllowed ? 700 : 400,
                                        borderRadius: '4px',
                                        border: isAllowed ? '1.5px solid #2563eb' : '1px dashed #cbd5e1',
                                        background: isAllowed ? '#2563eb' : '#f1f5f9',
                                        color: isAllowed ? '#ffffff' : '#94a3b8',
                                        cursor: 'pointer',
                                        padding: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.15s ease'
                                      }}
                                    >
                                      {p.label}
                                    </button>
                                  );
                                })}
                              </div>

                              <div style={{ fontSize: '0.62rem', marginTop: '3px' }}>
                                {blockedDaysNames.length === 0 ? (
                                  <span style={{ color: '#166534', fontWeight: 500 }}>Semua Hari Aktif</span>
                                ) : (
                                  <span style={{ color: '#dc2626', fontWeight: 600 }}>
                                    Disekat: {blockedDaysNames.join(', ')}
                                  </span>
                                )}
                              </div>

                              {isDayOverCapacity && (
                                <div style={{ fontSize: '0.60rem', color: '#dc2626', marginTop: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }} title="Slot waktu padat">
                                  <AlertCircle size={10} /> Padat ({demand.weeklySlots}W / {currentDays.length} Hari)
                                </div>
                              )}
                            </div>
                          </td>

                          <td style={{ textAlign: 'center', padding: '0.45rem 0.4rem' }}>
                            <button
                              type="button"
                              style={{
                                background: isSplit ? '#eff6ff' : '#ffffff',
                                color: isSplit ? '#1d4ed8' : '#334155',
                                border: isSplit ? '1px solid #bfdbfe' : '1px solid #cbd5e1',
                                padding: '0.3rem 0.65rem',
                                borderRadius: '5px',
                                fontSize: '0.72rem',
                                fontWeight: 400,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              onClick={() => handleOpenSplitModal(demand)}
                            >
                              <Users size={12} />
                              <span>{isSplit ? 'Ubah Pecahan' : 'Pecah Guru'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px dashed #cbd5e1', padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <Users size={36} color="#94a3b8" style={{ marginBottom: '12px' }} />
            <h4 style={{ margin: 0, fontWeight: 700, color: '#334155' }}>Tiada Kelas Pengajian Didaftarkan</h4>
            <p style={{ fontSize: '0.82rem', margin: '6px 0 16px' }}>Sila kembali ke Langkah 3 untuk mendaftar kelas pengajian dan menetapkan bilik asas.</p>
            <button
              type="button"
              onClick={handleBackNavigation}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                fontSize: '0.80rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ← Kembali ke Langkah 3 (Pusat Sumber Induk)
            </button>
          </div>
        )}

        {/* BAR NAVIGASI BAWAH */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid #f1f5f9'
        }}>
          <button
            type="button"
            onClick={handleBackNavigation}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#475569',
              padding: '0.55rem 1.25rem',
              borderRadius: '8px',
              fontSize: '0.80rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <ArrowLeft size={16} />
            <span>Kembali</span>
          </button>

          <button
            type="button"
            onClick={handleProceedToNext}
            disabled={activeClassesList.length === 0}
            style={{
              backgroundColor: activeClassesList.length === 0 ? '#94a3b8' : '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '0.55rem 1.4rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: activeClassesList.length === 0 ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: activeClassesList.length === 0 ? 'none' : '0 2px 6px rgba(37,99,235,0.3)',
              transition: 'background-color 0.15s ease'
            }}
          >
            <span>Seterusnya: Analisa Pra-Penjanaan AI</span>
            <ArrowRight size={16} />
          </button>
        </div>

      </div>

      {/* MODAL RALAT LEBIHAN KAPASITI SEBELUM GENERATE */}
      {overloadErrorModal.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', padding: '1.75rem', borderRadius: '16px', maxWidth: '640px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', borderBottom: '1px solid #fecaca', paddingBottom: '0.75rem' }}>
              <div style={{ background: '#fef2f2', padding: '10px', borderRadius: '50%' }}>
                <AlertTriangle size={26} color="#dc2626" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#991b1b' }}>AMARAN KRITIKAL: Kapasiti Murid Melebihi Had</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.80rem', color: '#b91c1c' }}>Penyusunan jadual waktu pasti akan gagal (waktu tercicir) jika ralat ini tidak dibaiki.</p>
              </div>
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ fontSize: '0.80rem', color: '#334155', margin: 0, lineHeight: 1.5 }}>
                Sistem mengesan jadual kelas di bawah menuntut waktu PdP yang melebihi jumlah slot fizikal wujud dalam grid persekolahan (Maksimum 44 Waktu). Sila seimbangkan semula subjek kelas.
              </p>

              {overloadErrorModal.errors.map((err, idx) => (
                <div key={idx} style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '0.75rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.82rem', color: '#7f1d1d', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Kelas {err.className}:</span>
                    <span style={{ color: '#dc2626', fontWeight: 800 }}>Terlebih {err.demanded - err.maxAllowed} Waktu!</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#991b1b', marginTop: '4px' }}>
                    Menuntut: <strong>{err.demanded} Waktu</strong> &nbsp; | &nbsp; Had Maksimum Grid: <strong>{err.maxAllowed} Waktu</strong>
                  </div>
                  
                  {err.duplicates.length > 0 && (
                    <div style={{ fontSize: '0.72rem', color: '#b91c1c', marginTop: '6px', display: 'flex', gap: '4px' }}>
                      <AlertCircle size={12} style={{ marginTop: '2px' }} />
                      <span>Subjek bertindih/berganda dikesan: <strong>{err.duplicates.join(', ')}</strong> (Punca utama lebihan waktu).</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setOverloadErrorModal({ isOpen: false, errors: [] })}
                style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '0.55rem 1.25rem', borderRadius: '8px', fontSize: '0.80rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 4px rgba(37,99,235,0.25)' }}
              >
                Saya Faham, Tutup Amaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BANK SUBJEK */}
      {isBankModalOpen && currentClass && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', maxWidth: '640px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Library size={18} color="#2563eb" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Bank Subjek: Pakej Tahun {currentGrade}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsBankModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={16} color="#64748b" />
              </button>
            </div>

            <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '1rem' }}>
              Tandakan subjek yang diambil oleh kohort ini untuk diselaraskan ke dalam senarai PdP kelas.
            </p>

            <div style={{ maxHeight: '280px', overflowY: 'auto', marginBottom: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.5rem' }}>
              {subjectRegistry.map((reg) => {
                const isChecked = checkedBankCodes.includes(reg.code);
                const badgeStyle = getCategoryBadgeStyle(reg.category);

                return (
                  <div
                    key={reg.code}
                    onClick={() => handleToggleBankSubjectCode(reg.code)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '8px',
                      border: isChecked ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                      background: isChecked ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isChecked ? <CheckSquare size={15} color="#2563eb" /> : <Square size={15} color="#cbd5e1" />}
                    <span style={{ fontSize: '0.72rem', fontWeight: 400, padding: '1px 5px', borderRadius: '4px', backgroundColor: badgeStyle.backgroundColor, color: badgeStyle.color, border: `1px solid ${badgeStyle.borderColor}` }}>
                      {reg.code}
                    </span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 400, color: '#1e293b' }}>
                      {reg.name} ({reg.defaultSlots}W) {reg.isParallel ? `[Selari: ${reg.parallelSyncKey}]` : ''}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: 700, color: '#1e40af', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={syncBankToAllInGrade}
                  onChange={(e) => setSyncBankToAllInGrade(e.target.checked)}
                  style={{ accentColor: '#2563eb' }}
                />
                <span>Terapkan pilihan subjek ini ke SEMUA kelas Tahun {currentGrade} serentak</span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
                style={{ padding: '0.4rem 0.9rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyBankSubjects}
                style={{ padding: '0.4rem 1.15rem', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#ffffff', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 4px rgba(37,99,235,0.25)' }}
              >
                Masukkan Subjek Terpilih
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PECAH GURU DILENGKAPKAN DENGAN BUTANG PADAM SETIAP GURU */}
      {activeSplittingDemand && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', maxWidth: '560px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={17} color="#2563eb" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Pecah Agihan Guru: {activeSplittingDemand.name} ({activeSplittingDemand.weeklySlots} Waktu)
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setSplittingDemandId(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={16} color="#64748b" />
              </button>
            </div>

            <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '1rem' }}>
              Tetapkan bilangan waktu bagi setiap guru. Anda boleh klik ikon tong sampah untuk memadam guru yang tidak diperlukan[cite: 16].
            </p>

            <div style={{ maxHeight: '220px', overflowY: 'auto', marginBottom: '1rem', paddingRight: '4px' }}>
              {modalAllocations.map((alloc, idx) => {
                const assignedTeacher = teachers.find(t => t.id === alloc.teacherId);
                const currentGlobalSlots = (globalTeacherLoadMap.get(alloc.teacherId) || 0);
                const isOverQuota = assignedTeacher && (currentGlobalSlots > assignedTeacher.maxWeeklySlots);

                return (
                  <div key={idx} style={{ background: '#f8fafc', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: modalAllocations.length > 1 ? '1fr 90px 36px' : '1fr 90px', gap: '0.5rem', alignItems: 'center' }}>
                      <select
                        value={alloc.teacherId || ''}
                        onChange={(e) => handleUpdateSplitTeacher(idx, e.target.value)}
                        style={{ width: '100%', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.76rem', fontWeight: 400, backgroundColor: '#ffffff' }}
                      >
                        {teachers.map(t => (
                          <option key={t.id} value={t.id}>
                            {getTeacherDisplayName(t)}
                          </option>
                        ))}
                      </select>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          min={0}
                          max={activeSplittingDemand.weeklySlots}
                          value={alloc.slots}
                          onChange={(e) => handleUpdateSplitSlot(idx, Number(e.target.value))}
                          style={{ width: '60px', padding: '0.3rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.76rem', fontWeight: 400, textAlign: 'center', backgroundColor: '#ffffff' }}
                        />
                        <span style={{ fontSize: '0.76rem', fontWeight: 400, color: '#334155' }}>W</span>
                      </div>

                      {/* BUTANG PADAM NAMA GURU DALAM MODAL (DIBENARKAN BILA LEBIH DARIPADA 1 GURU) */}
                      {modalAllocations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteSplitRow(idx)}
                          title="Padam guru ini dari agihan"
                          style={{ 
                            background: '#fef2f2', 
                            border: '1px solid #fecaca', 
                            color: '#dc2626', 
                            cursor: 'pointer', 
                            padding: '5px', 
                            borderRadius: '6px',
                            display: 'flex', 
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {isOverQuota && (
                      <div style={{ fontSize: '0.70rem', color: '#b91c1c', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertCircle size={12} />
                        <span>Peringatan: {assignedTeacher?.fullName} telah menerima {currentGlobalSlots}W (Had: {assignedTeacher?.maxWeeklySlots}W)</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              border: `1.5px solid ${isModalAllocationValid ? '#86efac' : '#fecaca'}`,
              background: isModalAllocationValid ? '#f0fdf4' : '#fef2f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <strong style={{ fontSize: '0.78rem', color: isModalAllocationValid ? '#166534' : '#b91c1c' }}>
                  {isModalAllocationValid ? '✓ Agihan Slot Lengkap & Tepat:' : '❌ Agihan Slot Tidak Seimbang:'}
                </strong>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: isModalAllocationValid ? '#15803d' : '#b91c1c' }}>
                  {modalAllocatedTotal} / {activeSplittingDemand.weeklySlots} Waktu
                </div>
              </div>

              {!isModalAllocationValid && (
                <div style={{ fontSize: '0.78rem', color: '#b91c1c', textAlign: 'right', fontWeight: 700 }}>
                  {modalAllocatedTotal > activeSplittingDemand.weeklySlots
                    ? `Terlebih ${modalAllocatedTotal - activeSplittingDemand.weeklySlots} Waktu`
                    : `Kurang ${activeSplittingDemand.weeklySlots - modalAllocatedTotal} Waktu`}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={handleAddSplitRow}
                  style={{ fontSize: '0.74rem', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '0.35rem 0.75rem', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#334155' }}
                >
                  <UserPlus size={13} /> Tambah Guru
                </button>

                {/* BUTANG BATALKAN PECAHAN / KEMBALI GURU TUNGGAL */}
                {modalAllocations.length > 1 && (
                  <button
                    type="button"
                    onClick={handleResetToSingleTeacher}
                    title="Padam semua pecahan dan jadikan guru tunggal semula"
                    style={{ fontSize: '0.74rem', background: '#fff7ed', border: '1px solid #fed7aa', padding: '0.35rem 0.65rem', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#c2410c' }}
                  >
                    <RotateCcw size={13} /> Reset Guru Tunggal
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.45rem' }}>
                <button
                  type="button"
                  onClick={() => setSplittingDemandId(null)}
                  style={{ padding: '0.4rem 0.9rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!isModalAllocationValid}
                  onClick={handleSaveSplitModal}
                  style={{
                    padding: '0.4rem 1.15rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: isModalAllocationValid ? 'pointer' : 'not-allowed',
                    opacity: isModalAllocationValid ? 1 : 0.5,
                    boxShadow: isModalAllocationValid ? '0 2px 4px rgba(37,99,235,0.25)' : 'none'
                  }}
                >
                  Simpan Agihan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}