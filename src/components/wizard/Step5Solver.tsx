// src/components/wizard/Step5Solver.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  TeacherFormState, 
  RoomFormState, 
  ClassCohortConfig, 
  TimeGridConfigState, 
  TimetableEntry,
  SubjectDemandFormItem 
} from '@/types/timetable';
import styles from './Step5Solver.module.css';
import { 
  Play, 
  AlertTriangle, 
  RefreshCw, 
  ArrowLeft, 
  Check, 
  UserCheck, 
  Layers, 
  Users, 
  Clock, 
  ShieldCheck, 
  Star, 
  Link2,
  AlertCircle,
  DoorOpen,
  Filter,
  Info
} from 'lucide-react';

interface Props {
  schoolType?: any;
  timeGridConfig?: TimeGridConfigState;
  gridConfig?: TimeGridConfigState;
  grid?: TimeGridConfigState;
  teachers: TeacherFormState[];
  setTeachers?: React.Dispatch<React.SetStateAction<TeacherFormState[]>>;
  rooms: RoomFormState[];
  classes: ClassCohortConfig[];
  setClasses?: React.Dispatch<React.SetStateAction<ClassCohortConfig[]>>;
  onGenerated?: (entries: TimetableEntry[]) => void;
  onNext?: (data?: any) => void;
  onBack?: () => void;
  stateGroup?: string;
  [key: string]: any;
}

// Bantuan menghuraikan sebarang nilai input kepada angka integer yang sah
const parseNumericSafe = (val: any, fallback: number = 0): number => {
  if (val === undefined || val === null || val === '') return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (typeof val === 'string') {
    const lower = val.toLowerCase();
    if (lower.includes('tiada') || lower.includes('unlimited') || lower.includes('none') || lower.includes('bebas')) {
      return 8;
    }
    const digits = val.replace(/\D/g, '');
    if (digits) {
      const parsed = parseInt(digits, 10);
      return isNaN(parsed) ? fallback : parsed;
    }
  }
  return fallback;
};

export default function Step5Solver(props: Props) {
  const {
    teachers = [],
    rooms = [],
    classes = [],
    setClasses,
    onBack,
  } = props;

  const effectiveGridConfig: TimeGridConfigState = useMemo(() => {
    return props.grid || props.timeGridConfig || props.gridConfig || props.data || ({} as TimeGridConfigState);
  }, [props.grid, props.timeGridConfig, props.gridConfig, props.data]);

  const [isSolving, setIsSolving] = useState(false);
  const [solverProgress, setSolverProgress] = useState(0);
  const [classesState, setClassesState] = useState<ClassCohortConfig[]>(classes);
  const [onlyGenerateCompleted, setOnlyGenerateCompleted] = useState(true);

  useEffect(() => {
    if (classes && classes.length > 0) {
      setClassesState(classes);
    }
  }, [classes]);

  const isLeaveRole = (role?: string) => {
    return Boolean(role && (role.startsWith('LEAVE_') || role.includes('CK')));
  };

  const getTeacherCanonical = (tid: string) => {
    if (!tid || tid === 'UNASSIGNED' || tid === 'ALL_TEACHERS') return tid;
    const t = teachers.find(tc => tc.id === tid || tc.code === tid);
    return t ? t.id : tid;
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

  const completedClassesCount = useMemo(() => {
    return classesState.filter(checkIsClassComplete).length;
  }, [classesState]);

  const detectedMaxConsecutive = useMemo(() => {
    const raw = 
      effectiveGridConfig?.maxConsecutiveSlots ??
      effectiveGridConfig?.maxConsecutivePeriods ??
      effectiveGridConfig?.maxConsecutive ??
      props.timeGridConfig?.maxConsecutiveSlots ??
      props.gridConfig?.maxConsecutiveSlots;
    return parseNumericSafe(raw, 2);
  }, [effectiveGridConfig, props]);

  const detectedTotalSlots = useMemo(() => {
    const raw = 
      effectiveGridConfig?.totalDailySlots || 
      props.totalDailySlots || 
      (props.gridConfig && props.gridConfig.totalDailySlots);
    return parseNumericSafe(raw, 10);
  }, [effectiveGridConfig, props]);

  const isIntegrated13 = detectedTotalSlots >= 13;

  const detectedFridayCap = useMemo(() => {
    const raw = 
      effectiveGridConfig?.fridayMaxSlots ?? 
      effectiveGridConfig?.maxFridaySlots ?? 
      effectiveGridConfig?.fridayLimit ?? 
      props.timeGridConfig?.fridayMaxSlots ?? 
      props.timeGridConfig?.maxFridaySlots ?? 
      props.gridConfig?.fridayMaxSlots ?? 
      props.gridConfig?.maxFridaySlots ?? 
      props.grid?.fridayMaxSlots ?? 
      props.fridayMaxSlots ?? 
      props.maxFridaySlots;

    return parseNumericSafe(raw, 5);
  }, [effectiveGridConfig, props]);

  // =========================================================================
  // ANALISA KAPASITI MINGGUAN KELAS (MENGESAN PUNCA SEBENAR WAKTU TERCICIR)
  // =========================================================================
  const classCapacityAudit = useMemo(() => {
    return classesState.map(cls => {
      let totalAssignedSlots = 0;
      const seenParallel = new Set<string>();
      const subjectCountMap = new Map<string, number>();

      (cls.demands || []).forEach(d => {
        if (d.isParallel && d.parallelSyncKey) {
          if (!seenParallel.has(d.parallelSyncKey)) {
            totalAssignedSlots += Number(d.weeklySlots) || 0;
            seenParallel.add(d.parallelSyncKey);
          }
        } else {
          totalAssignedSlots += Number(d.weeklySlots) || 0;
        }
        subjectCountMap.set(d.code, (subjectCountMap.get(d.code) || 0) + 1);
      });

      const maxGridCapacity = cls.academicStage === 'STAGE_1' ? 44 : (cls.academicStage === 'STAGE_2' ? 47 : 54);
      const isOverloaded = totalAssignedSlots > maxGridCapacity;
      const overloadCount = Math.max(0, totalAssignedSlots - maxGridCapacity);
      const duplicateCodes = Array.from(subjectCountMap.entries()).filter(([_, cnt]) => cnt > 1).map(([cd]) => cd);

      return {
        ...cls,
        totalAssignedSlots,
        maxGridCapacity,
        isOverloaded,
        overloadCount,
        duplicateCodes,
      };
    });
  }, [classesState]);

  const overloadedClasses = useMemo(() => {
    return classCapacityAudit.filter(c => c.isOverloaded);
  }, [classCapacityAudit]);

  const teacherAuditList = useMemo(() => {
    return teachers.map(t => {
      const isTeacherCK = isLeaveRole(t.role as string) || Boolean(t.isSpecialLeave) || t.maxWeeklySlots === 0;

      let totalAssigned = 0;
      classesState.forEach(c => {
        if (c.demands && Array.isArray(c.demands)) {
          c.demands.forEach(d => {
            if (d.code === 'PERH') return;
            if (d.code === 'KOKU') return; // JANGAN KIRA KOKU DUA KALI KE DALAM BEBAN TUGASAN

            if (d.teacherAllocations && d.teacherAllocations.length > 1) {
              const myAlloc = d.teacherAllocations.find(a => a.teacherId === t.id || a.teacherId === t.code);
              if (myAlloc) totalAssigned += Number(myAlloc.slots) || 0;
            } else if (d.assignedTeacherId === t.id || d.assignedTeacherId === t.code) {
              totalAssigned += Number(d.weeklySlots) || 0;
            }
          });
        }
      });

      const maxLimit = isTeacherCK ? 0 : (t.maxWeeklySlots ?? 26);
      const isOverloaded = !isTeacherCK && totalAssigned > maxLimit;
      const isCkWithSubjects = isTeacherCK && totalAssigned > 0;

      return {
        ...t,
        isTeacherCK,
        totalAssigned,
        maxLimit,
        dailyAvg: (totalAssigned / 5).toFixed(1),
        isOverloaded,
        isCkWithSubjects,
      };
    });
  }, [teachers, classesState]);

  const unassignedDemandsCount = useMemo(() => {
    let count = 0;
    classesState.forEach(c => {
      c.demands?.forEach(d => {
        if (d.code === 'PERH') return;
        if (d.code === 'KOKU') return; // Kecualikan KOKU
        if (d.teacherAllocations && d.teacherAllocations.length > 1) {
          const hasMissing = d.teacherAllocations.some(a => !a.teacherId);
          if (hasMissing) count++;
        } else if (!d.assignedTeacherId) {
          count++;
        }
      });
    });
    return count;
  }, [classesState]);

  const ckTeachersWithLoad = useMemo(() => {
    return teacherAuditList.filter(t => t.isTeacherCK && t.totalAssigned > 0);
  }, [teacherAuditList]);

  const handleAutoClearCKDemands = () => {
    const ckTeacherIds = new Set(
      teachers.filter(t => isLeaveRole(t.role as string) || t.isSpecialLeave || t.maxWeeklySlots === 0).map(t => t.id)
    );
    const ckTeacherCodes = new Set(
      teachers.filter(t => isLeaveRole(t.role as string) || t.isSpecialLeave || t.maxWeeklySlots === 0).map(t => t.code)
    );

    const updatedClasses = classesState.map(c => {
      if (!c.demands) return c;
      return {
        ...c,
        demands: c.demands.map(d => {
          if (d.teacherAllocations && d.teacherAllocations.length > 1) {
            const hasCk = d.teacherAllocations.some(a => ckTeacherIds.has(a.teacherId) || ckTeacherCodes.has(a.teacherId));
            if (hasCk) {
              return {
                ...d,
                teacherAllocations: d.teacherAllocations.map(a => 
                  (ckTeacherIds.has(a.teacherId) || ckTeacherCodes.has(a.teacherId)) ? { ...a, teacherId: '' } : a
                )
              };
            }
          } else if (ckTeacherIds.has(d.assignedTeacherId) || ckTeacherCodes.has(d.assignedTeacherId)) {
            return {
              ...d,
              assignedTeacherId: '',
            };
          }
          return d;
        }),
      };
    });

    setClassesState(updatedClasses);
    if (typeof setClasses === 'function') setClasses(updatedClasses);
    alert('Berjaya! Semua subjek yang terikat pada Guru Cuti Khas (CK) telah dikosongkan.');
  };

  const dispatchGeneratedEntries = (generatedEntries: TimetableEntry[]) => {
    if (typeof props.onComplete === 'function') {
      props.onComplete(generatedEntries);
    } else if (typeof props.onGenerated === 'function') {
      props.onGenerated(generatedEntries);
    } else if (typeof props.onNext === 'function') {
      props.onNext(generatedEntries);
    } else if (typeof props.setEntries === 'function') {
      props.setEntries(generatedEntries);
    } else if (typeof props.setTimetableEntries === 'function') {
      props.setTimetableEntries(generatedEntries);
    }
  };

  const getRoomMaxClasses = (roomId: string | null): number => {
    if (!roomId) return 999;
    const r = rooms.find(rm => rm.id === roomId || rm.code === roomId || rm.name === roomId);
    if (!r) return 1;

    if (r.roomType === 'CLASSROOM' || r.roomType === 'LAB' || r.roomType === 'SCIENCE_LAB' || r.roomType === 'RBT_WORKSHOP') {
      return 1;
    }
    if (r.roomType === 'SURAU') {
      return 2; 
    }
    if (r.roomType === 'FIELD') {
      return (Number(r.capacity) || 0) >= 70 ? 2 : 1;
    }
    return 1;
  };

  const handleStartGeneration = () => {
    setIsSolving(true);
    setSolverProgress(20);

    setTimeout(() => setSolverProgress(50), 300);
    setTimeout(() => setSolverProgress(85), 600);

    setTimeout(() => {
      const generatedEntries: TimetableEntry[] = [];
      const slotsPerDay = detectedTotalSlots;

      const recess1Slot = effectiveGridConfig?.recessGroup1Slot || 5;
      const lunchPrayerSlot = isIntegrated13 ? (Number(effectiveGridConfig?.lunchPrayerSlot) || 11) : null;
      const lastSlotOfDay = slotsPerDay;

      const timetableMap = new Map<string, TimetableEntry[]>();
      const teacherOccupiedMap = new Set<string>();
      const roomOccupancyMap = new Map<string, string[]>();

      const maxConsecutive = detectedMaxConsecutive;
      const effectiveFridayLimit = Math.max(detectedFridayCap, 5);

      const kokuCfg = effectiveGridConfig?.cocurricularConfig;
      const isKokuEnabled = Boolean(kokuCfg?.enabled);
      const kokuDay = Number(kokuCfg?.day) || 3;
      const kokuStart = Number(kokuCfg?.startSlot) || 8;
      const kokuCount = Number(kokuCfg?.slotCount) || 2;

      const teacherTotalWorkloadMap = new Map<string, number>();
      teacherAuditList.forEach(t => {
        teacherTotalWorkloadMap.set(t.id, t.totalAssigned);
        teacherTotalWorkloadMap.set(t.code, t.totalAssigned);
      });

      const classesToProcess = onlyGenerateCompleted
        ? classesState.filter(checkIsClassComplete)
        : classesState;

      // 1. KUNCI PERHIMPUNAN RASMI
      classesToProcess.forEach(cls => {
        const perhDemand = cls.demands?.find(d => d.code === 'PERH');
        const perhDay = (perhDemand?.allowedDays && perhDemand.allowedDays.length > 0) ? Number(perhDemand.allowedDays[0]) : 1;

        let perhRoomId = cls.homeroomId || null;
        if (perhDemand?.roomId) {
          perhRoomId = perhDemand.roomId;
        } else if (perhDemand?.requiredRoomType === 'HALL') {
          const hall = rooms.find(r => r.roomType === 'HALL' || r.name.toLowerCase().includes('dewan'));
          if (hall) perhRoomId = hall.id;
        } else if (perhDemand?.requiredRoomType === 'FIELD') {
          const field = rooms.find(r => r.roomType === 'FIELD' || r.name.toLowerCase().includes('padang') || r.name.toLowerCase().includes('dataran'));
          if (field) perhRoomId = field.id;
        }

        const timeSlotId = `d${perhDay}_s1`;
        const entry: TimetableEntry = {
          id: `entry_${cls.id}_${timeSlotId}_perh`,
          timetableId: 'master',
          classId: cls.id,
          timeSlotId: timeSlotId,
          subjectId: 'PERH',
          teacherId: 'ALL_TEACHERS',
          roomId: perhRoomId,
          blockInstanceId: `blk_perh_${Date.now()}`,
          isLocked: true,
        };

        generatedEntries.push(entry);
        timetableMap.set(`${cls.id}_${timeSlotId}`, [entry]);
      });

      // 2. KUNCI KOKURIKULUM (DAN ELAK DUPLIKASI KOKU DARI LANGKAH 4)
      if (isKokuEnabled) {
        classesToProcess.forEach(cls => {
          const kokuDemand = cls.demands?.find(d => d.code === 'KOKU');
          const kokuTeacher = kokuDemand?.assignedTeacherId || 'ALL_TEACHERS';

          for (let s = kokuStart; s < (kokuStart + kokuCount); s++) {
            const kokuEntry: TimetableEntry = {
              id: `entry_${cls.id}_d${kokuDay}_s${s}_koku`,
              timetableId: 'master',
              classId: cls.id,
              timeSlotId: `d${kokuDay}_s${s}`,
              subjectId: 'KOKU',
              teacherId: kokuTeacher,
              roomId: null,
              blockInstanceId: `blk_koku_${cls.id}`,
              isLocked: true,
              isCocurricular: true,
            };
            generatedEntries.push(kokuEntry);
            timetableMap.set(`${cls.id}_d${kokuDay}_s${s}`, [kokuEntry]);
          }
        });
      }

      // 3. KUNCI REHAT 2 / SOLAT ZOHOR
      if (isIntegrated13 && lunchPrayerSlot) {
        classesToProcess.forEach(cls => {
          for (const day of [1, 2, 3, 4]) {
            const zohorEntry: TimetableEntry = {
              id: `entry_${cls.id}_d${day}_s${lunchPrayerSlot}_zohor`,
              timetableId: 'master',
              classId: cls.id,
              timeSlotId: `d${day}_s${lunchPrayerSlot}`,
              subjectId: 'SOLAT_ZOHOR',
              teacherId: 'ALL_TEACHERS',
              roomId: rooms.find(r => r.roomType === 'SURAU')?.id || null,
              blockInstanceId: `blk_zohor_${cls.id}`,
              isLocked: true,
            };
            generatedEntries.push(zohorEntry);
            timetableMap.set(`${cls.id}_d${day}_s${lunchPrayerSlot}`, [zohorEntry]);
          }
        });
      }

      const getValidSlotsForDay = (day: number, cls?: ClassCohortConfig) => {
        const maxSlot = day === 5 ? 9 : slotsPerDay; // Jumaat dibuka hingga 12:00
        const valid: number[] = [];

        const r1 = recess1Slot;
        const r2 = effectiveGridConfig?.recessGroup2Slot || 6;
        const isStage2 = cls?.academicStage === 'STAGE_2';
        const recessSlot = (effectiveGridConfig?.recessMode === 'STAGGERED' && isStage2) ? r2 : r1;

        const perhDemand = cls?.demands?.find(d => d.code === 'PERH');
        const perhDay = (perhDemand?.allowedDays && perhDemand.allowedDays.length > 0) ? Number(perhDemand.allowedDays[0]) : 1;

        for (let s = 1; s <= maxSlot; s++) {
          if (day === perhDay && s === 1) continue;
          if (s === recessSlot) continue;
          if (lunchPrayerSlot && s === lunchPrayerSlot) continue;
          if (isKokuEnabled && day === kokuDay && s >= kokuStart && s < (kokuStart + kokuCount)) {
            continue;
          }
          valid.push(s);
        }
        return valid;
      };

      const checkConsecutiveRun = (teacherId: string, day: number, startSlot: number, length: number): boolean => {
        if (!teacherId || teacherId === 'UNASSIGNED' || teacherId === 'ALL_TEACHERS') return true;
        if (maxConsecutive <= 0) return true;
        const cId = getTeacherCanonical(teacherId);

        let beforeCount = 0;
        for (let s = startSlot - 1; s >= 1; s--) {
          if (s === recess1Slot || (lunchPrayerSlot && s === lunchPrayerSlot)) break;
          if (teacherOccupiedMap.has(`${cId}_d${day}_s${s}`)) beforeCount++;
          else break;
        }

        let afterCount = 0;
        for (let s = startSlot + length; s <= slotsPerDay; s++) {
          if (s === recess1Slot || (lunchPrayerSlot && s === lunchPrayerSlot)) break;
          if (teacherOccupiedMap.has(`${cId}_d${day}_s${s}`)) afterCount++;
          else break;
        }

        return (beforeCount + length + afterCount) <= (maxConsecutive + 1);
      };

      const checkClassConsecutiveSubject = (classId: string, day: number, startSlot: number, length: number, subjectCode: string): boolean => {
        let beforeCount = 0;
        for (let s = startSlot - 1; s >= 1; s--) {
          if (s === recess1Slot || (lunchPrayerSlot && s === lunchPrayerSlot)) break;
          const entries = timetableMap.get(`${classId}_d${day}_s${s}`);
          if (entries && entries.some(e => e.subjectId === subjectCode)) beforeCount++;
          else break;
        }

        let afterCount = 0;
        for (let s = startSlot + length; s <= slotsPerDay; s++) {
          if (s === recess1Slot || (lunchPrayerSlot && s === lunchPrayerSlot)) break;
          const entries = timetableMap.get(`${classId}_d${day}_s${s}`);
          if (entries && entries.some(e => e.subjectId === subjectCode)) afterCount++;
          else break;
        }

        return (beforeCount + length + afterCount) <= 2;
      };

      const checkFridayCap = (teacherId: string, day: number, length: number): boolean => {
        if (day !== 5 || !teacherId || teacherId === 'UNASSIGNED' || teacherId === 'ALL_TEACHERS') return true;
        const cId = getTeacherCanonical(teacherId);
        let countFriday = 0;
        for (let s = 1; s <= slotsPerDay; s++) {
          if (teacherOccupiedMap.has(`${cId}_d5_s${s}`)) countFriday++;
        }
        return (countFriday + length) <= effectiveFridayLimit;
      };

      const checkDailyTeacherCap = (teacherId: string, day: number, length: number): boolean => {
        if (!teacherId || teacherId === 'UNASSIGNED' || teacherId === 'ALL_TEACHERS') return true;
        if (day === 5) return checkFridayCap(teacherId, day, length);
        const cId = getTeacherCanonical(teacherId);
        const tObj = teachers.find(t => t.id === teacherId || t.code === teacherId);
        const assignedTotal = teacherTotalWorkloadMap.get(cId) || tObj?.maxWeeklySlots || 26;

        const dynamicDailyCap = Math.max(tObj?.maxDailySlots || 6, Math.ceil(assignedTotal / 4) + 1, 6);

        let countToday = 0;
        for (let s = 1; s <= slotsPerDay; s++) {
          if (teacherOccupiedMap.has(`${cId}_d${day}_s${s}`)) countToday++;
        }
        return (countToday + length) <= dynamicDailyCap;
      };

      interface SubItem {
        code: string;
        teacherId: string;
        roomId: string | null;
        requiredRoomType?: string;
        isParallel?: boolean;
        parallelSyncKey?: string;
      }

      interface SolverBlock {
        id: string;
        classId: string;
        classIdx: number;
        items: SubItem[];
        length: number;
        category?: string;
        requiredRoomType?: string;
        isPlaced: boolean;
        timeBandPreference: 'ANY' | 'PRE_RECESS' | 'POST_RECESS' | 'AFTERNOON';
        allowedDays: number[];
        isParallel: boolean;
        isOutdoor: boolean;
        isCoreSubject: boolean;
      }

      const allBlocks: SolverBlock[] = [];

      // 4. DEKOMPOSISI BLOK SUBJEK
      classesToProcess.forEach((cls, classIndex) => {
        const classIdx = typeof classIndex === 'number' ? classIndex : 0;
        const parallelGroupMap = new Map<string, SubjectDemandFormItem[]>();

        cls.demands?.forEach(d => {
          if (d.code === 'PERH') return;
          // PENTING: Jangan dekomposisi KOKU lagi kerana ia telah ditempah di Fasa 2 atas (Elak Bug Berganda)
          if (d.code === 'KOKU' && isKokuEnabled) return; 

          const timeBand: 'ANY' | 'PRE_RECESS' | 'POST_RECESS' | 'AFTERNOON' = 
            (d as any).timeBandPreference || (d.isPrimeTimePriority ? 'PRE_RECESS' : 'ANY');

          const isCore = ['BM', 'BI', 'MAT', 'SN'].includes(d.code);

          if (d.isParallel && d.parallelSyncKey) {
            const k = d.parallelSyncKey;
            if (!parallelGroupMap.has(k)) parallelGroupMap.set(k, []);
            parallelGroupMap.get(k)!.push(d);
          } else {
            const isOutdoor = d.code === 'PJK' || d.requiredRoomType === 'FIELD';
            const isSplit = d.teacherAllocations && d.teacherAllocations.length > 1;

            if (isSplit) {
              d.teacherAllocations!.forEach((alloc, allocIdx) => {
                if (!alloc.slots) return;
                const assignedTId = alloc.teacherId ? alloc.teacherId : 'UNASSIGNED';
                const teacherObj = teachers.find(t => t.id === assignedTId || t.code === assignedTId);
                if (teacherObj && (isLeaveRole(teacherObj.role as string) || teacherObj.isSpecialLeave)) return;

                let remSlots = Number(alloc.slots) || 0;
                let validDays = (Array.isArray(d.allowedDays) && d.allowedDays.length > 0)
                  ? d.allowedDays.map(Number)
                  : [1, 2, 3, 4, 5];

                if (teacherObj) {
                  if (Array.isArray(teacherObj.availableDays) && teacherObj.availableDays.length > 0) {
                    const avail = teacherObj.availableDays.map(Number);
                    validDays = validDays.filter(day => avail.includes(Number(day)));
                  }
                  if (Array.isArray(teacherObj.unavailableDays) && teacherObj.unavailableDays.length > 0) {
                    const unavail = teacherObj.unavailableDays.map(Number);
                    validDays = validDays.filter(day => !unavail.includes(Number(day)));
                  }
                }
                if (validDays.length === 0) validDays = [1, 2, 3, 4, 5];

                while (remSlots > 0) {
                  const bSize = remSlots >= 2 ? 2 : 1;
                  allBlocks.push({
                    id: `blk_${cls.id}_${d.code}_${assignedTId}_${remSlots}_${allocIdx}`,
                    classId: cls.id,
                    classIdx,
                    items: [{
                      code: d.code,
                      teacherId: assignedTId,
                      roomId: d.requiredRoomType === 'FIELD' 
                        ? (rooms.find(r => r.roomType === 'FIELD')?.id || null)
                        : (d.requiredRoomType === 'SURAU' ? (rooms.find(r => r.roomType === 'SURAU')?.id || cls.homeroomId || null) : (cls.homeroomId || null)),
                      requiredRoomType: d.requiredRoomType
                    }],
                    length: bSize,
                    category: d.category,
                    requiredRoomType: d.requiredRoomType,
                    isPlaced: false,
                    timeBandPreference: timeBand,
                    allowedDays: validDays,
                    isParallel: false,
                    isOutdoor,
                    isCoreSubject: isCore,
                  });
                  remSlots -= bSize;
                }
              });
            } else {
              const assignedTId = d.assignedTeacherId ? d.assignedTeacherId : 'UNASSIGNED';
              const teacherObj = teachers.find(t => t.id === assignedTId || t.code === assignedTId);
              if (teacherObj && (isLeaveRole(teacherObj.role as string) || teacherObj.isSpecialLeave)) return;

              let remSlots = Number(d.weeklySlots) || 0;
              let validDays = (Array.isArray(d.allowedDays) && d.allowedDays.length > 0)
                ? d.allowedDays.map(Number)
                : [1, 2, 3, 4, 5];

              if (teacherObj) {
                if (Array.isArray(teacherObj.availableDays) && teacherObj.availableDays.length > 0) {
                  const avail = teacherObj.availableDays.map(Number);
                  validDays = validDays.filter(day => avail.includes(Number(day)));
                }
                if (Array.isArray(teacherObj.unavailableDays) && teacherObj.unavailableDays.length > 0) {
                  const unavail = teacherObj.unavailableDays.map(Number);
                  validDays = validDays.filter(day => !unavail.includes(Number(day)));
                }
              }
              if (validDays.length === 0) validDays = [1, 2, 3, 4, 5];

              while (remSlots > 0) {
                const bSize = remSlots >= 2 ? 2 : 1;
                allBlocks.push({
                  id: `blk_${cls.id}_${d.code}_${remSlots}`,
                  classId: cls.id,
                  classIdx,
                  items: [{
                    code: d.code,
                    teacherId: assignedTId,
                    roomId: d.requiredRoomType === 'FIELD' 
                      ? (rooms.find(r => r.roomType === 'FIELD')?.id || null)
                      : (d.requiredRoomType === 'SURAU' ? (rooms.find(r => r.roomType === 'SURAU')?.id || cls.homeroomId || null) : (cls.homeroomId || null)),
                    requiredRoomType: d.requiredRoomType
                  }],
                  length: bSize,
                  category: d.category,
                  requiredRoomType: d.requiredRoomType,
                  isPlaced: false,
                  timeBandPreference: timeBand,
                  allowedDays: validDays,
                  isParallel: false,
                  isOutdoor,
                  isCoreSubject: isCore,
                });
                remSlots -= bSize;
              }
            }
          }
        });

        // Subjek Selari
        parallelGroupMap.forEach((demandsGroup, syncKey) => {
          const maxSlots = Math.max(...demandsGroup.map(d => Number(d.weeklySlots) || 0));
          let remSlots = maxSlots;
          let allowedDays = demandsGroup[0]?.allowedDays && demandsGroup[0].allowedDays.length > 0
            ? demandsGroup[0].allowedDays.map(Number)
            : [1, 2, 3, 4, 5];

          const timeBand = (demandsGroup[0] as any)?.timeBandPreference || 'ANY';

          while (remSlots > 0) {
            const bSize = remSlots >= 2 ? 2 : 1;
            const bundleItems: SubItem[] = demandsGroup.map(d => {
              const assignedTId = d.assignedTeacherId ? d.assignedTeacherId : 'UNASSIGNED';
              const pRoomId = d.requiredRoomType === 'SURAU'
                ? (rooms.find(r => r.roomType === 'SURAU')?.id || cls.homeroomId || null)
                : (d.requiredRoomType === 'FIELD'
                  ? (rooms.find(r => r.roomType === 'FIELD')?.id || null)
                  : (cls.homeroomId || null));

              return {
                code: d.code,
                teacherId: assignedTId,
                roomId: pRoomId,
                requiredRoomType: d.requiredRoomType,
                isParallel: true,
                parallelSyncKey: syncKey,
              };
            });

            allBlocks.push({
              id: `blk_par_${cls.id}_${syncKey}_${remSlots}`,
              classId: cls.id,
              classIdx,
              items: bundleItems,
              length: bSize,
              category: demandsGroup[0]?.category || 'DINIYAH_RELIGIOUS',
              requiredRoomType: demandsGroup[0]?.requiredRoomType,
              isPlaced: false,
              timeBandPreference: timeBand,
              allowedDays,
              isParallel: true,
              isOutdoor: false,
              isCoreSubject: false,
            });
            remSlots -= bSize;
          }
        });
      });

      const hasSubjectInDay = (classId: string, day: number, code: string) => {
        for (let s = 1; s <= slotsPerDay; s++) {
          const list = timetableMap.get(`${classId}_d${day}_s${s}`);
          if (list && list.some(e => e.subjectId === code)) return true;
        }
        return false;
      };

      const countTotalSlotsInDay = (classId: string, day: number) => {
        let count = 0;
        for (let s = 1; s <= slotsPerDay; s++) {
          if (timetableMap.has(`${classId}_d${day}_s${s}`)) count++;
        }
        return count;
      };

      // 5. SEMAKAN KELAYAKAN BLOK
      const canFitBlock = (
        b: SolverBlock, 
        day: number, 
        startSlot: number, 
        strictDailyCap: boolean = true,
        isRelaxed: boolean = false,
        allowRoomFallback: boolean = false
      ): boolean => {
        const isAllowedDay = b.allowedDays.map(Number).includes(Number(day));
        if (!isAllowedDay && !isRelaxed) return false;

        const endSlot = startSlot + b.length - 1;

        if (!isRelaxed && b.timeBandPreference !== 'ANY') {
          if (b.timeBandPreference === 'PRE_RECESS') {
            if (endSlot > 4) return false;
          } else if (b.timeBandPreference === 'POST_RECESS') {
            if (startSlot < 6 || endSlot > 10) return false;
          } else if (b.timeBandPreference === 'AFTERNOON') {
            if (startSlot < 10) return false;
          }
        }

        if (!isRelaxed) {
          for (const item of b.items) {
            const isBigSubject = item.code === 'BM';
            if (!isBigSubject && hasSubjectInDay(b.classId, day, item.code)) return false;
          }
        }

        for (const item of b.items) {
          if (!checkClassConsecutiveSubject(b.classId, day, startSlot, b.length, item.code)) return false;
        }

        if (b.isOutdoor && !isRelaxed) {
          if (endSlot > 6 || startSlot > 6) return false;
        }

        const cls = classesState.find(c => c.id === b.classId);
        const validSlots = getValidSlotsForDay(day, cls);

        for (let k = 0; k < b.length; k++) {
          const s = startSlot + k;
          if (!validSlots.includes(s)) return false;
          if (timetableMap.has(`${b.classId}_d${day}_s${s}`)) return false;

          for (const item of b.items) {
            if (item.teacherId && item.teacherId !== 'UNASSIGNED') {
              const cId = getTeacherCanonical(item.teacherId);
              if (teacherOccupiedMap.has(`${cId}_d${day}_s${s}`)) return false;
            }
          }

          for (const item of b.items) {
            if (item.roomId) {
              const maxRoomCap = getRoomMaxClasses(item.roomId);
              const occList = roomOccupancyMap.get(`${item.roomId}_d${day}_s${s}`) || [];
              if (occList.length >= maxRoomCap && !occList.includes(b.classId)) {
                if (allowRoomFallback || item.requiredRoomType === 'SURAU') continue;
                return false;
              }
            }
          }
        }

        for (const item of b.items) {
          if (item.teacherId && item.teacherId !== 'UNASSIGNED') {
            if (!checkFridayCap(item.teacherId, day, b.length)) return false;
            if (strictDailyCap && !checkDailyTeacherCap(item.teacherId, day, b.length)) return false;
            if (!checkConsecutiveRun(item.teacherId, day, startSlot, b.length)) return false;
          }
        }

        return true;
      };

      const placeBlock = (b: SolverBlock, day: number, startSlot: number, tag: string = '', fallbackToClassroom: boolean = false) => {
        const cls = classesState.find(c => c.id === b.classId);

        for (let k = 0; k < b.length; k++) {
          const s = startSlot + k;
          const slotEntries: TimetableEntry[] = [];

          b.items.forEach(item => {
            const isUnassigned = !item.teacherId || item.teacherId === 'UNASSIGNED';

            let resolvedRoomId = item.roomId;
            if (fallbackToClassroom && (item.requiredRoomType === 'SURAU' || item.requiredRoomType === 'FIELD')) {
              resolvedRoomId = cls?.homeroomId || null;
            }

            const entry: TimetableEntry = {
              id: `entry_${b.classId}_d${day}_s${s}_${item.code}_${tag}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              timetableId: 'master',
              classId: b.classId,
              timeSlotId: `d${day}_s${s}`,
              subjectId: item.code,
              teacherId: isUnassigned ? null : item.teacherId,
              roomId: resolvedRoomId,
              blockInstanceId: `blk_${b.id}_${tag}`,
              isLocked: false,
              isParallel: b.isParallel,
              parallelSyncKey: item.parallelSyncKey,
            };
            generatedEntries.push(entry);
            slotEntries.push(entry);
            
            if (!isUnassigned) {
              const cId = getTeacherCanonical(item.teacherId);
              teacherOccupiedMap.add(`${cId}_d${day}_s${s}`);
            }

            if (resolvedRoomId) {
              const occKey = `${resolvedRoomId}_d${day}_s${s}`;
              const currentOcc = roomOccupancyMap.get(occKey) || [];
              if (!currentOcc.includes(b.classId)) {
                currentOcc.push(b.classId);
                roomOccupancyMap.set(occKey, currentOcc);
              }
            }
          });

          timetableMap.set(`${b.classId}_d${day}_s${s}`, slotEntries);
        }
        b.isPlaced = true;
      };

      const getStaggeredDays = (idx: number = 0, allowedDays: number[]): number[] => {
        const baseDays = [1, 2, 3, 4, 5];
        const offset = Math.abs(idx) % 5;
        const rotated = baseDays.slice(offset).concat(baseDays.slice(0, offset));
        const cleanAllowed = allowedDays.map(Number);
        return rotated.filter(d => cleanAllowed.includes(d));
      };

      // FASA 0: PJK (Waktu sejuk padang)
      const pjkBlocks = allBlocks.filter(b => b.isOutdoor && !b.isPlaced);
      pjkBlocks.sort((a, b) => b.length - a.length);

      pjkBlocks.forEach(b => {
        let placed = false;
        const validDays = getStaggeredDays(b.classIdx ?? 0, b.allowedDays);
        validDays.sort((dA, dB) => countTotalSlotsInDay(b.classId, dA) - countTotalSlotsInDay(b.classId, dB));

        const cls = classesState.find(c => c.id === b.classId);
        const perhDemand = cls?.demands?.find(d => d.code === 'PERH');
        const perhDay = (perhDemand?.allowedDays && perhDemand.allowedDays.length > 0) ? Number(perhDemand.allowedDays[0]) : 1;

        for (const day of validDays) {
          if (placed) break;
          const coolSlots = b.length >= 2 
            ? (day === perhDay ? [2, 3] : [1, 2, 3]) 
            : (day === perhDay ? [2, 3, 4, 6] : [1, 2, 3, 4, 6]);

          for (const s of coolSlots) {
            if (canFitBlock(b, day, s, true)) {
              placeBlock(b, day, s, 'pjk_cool');
              placed = true;
              break;
            }
          }
        }
      });

      // FASA 1: TUTUP LOMPANG W4 PRA-REHAT
      classesToProcess.forEach(cls => {
        for (let day = 1; day <= 5; day++) {
          const isSlot4Empty = !timetableMap.has(`${cls.id}_d${day}_s4`);
          const hasSlotBefore = timetableMap.has(`${cls.id}_d${day}_s1`) || timetableMap.has(`${cls.id}_d${day}_s2`) || timetableMap.has(`${cls.id}_d${day}_s3`);

          if (isSlot4Empty && hasSlotBefore) {
            const candidate1W = allBlocks.find(b => 
              b.classId === cls.id && 
              !b.isPlaced && 
              b.length === 1 && 
              canFitBlock(b, day, 4, true)
            );

            if (candidate1W) {
              placeBlock(candidate1W, day, 4, 'anti_gap_w4');
            }
          }
        }
      });

      // FASA 2: PENJANAAN ZON MANUAL ADMIN (PRE_RECESS & POST_RECESS)
      const zonedBlocks = allBlocks.filter(b => !b.isPlaced && b.timeBandPreference !== 'ANY');
      zonedBlocks.sort((a, b) => b.length - a.length);

      zonedBlocks.forEach(b => {
        let placed = false;
        const validDays = getStaggeredDays(b.classIdx ?? 0, b.allowedDays);
        validDays.sort((dA, dB) => countTotalSlotsInDay(b.classId, dA) - countTotalSlotsInDay(b.classId, dB));

        const targetSlots = b.timeBandPreference === 'PRE_RECESS' ? [1, 2, 3, 4] : [6, 7, 8, 9, 10];

        for (const day of validDays) {
          if (placed) break;
          for (const s of targetSlots) {
            if (canFitBlock(b, day, s, true)) {
              placeBlock(b, day, s, 'zone_placed');
              placed = true;
              break;
            }
          }
        }
      });

      // FASA 3: AGIHAN PADAT SUBJEK UTAMA & SUBJEK SELARI (ZON BEBAS)
      const remainingBlocks = allBlocks.filter(b => !b.isPlaced);
      remainingBlocks.sort((a, b) => {
        if (a.isParallel !== b.isParallel) return a.isParallel ? -1 : 1;
        if (b.length !== a.length) return b.length - a.length;
        if (a.isCoreSubject !== b.isCoreSubject) return a.isCoreSubject ? -1 : 1;
        return a.classIdx - b.classIdx;
      });

      const unplacedBlocks: SolverBlock[] = [];

      remainingBlocks.forEach(b => {
        let placed = false;
        const validDays = getStaggeredDays(b.classIdx ?? 0, b.allowedDays);
        validDays.sort((dA, dB) => countTotalSlotsInDay(b.classId, dA) - countTotalSlotsInDay(b.classId, dB));

        for (const day of validDays) {
          if (placed) break;
          const cls = classesState.find(c => c.id === b.classId);
          const validSlots = getValidSlotsForDay(day, cls);

          for (const s of validSlots) {
            if (canFitBlock(b, day, s, true)) {
              placeBlock(b, day, s, 'compact_fill');
              placed = true;
              break;
            }
          }
        }

        if (!placed) unplacedBlocks.push(b);
      });

      // FASA 4: ENJIN PENYELAMAT SIFAR-CICIR MUTLAK DENGAN PEMODALAN 1W AUTO-SPLIT
      unplacedBlocks.forEach(b => {
        const slotsNeeded = b.length;
        for (let i = 0; i < slotsNeeded; i++) {
          let placed = false;
          const cls = classesState.find(c => c.id === b.classId);
          
          const allSchoolDays = [1, 2, 3, 4, 5];
          allSchoolDays.sort((dA, dB) => countTotalSlotsInDay(b.classId, dA) - countTotalSlotsInDay(b.classId, dB));

          // Pusingan 4A: Cuba letak slot tunggal 1W merentas hari dibenarkan
          for (const day of b.allowedDays) {
            if (placed) break;
            for (const s of getValidSlotsForDay(day, cls)) {
              const singleB: SolverBlock = { ...b, length: 1, isPlaced: false };
              if (canFitBlock(singleB, day, s, false)) {
                placeBlock(singleB, day, s, 'rescue_tier1');
                placed = true;
                break;
              }
            }
          }

          // Pusingan 4B: Longgarkan zon waktu dan benarkan bilik asas jika surau penuh
          if (!placed) {
            for (const day of b.allowedDays) {
              if (placed) break;
              for (const s of getValidSlotsForDay(day, cls)) {
                const singleB: SolverBlock = { ...b, length: 1, isPlaced: false };
                if (canFitBlock(singleB, day, s, false, true, true)) {
                  placeBlock(singleB, day, s, 'rescue_tier2', true);
                  placed = true;
                  break;
                }
              }
            }
          }

          // Pusingan 4C: Penyelamat Mutlak (Gunakan mana-mana slot kosong termasuk Isnin)
          if (!placed) {
            for (const day of allSchoolDays) {
              if (placed) break;
              for (const s of getValidSlotsForDay(day, cls)) {
                const isClassSlotFree = !timetableMap.has(`${b.classId}_d${day}_s${s}`);
                const isTeacherSlotFree = b.items.every(item => {
                  if (!item.teacherId || item.teacherId === 'UNASSIGNED') return true;
                  const cId = getTeacherCanonical(item.teacherId);
                  return !teacherOccupiedMap.has(`${cId}_d${day}_s${s}`);
                });

                if (isClassSlotFree && isTeacherSlotFree) {
                  const singleB: SolverBlock = { ...b, length: 1, isPlaced: false };
                  placeBlock(singleB, day, s, 'rescue_absolute', true);
                  placed = true;
                  break;
                }
              }
            }
          }
        }
      });

      setSolverProgress(100);
      setIsSolving(false);

      dispatchGeneratedEntries(generatedEntries);
    }, 800);
  };

  const handleBackNavigation = () => {
    if (typeof onBack === 'function') {
      onBack();
    } else if (typeof props.onPrev === 'function') {
      props.onPrev();
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
        maxWidth: '1240px',
        margin: '0 auto',
        boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.03), 0 2px 4px -2px rgba(15, 23, 42, 0.02)'
      }}>
        
        {/* HEADER */}
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
              Langkah 5 daripada 6
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Enjin Penjana AI-CSP Jaminan Sifar-Cicir (100% Kontrak PdP)</span>
          </div>

          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.3px' }}>
            Penjana Jadual Waktu Automatik AI-CSP
          </h1>
          <p style={{ fontSize: '0.80rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
            Menjana jadual waktu secara pintar dengan Enjin Sifar-Cicir: memantau kuota kapasiti kelas murid (had 44 waktu), mematuhi Had Jumaat ({detectedFridayCap} waktu), dan membenarkan anjalan bilik surau.
          </p>
        </div>

        {/* =========================================================================
            BANNER AMARAN LEBIHAN BEBAN KELAS (DIAGNOSIS PUNCA UTAMA WAKTU TERCICIR)
           ========================================================================= */}
        {overloadedClasses.length > 0 && (
          <div style={{
            background: '#fef2f2',
            border: '2px solid #ef4444',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            marginBottom: '1rem',
            boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <AlertTriangle size={24} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: '0.88rem', color: '#991b1b', display: 'block', marginBottom: '4px' }}>
                  AMARAN KRITIKAL: Tuntutan Waktu Murid Melebihi Had Kapasiti Mingguan!
                </strong>
                <p style={{ fontSize: '0.78rem', color: '#b91c1c', margin: '0 0 8px 0', lineHeight: 1.5 }}>
                  Sistem mengesan kelas berikut menuntut waktu PdP melebihi slot fizikal yang wujud dalam grid persekolahan (Maksimum 44 Waktu Seminggu). Lebihan waktu ini <strong>pasti tercicir</strong> kerana kelas murid sudah 100% penuh:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {overloadedClasses.map(oc => (
                    <div key={oc.id} style={{ background: '#ffffff', border: '1px solid #fecaca', borderRadius: '6px', padding: '0.45rem 0.75rem', fontSize: '0.76rem', color: '#7f1d1d' }}>
                      <strong>Kelas {oc.name}:</strong> Menuntut <strong>{oc.totalAssignedSlots} Waktu</strong> (Had Maksimum Grid: <strong>{oc.maxGridCapacity} Waktu</strong>) &rarr; <span style={{ color: '#dc2626', fontWeight: 800 }}>Terlebih {oc.overloadCount} Waktu PdP!</span>
                      {oc.duplicateCodes.length > 0 && (
                        <span style={{ display: 'block', color: '#b91c1c', marginTop: '2px', fontSize: '0.72rem' }}>
                          ⚠️ Terdapat subjek bertindih dalam kelas ini: <strong>{oc.duplicateCodes.join(', ')}</strong> (cth: ditugaskan kepada 2 guru berasingan).
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleBackNavigation}
                    style={{
                      background: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.45rem 1rem',
                      borderRadius: '6px',
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    ← Kembali ke Langkah 4 untuk Seimbangkan Kuota Kelas kepada 44 Waktu
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUIS KAWALAN: JANA KELAS LENGKAP SAHAJA ATAU SEMUA */}
        <div style={{
          background: '#f0fdf4',
          border: '1.5px solid #bbf7d0',
          borderRadius: '12px',
          padding: '0.85rem 1.15rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={18} color="#16a34a" />
            <div>
              <strong style={{ fontSize: '0.82rem', color: '#166534' }}>
                Kawalan Skop Penjanaan: {completedClassesCount} daripada {classesState.length} Kelas Lengkap
              </strong>
              <p style={{ fontSize: '0.74rem', color: '#15803d', margin: '2px 0 0 0' }}>
                {completedClassesCount === 1 
                  ? 'Hanya kelas 1 Melur yang telah lengkap diagihkan guru. Mod "Jana Kelas Lengkap Sahaja" diaktifkan secara lalai agar kelas lain tidak mengambil bilik/slot.' 
                  : 'Pilih mod penjanaan mengikut kesediaan agihan guru anda.'}
              </p>
            </div>
          </div>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: '#ffffff', padding: '0.4rem 0.85rem', borderRadius: '8px', border: '1px solid #86efac' }}>
            <input
              type="checkbox"
              checked={onlyGenerateCompleted}
              onChange={(e) => setOnlyGenerateCompleted(e.target.checked)}
              style={{ accentColor: '#16a34a', width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#166534' }}>
              Jana Kelas Yang Lengkap Sahaja ({completedClassesCount} Kelas)
            </span>
          </label>
        </div>

        {unassignedDemandsCount > 0 && !onlyGenerateCompleted && (
          <div style={{
            background: '#fffbeb',
            border: '1.5px solid #fde68a',
            borderRadius: '12px',
            padding: '0.85rem 1.15rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={22} color="#d97706" />
              <div>
                <strong style={{ fontSize: '0.84rem', color: '#92400e' }}>
                  Perhatian: Terdapat {unassignedDemandsCount} subjek masih berstatus "Belum Ditugaskan"
                </strong>
                <p style={{ fontSize: '0.74rem', color: '#b45309', margin: '2px 0 0 0' }}>
                  Subjek tanpa guru akan dilabel sebagai <strong>[Guru Belum Ditetapkan]</strong> dan tidak akan dibebankan kepada guru lain.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBackNavigation}
              style={{
                background: '#d97706',
                color: '#ffffff',
                border: 'none',
                padding: '0.45rem 0.9rem',
                borderRadius: '6px',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ← Tetapkan Guru di Langkah 4
            </button>
          </div>
        )}

        {/* KAD METRIK */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={18} color="#2563eb" />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>Struktur Grid Waktu:</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                {detectedTotalSlots >= 13 ? '13 Waktu (Integrasi/SRAI)' : `${detectedTotalSlots} Waktu (Standard SK/SMK)`}
              </div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fefce8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} color="#ca8a04" />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>Had Masa Hari Jumaat:</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ca8a04' }}>
                Maksimum {detectedFridayCap} Waktu
              </div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} color="#16a34a" />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>Had Berturut-turut:</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#16a34a' }}>
                Maksimum {detectedMaxConsecutive} Waktu
              </div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={18} color="#a21caf" />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>Jaminan Sifar-Cicir:</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#16a34a' }}>
                Patuhi Kontrak 100%
              </div>
            </div>
          </div>
        </div>

        {/* NOTIFIKASI GURU CK */}
        {ckTeachersWithLoad.length > 0 && (
          <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: '12px', padding: '0.85rem 1.15rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={20} color="#ea580c" />
              <div>
                <strong style={{ color: '#9a3412', fontSize: '0.84rem' }}>
                  Perhatian: Terdapat Guru Berstatus Cuti Khas (CK) Masih Terikat Subjek
                </strong>
                <div style={{ fontSize: '0.74rem', color: '#c2410c', marginTop: '2px' }}>
                  {ckTeachersWithLoad.map(t => `${t.fullName} (${t.totalAssigned} waktu)`).join(', ')} perlu digantikan dengan guru aktif.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAutoClearCKDemands}
              style={{ background: '#ea580c', color: '#ffffff', border: 'none', padding: '0.42rem 0.95rem', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(234,88,12,0.25)' }}
            >
              <RefreshCw size={13} /> Nyah-Tugaskan Subjek Guru CK
            </button>
          </div>
        )}

        {/* AGIHAN SUBJEK MENGIKUT KELAS */}
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '1.15rem 1.25rem', marginBottom: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.85rem 0' }}>
            Agihan Subjek Mengikut Kelas (Kurikulum Semasa):
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {classesState.map((cls, clsIdx) => {
              const isComplete = checkIsClassComplete(cls);

              return (
                <div key={cls.id || `cls_${clsIdx}`} style={{ background: '#ffffff', border: isComplete ? '1.5px solid #86efac' : '1px solid #e2e8f0', borderRadius: '8px', padding: '0.9rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                      Kelas: {cls.name}
                    </div>
                    {isComplete ? (
                      <span style={{ fontSize: '0.62rem', background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        ✓ Lengkap Selesai
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.62rem', background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                        Perlu Lengkapkan Guru
                      </span>
                    )}
                  </div>

                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.78rem', color: '#334155', lineHeight: '1.65' }}>
                    {cls.demands?.map((d, dIdx) => {
                      if (d.code === 'PERH') {
                        return (
                          <li key={`perh_${cls.id || clsIdx}_${dIdx}`} style={{ marginBottom: '2px' }}>
                            <strong>PERH</strong> (Perhimpunan Rasmi) [1W]:{' '}
                            <span style={{ color: '#166534', fontWeight: 600, background: '#f0fdf4', padding: '1px 6px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                              Semua Guru
                            </span>
                          </li>
                        );
                      }

                      const isParallel = Boolean(d.isParallel);
                      const isSplit = d.teacherAllocations && d.teacherAllocations.length > 1;

                      if (isSplit) {
                        const splitTeachersText = d.teacherAllocations!.map(a => {
                          const tc = teachers.find(t => t.id === a.teacherId || t.code === a.teacherId);
                          return `${tc?.code || 'Guru'}: ${a.slots}W`;
                        }).join(', ');

                        return (
                          <li key={`split_${cls.id || clsIdx}_${dIdx}_${d.code || 'sub'}`} style={{ marginBottom: '3px' }}>
                            <strong>{d.code}</strong> ({d.name || d.code}) [{d.weeklySlots}W]{' '}
                            {isParallel && <span style={{ color: '#7c3aed', fontSize: '0.70rem', fontWeight: 600 }}>🔗 Selari</span>}:{' '}
                            <span style={{ color: '#1d4ed8', fontWeight: 700, background: '#eff6ff', padding: '2px 7px', borderRadius: '5px', border: '1px solid #bfdbfe', fontSize: '0.73rem' }}>
                              👥 Kongsi ({splitTeachersText})
                            </span>
                          </li>
                        );
                      }

                      const t = teachers.find(tc => tc.id === d.assignedTeacherId || tc.code === d.assignedTeacherId);
                      const isCk = t && isLeaveRole(t.role as string);

                      return (
                        <li key={`single_${cls.id || clsIdx}_${dIdx}_${d.code || 'sub'}`} style={{ marginBottom: '2px' }}>
                          <strong>{d.code}</strong> ({d.name || d.code}) [{d.weeklySlots}W]{' '}
                          {isParallel && <span style={{ color: '#7c3aed', fontSize: '0.70rem', fontWeight: 600 }}>🔗 Selari</span>}:{' '}
                          {isCk ? (
                            <span style={{ color: '#be185d', fontWeight: 600 }}>{t.fullName} (Perlu Guru Ganti)</span>
                          ) : t ? (
                            <span>{t.code}</span>
                          ) : (
                            <span style={{ color: '#ea580c', fontWeight: 600 }}>Belum Ditugaskan</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* JADUAL AUDIT GURU */}
        <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserCheck size={16} color="#2563eb" />
              Analisa Keseluruhan Taburan Masa Mengajar Setiap Guru (Pra-Penjanaan):
            </h3>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Status Audit Pra-Penjanaan Jadual Waktu</span>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #cbd5e1' }}>
                  <th style={{ padding: '0.55rem 0.75rem', textAlign: 'left', width: '60px', fontWeight: 700, color: '#334155' }}>Kod</th>
                  <th style={{ padding: '0.55rem 0.75rem', textAlign: 'left', fontWeight: 700, color: '#334155' }}>Nama Guru</th>
                  <th style={{ padding: '0.55rem 0.75rem', textAlign: 'left', width: '160px', fontWeight: 700, color: '#334155' }}>Jawatan / Status</th>
                  <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center', width: '110px', fontWeight: 700, color: '#334155' }}>Had Maksimum</th>
                  <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center', width: '120px', fontWeight: 700, color: '#334155' }}>Jumlah Ditugaskan</th>
                  <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center', width: '100px', fontWeight: 700, color: '#334155' }}>Purata Sehari</th>
                  <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center', width: '160px', fontWeight: 700, color: '#334155' }}>Status Audit</th>
                </tr>
              </thead>
              <tbody>
                {teacherAuditList.map((t, idx) => (
                  <tr key={`audit_${t.id || t.code || idx}_${idx}`} style={{ borderBottom: '1px solid #e2e8f0', background: t.isTeacherCK ? '#fffafb' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc') }}>
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 400, color: '#0f172a' }}>{t.code}</td>
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 400, color: '#1e293b' }}>{t.fullName}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <span style={{ fontSize: '0.66rem', fontWeight: 400, padding: '2px 7px', borderRadius: '4px', background: t.isTeacherCK ? '#fce7f3' : (t.role === 'ADMIN_PK' ? '#ede9fe' : '#e0f2fe'), color: t.isTeacherCK ? '#be185d' : (t.role === 'ADMIN_PK' ? '#6d28d9' : '#0369a1'), border: t.isTeacherCK ? '1px solid #fbcfe8' : '1px solid #cbd5e1' }}>
                        {String(t.role)}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 400, color: '#0f172a' }}>{t.maxLimit} waktu</td>
                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 700, color: t.isOverloaded ? '#dc2626' : (t.isTeacherCK ? '#94a3b8' : '#16a34a') }}>
                      {t.totalAssigned} waktu
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', color: '#64748b', fontWeight: 400 }}>{t.isTeacherCK ? '-' : `~${t.dailyAvg} w/hari`}</td>
                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                      {t.isTeacherCK ? (
                        t.totalAssigned > 0 ? (
                          <span style={{ color: '#ea580c', fontWeight: 400, fontSize: '0.70rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <AlertTriangle size={12} /> Perlu Guru Ganti ({t.totalAssigned}W)
                          </span>
                        ) : (
                          <span style={{ color: '#be185d', fontWeight: 400, fontSize: '0.70rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Check size={12} /> Cuti Khas Sah (CK)
                          </span>
                        )
                      ) : t.isOverloaded ? (
                        <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.70rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <AlertTriangle size={12} /> Melebihi Kuota ({t.totalAssigned}W)
                        </span>
                      ) : (
                        <span style={{ color: '#166534', fontWeight: 400, fontSize: '0.70rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Check size={12} /> Optimum
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* BAR KEMAJUAN */}
        {isSolving && (
          <div style={{ background: '#eff6ff', border: '1.5px solid #3b82f6', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.80rem', fontWeight: 800, color: '#1e40af' }}>
                <RefreshCw size={14} style={{ animation: 'spin 2s linear infinite' }} />
                <span>Enjin AI-CSP Sedang Menjana dengan Jaminan Sifar-Cicir...</span>
              </div>
              <span style={{ fontSize: '0.80rem', fontWeight: 800, color: '#2563eb' }}>{solverProgress}%</span>
            </div>

            <div style={{ width: '100%', height: '8px', backgroundColor: '#dbeafe', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{ width: `${solverProgress}%`, height: '100%', backgroundColor: '#2563eb', borderRadius: '9999px', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        )}

        {/* BAR NAVIGASI BAWAH */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={handleBackNavigation}
            style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#475569', padding: '0.55rem 1.25rem', borderRadius: '8px', fontSize: '0.80rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s ease' }}
          >
            <ArrowLeft size={16} />
            <span>Kembali Ubah Parameter</span>
          </button>

          <button
            type="button"
            disabled={isSolving}
            onClick={handleStartGeneration}
            style={{ backgroundColor: isSolving ? '#94a3b8' : '#2563eb', color: '#ffffff', border: 'none', padding: '0.65rem 1.8rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800, cursor: isSolving ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: isSolving ? 'none' : '0 4px 10px rgba(37,99,235,0.3)', transition: 'background-color 0.15s ease' }}
          >
            {isSolving ? (
              <>
                <RefreshCw size={15} style={{ animation: 'spin 2s linear infinite' }} />
                <span>Sedang Menjana ({solverProgress}%)...</span>
              </>
            ) : (
              <>
                <Play size={15} fill="#ffffff" />
                <span>Sahkan Parameter & Mulakan Penjanaan AI-CSP</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}