// src/components/wizard/Step6MasterGrid.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  TimeGridConfigState, 
  TeacherFormState, 
  RoomFormState, 
  ClassCohortConfig, 
  TimetableEntry, 
  StateGroup, 
  FlexibleScheduleConfig 
} from '@/types/timetable';
import styles from './Step6MasterGrid.module.css';
import { 
  Printer, 
  Zap, 
  Edit3, 
  PlusCircle, 
  BarChart3, 
  SlidersHorizontal, 
  Moon, 
  Wifi, 
  X, 
  Send, 
  Mail, 
  Copy, 
  Layers, 
  BookOpen, 
  UserCheck, 
  Check, 
  RefreshCw, 
  School, 
  ChevronDown,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface Props {
  entries: TimetableEntry[];
  gridConfig: TimeGridConfigState;
  stateGroup: StateGroup;
  classes: ClassCohortConfig[];
  teachers: TeacherFormState[];
  rooms: RoomFormState[];
  onBack?: () => void;
  [key: string]: any;
}

interface PdprBlockConfig {
  enabled: boolean;
  name: string;
  startTime: string;
  blockDurationMinutes: number;
  recessMinutes: number;
  totalBlocks: number;
  labelBadge: string;
}

function formatCalculatedTime(
  startStr: string, 
  slotIndex: number, 
  durationMinutes: number
): string {
  const [h, m] = (startStr || '07:30').split(':').map(Number);
  const startTotal = h * 60 + m + (slotIndex - 1) * durationMinutes;
  const endTotal = startTotal + durationMinutes;

  const toStr = (mins: number) => {
    const hh = Math.floor(mins / 60);
    const mm = mins % 60;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  };

  return `${toStr(startTotal)} - ${toStr(endTotal)}`;
}

function formatRoomShortName(name?: string | null): string {
  if (!name) return '';
  if (name.includes('Pusat Sumber') || name.includes('Perpustakaan')) return 'PSS';
  if (name.includes('Makmal Sains')) return name.replace('Makmal Sains', 'Makmal SN');
  if (name.includes('Bengkel RBT')) return 'RBT';
  return name;
}

function getSubjectColorStyle(subjectCode: string, isNilam?: boolean, isKoku?: boolean) {
  if (isKoku || subjectCode === 'KOKU') {
    return { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' };
  }
  if (isNilam) {
    return { bg: '#d1fae5', color: '#065f46', border: '#a7f3d0' };
  }
  switch (subjectCode) {
    case 'BM':
      return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
    case 'BI':
      return { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' };
    case 'MAT':
      return { bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
    case 'SN':
      return { bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' };
    case 'PI':
      return { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' };
    case 'PM':
      return { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' };
    case 'PJK':
      return { bg: '#fff1f2', color: '#be123c', border: '#fecdd3' };
    case 'PSV':
      return { bg: '#fdf4ff', color: '#86198f', border: '#f5d0fe' };
    case 'MZ':
      return { bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' };
    case 'RBT':
      return { bg: '#f8fafc', color: '#334155', border: '#cbd5e1' };
    case 'SEJ':
      return { bg: '#fff7ed', color: '#9a3412', border: '#ffedd5' };
    case 'PERH':
      return { bg: '#f8fafc', color: '#475569', border: '#cbd5e1' };
    default:
      return { bg: '#f8fafc', color: '#334155', border: '#cbd5e1' };
  }
}

export default function Step6MasterGrid({
  entries: initialEntries,
  gridConfig,
  stateGroup,
  classes,
  teachers,
  rooms,
  onBack,
  ...restProps
}: Props) {
  const [entries, setEntries] = useState<TimetableEntry[]>(initialEntries || []);

  useEffect(() => {
    if (initialEntries && Array.isArray(initialEntries) && initialEntries.length > 0) {
      setEntries(initialEntries);
    }
  }, [initialEntries]);

  useEffect(() => {
    if (restProps.timetableEntries && Array.isArray(restProps.timetableEntries)) {
      setEntries(restProps.timetableEntries);
    }
  }, [restProps.timetableEntries]);

  const [activeVersion, setActiveVersion] = useState<'MASTER_ALL' | 'CLASS' | 'TEACHER'>('CLASS');
  
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || '');
  const [masterDayFilter, setMasterDayFilter] = useState<number>(1);

  const [scheduleMode, setScheduleMode] = useState<'MASTER' | 'FLEXIBLE' | 'PDPR'>('MASTER');
  
  const effectiveGridConfig = useMemo(() => {
    return gridConfig || restProps.timeGridConfig || restProps.grid || ({} as TimeGridConfigState);
  }, [gridConfig, restProps.timeGridConfig, restProps.grid]);

  const [isFlexibleModalOpen, setIsFlexibleModalOpen] = useState(false);
  const [flexibleConfig, setFlexibleConfig] = useState<FlexibleScheduleConfig>({
    enabled: true,
    name: 'Jadual Waktu Anjal Bulan Ramadan',
    type: 'RAMADAN',
    slotDurationMinutes: 20,
    startTime: effectiveGridConfig.morningStartTime || '07:30',
    maxSlotsPerDay: effectiveGridConfig.totalDailySlots || 10,
    recessDurationMinutes: 15,
    labelBadge: 'Bulan Ramadan (20m / Waktu)',
    effectiveNote: 'Berkuatkuasa Sepanjang Bulan Ramadan',
  });

  const [isPdprModalOpen, setIsPdprModalOpen] = useState(false);
  const [pdprConfig, setPdprConfig] = useState<PdprBlockConfig>({
    enabled: true,
    name: 'Jadual Waktu Pengajaran dan Pembelajaran di Rumah (PdPR)',
    startTime: '08:30',
    blockDurationMinutes: 60,
    recessMinutes: 20,
    totalBlocks: 3,
    labelBadge: 'Sesi PdPR KPM (Online & Modul)',
  });

  const [pdprModeMap, setPdprModeMap] = useState<Record<string, 'ONLINE' | 'MODUL'>>({});

  const [activeModalEntry, setActiveModalEntry] = useState<{
    entry: TimetableEntry;
    day: number;
    slot: number;
  } | null>(null);

  const [addingSlotLocation, setAddingSlotLocation] = useState<{ day: number; slot: number } | null>(null);
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newTeacherId, setNewTeacherId] = useState('');
  const [newRoomId, setNewRoomId] = useState('');
  const [newIsNilam, setNewIsNilam] = useState(false);

  const [swapSourceSlot, setSwapSourceSlot] = useState<{
    day: number;
    slot: number;
    classId?: string;
    teacherId?: string;
    subjectId?: string;
  } | null>(null);

  const [swapToast, setSwapToast] = useState<string | null>(null);

  const [shareModalConfig, setShareModalConfig] = useState<{
    isOpen: boolean;
    type: 'CLASS' | 'TEACHER';
    title: string;
    recipientName: string;
    phoneNumber: string;
    emailAddress: string;
    messageText: string;
  }>({
    isOpen: false,
    type: 'CLASS',
    title: '',
    recipientName: '',
    phoneNumber: '',
    emailAddress: '',
    messageText: '',
  });

  const [copiedToast, setCopiedToast] = useState(false);

  // Fungsi Butang Kembali ke Langkah 5 yang Kalis-Ralat
  const handleGoBackToStep5 = () => {
    if (typeof onBack === 'function') {
      onBack();
    } else if (typeof restProps.onBack === 'function') {
      restProps.onBack();
    } else if (typeof restProps.setCurrentStep === 'function') {
      restProps.setCurrentStep(5);
    } else if (typeof restProps.setStep === 'function') {
      restProps.setStep(5);
    } else if (typeof restProps.onPrev === 'function') {
      restProps.onPrev();
    } else if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  const isGroupA = stateGroup === 'GROUP_A' || effectiveGridConfig.stateGroup === 'GROUP_A';
  const daysOfWeek = isGroupA
    ? ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis']
    : ['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat'];

  const isFlexibleActive = scheduleMode === 'FLEXIBLE';
  const isPdprActive = scheduleMode === 'PDPR';

  const currentSlotDuration = isPdprActive 
    ? pdprConfig.blockDurationMinutes
    : (isFlexibleActive ? flexibleConfig.slotDurationMinutes : (effectiveGridConfig.slotDurationMinutes || 30));

  const maxSlotInEntries = useMemo(() => {
    let maxS = 10;
    entries.forEach(e => {
      const parts = e.timeSlotId?.split('_s');
      if (parts && parts[1]) {
        const s = parseInt(parts[1], 10);
        if (!isNaN(s) && s > maxS) maxS = s;
      }
    });
    return maxS;
  }, [entries]);

  const configuredSlots = Number(effectiveGridConfig.totalDailySlots) || 10;
  const totalSlots = isFlexibleActive && flexibleConfig.maxSlotsPerDay
    ? Math.min(flexibleConfig.maxSlotsPerDay, Math.max(configuredSlots, maxSlotInEntries))
    : Math.max(configuredSlots, maxSlotInEntries);

  const standardTimeSlots = Array.from({ length: totalSlots }, (_, i) => ({
    slotIndex: i + 1,
    timeLabel: formatCalculatedTime(
      isFlexibleActive ? flexibleConfig.startTime : (effectiveGridConfig.morningStartTime || '07:30'), 
      i + 1, 
      currentSlotDuration
    ),
  }));

  const pdprColumns = useMemo(() => {
    if (!isPdprActive) return [];
    const cols: Array<{ type: 'BLOCK' | 'RECESS'; blockIndex?: number; label: string; timeLabel: string }> = [];
    const [h, m] = pdprConfig.startTime.split(':').map(Number);
    let currentMins = h * 60 + m;

    const toStr = (mins: number) => {
      const hh = Math.floor(mins / 60);
      const mm = mins % 60;
      return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    };

    for (let b = 1; b <= pdprConfig.totalBlocks; b++) {
      const startB = currentMins;
      const endB = startB + pdprConfig.blockDurationMinutes;
      cols.push({
        type: 'BLOCK',
        blockIndex: b,
        label: `Blok ${b}`,
        timeLabel: `${toStr(startB)} - ${toStr(endB)}`,
      });
      currentMins = endB;

      if (b < pdprConfig.totalBlocks) {
        const startR = currentMins;
        const endR = startR + pdprConfig.recessMinutes;
        cols.push({
          type: 'RECESS',
          label: 'Rehat',
          timeLabel: `${toStr(startR)} - ${toStr(endR)}`,
        });
        currentMins = endR;
      }
    }
    return cols;
  }, [isPdprActive, pdprConfig]);

  const selectedTeacherObj = useMemo(() => {
    return teachers.find(t => t.id === selectedTeacherId || t.code === selectedTeacherId) || teachers[0];
  }, [teachers, selectedTeacherId]);

  const isMatchingTeacher = (tid?: string) => {
    if (!tid || !selectedTeacherObj) return false;
    return tid === selectedTeacherObj.id || tid === selectedTeacherObj.code;
  };

  const getNamaKelasForTeacher = (teacherId: string) => {
    const tObj = teachers.find(t => t.id === teacherId || t.code === teacherId);
    const assignedHomeroom = classes.find(c => {
      const bmDemand = c.demands?.find(d => d.code === 'BM');
      return bmDemand && (bmDemand.assignedTeacherId === tObj?.id || bmDemand.assignedTeacherId === tObj?.code);
    });
    if (assignedHomeroom) return assignedHomeroom.name;

    const taughtClasses = Array.from(new Set(
      entries.filter(e => (e.teacherId === tObj?.id || e.teacherId === tObj?.code) && e.classId !== 'ALL_CLASSES')
             .map(e => classes.find(c => c.id === e.classId)?.name)
             .filter(Boolean)
    ));

    return taughtClasses.length > 0 ? taughtClasses.join(', ') : 'Guru Mata Pelajaran';
  };

  const getGuruKelasForClass = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return '-';
    const bmDemand = cls.demands?.find(d => d.code === 'BM');
    const t = teachers.find(tc => tc.id === bmDemand?.assignedTeacherId || tc.code === bmDemand?.assignedTeacherId);
    return t ? `${t.fullName} (${t.code})` : 'Cikgu Penyelaras Kelas';
  };

  const getSpanTimeRange = (startSlot: number, span: number) => {
    const [h, m] = (isFlexibleActive ? flexibleConfig.startTime : (effectiveGridConfig.morningStartTime || '07:30')).split(':').map(Number);
    const startMins = h * 60 + m + (startSlot - 1) * currentSlotDuration;
    const endMins = startMins + span * currentSlotDuration;

    const toStr = (mins: number) => {
      const hh = Math.floor(mins / 60);
      const mm = mins % 60;
      return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    };

    return `${toStr(startMins)} - ${toStr(endMins)}`;
  };

  // 1. PETA KUOTA SEBENAR DARI LANGKAH 4 & 5 (TERMASUK KONGSI PENGAJARAN / PECAH GURU)
  const globalTeacherAssignedMap = useMemo(() => {
    const map = new Map<string, { totalAssigned: number; subjectBreakdown: Map<string, { count: number; classes: Set<string> }> }>();

    teachers.forEach(t => {
      map.set(t.id, { totalAssigned: 0, subjectBreakdown: new Map() });
      map.set(t.code, { totalAssigned: 0, subjectBreakdown: new Map() });
    });

    classes.forEach(c => {
      c.demands?.forEach(d => {
        if (d.code === 'PERH') return;

        if (d.teacherAllocations && d.teacherAllocations.length > 1) {
          d.teacherAllocations.forEach(alloc => {
            if (alloc.teacherId && alloc.slots) {
              const rec = map.get(alloc.teacherId);
              if (rec) {
                rec.totalAssigned += Number(alloc.slots) || 0;
                if (!rec.subjectBreakdown.has(d.code)) {
                  rec.subjectBreakdown.set(d.code, { count: 0, classes: new Set() });
                }
                const subRec = rec.subjectBreakdown.get(d.code)!;
                subRec.count += Number(alloc.slots) || 0;
                subRec.classes.add(c.name);
              }
            }
          });
        } else if (d.assignedTeacherId) {
          const rec = map.get(d.assignedTeacherId);
          if (rec) {
            rec.totalAssigned += Number(d.weeklySlots) || 0;
            if (!rec.subjectBreakdown.has(d.code)) {
              rec.subjectBreakdown.set(d.code, { count: 0, classes: new Set() });
            }
            const subRec = rec.subjectBreakdown.get(d.code)!;
            subRec.count += Number(d.weeklySlots) || 0;
            subRec.classes.add(c.name);
          }
        }
      });
    });

    return map;
  }, [classes, teachers]);

  // 2. RUMUSAN BEBAN GURU DENGAN KOLOM PERBANDINGAN SEBENAR (L5) VS SEMASA (L6)
  const selectedTeacherSubjectBreakdown = useMemo(() => {
    if (!selectedTeacherObj) return null;

    const teacherEntries = entries.filter(e => 
      isMatchingTeacher(e.teacherId) || (e.isCocurricular && e.teacherId === 'ALL_TEACHERS')
    );

    const teacherTargetRec = globalTeacherAssignedMap.get(selectedTeacherObj.id) || globalTeacherAssignedMap.get(selectedTeacherObj.code);
    const assignedAcademicTotal = teacherTargetRec?.totalAssigned || 0;

    const breakdownMap = new Map<string, { 
      code: string; 
      name: string; 
      scheduledSlots: Set<string>; 
      assignedQuota: number;
      classesList: Set<string>;
    }>();

    // Masukkan kuota yang ditugaskan di Langkah 5 terlebih dahulu
    if (teacherTargetRec) {
      teacherTargetRec.subjectBreakdown.forEach((val, code) => {
        let name = code;
        for (const c of classes) {
          const d = c.demands?.find(dm => dm.code === code);
          if (d) { name = d.name; break; }
        }
        breakdownMap.set(code, {
          code,
          name,
          scheduledSlots: new Set<string>(),
          assignedQuota: val.count,
          classesList: new Set(val.classes),
        });
      });
    }

    // Isikan slot yang berhasil dijadwalkan di Langkah 6
    teacherEntries.forEach(entry => {
      const code = entry.subjectId;
      if (!breakdownMap.has(code)) {
        let name = code;
        for (const c of classes) {
          const d = c.demands?.find(dm => dm.code === code);
          if (d) { name = d.name; break; }
        }
        if (code === 'KOKU') name = 'Kokurikulum Mingguan';
        if (code === 'PERH') name = 'Perhimpunan Rasmi';

        breakdownMap.set(code, { 
          code, 
          name, 
          scheduledSlots: new Set<string>(), 
          assignedQuota: code === 'KOKU' ? 2 : 0,
          classesList: new Set<string>() 
        });
      }

      const item = breakdownMap.get(code)!;
      item.scheduledSlots.add(entry.timeSlotId);

      const clsObj = classes.find(c => c.id === entry.classId);
      if (clsObj) item.classesList.add(clsObj.name);
      else if (entry.classId === 'ALL_CLASSES') item.classesList.add('Semua Kelas');
    });

    const list = Array.from(breakdownMap.values())
      .map(item => ({
        code: item.code,
        name: item.name,
        assignedCount: item.assignedQuota,
        scheduledCount: item.scheduledSlots.size,
        classesList: item.classesList
      }))
      .sort((a, b) => b.scheduledCount - a.scheduledCount);

    const totalScheduled = list.reduce((sum, item) => sum + item.scheduledCount, 0);
    const totalHours = (totalScheduled * currentSlotDuration) / 60;
    const maxLimit = selectedTeacherObj.maxWeeklySlots ?? 26;

    const hasKoku = teacherEntries.some(e => e.isCocurricular || e.subjectId === 'KOKU');
    const grandAssignedTotal = assignedAcademicTotal + (hasKoku ? 2 : 0);

    const isOverload = grandAssignedTotal > maxLimit || totalScheduled > maxLimit;

    return { 
      list, 
      grandAssignedTotal,
      totalScheduled, 
      totalHours, 
      maxLimit, 
      isOverload 
    };
  }, [selectedTeacherObj, entries, classes, currentSlotDuration, globalTeacherAssignedMap]);

  // 3. FUNGSI SEMAKAN RENTAS 3-DIMENSI: GURU, KELAS & BILIK FIZIKAL (TRIPLE-LOCK GUARD)
  const checkTripleLockConflict = (
    movingEntries: TimetableEntry[],
    targetDay: number,
    targetSlot: number,
    swappingTargetEntries: TimetableEntry[] = []
  ): { hasConflict: boolean; message?: string } => {
    const targetTimeSlotId = `d${targetDay}_s${targetSlot}`;
    const swappingTargetIds = new Set(swappingTargetEntries.map(e => e.id));
    const movingIds = new Set(movingEntries.map(e => e.id));

    // Dapatkan semua entri di seluruh sekolah pada masa sasaran (selain entri yang terlibat dalam pertukaran)
    const existingAtTarget = entries.filter(
      e => e.timeSlotId === targetTimeSlotId && !swappingTargetIds.has(e.id) && !movingIds.has(e.id)
    );

    for (const source of movingEntries) {
      // A. Semakan Konflik Kelas (Kohort Murid)
      const classClash = existingAtTarget.find(e => e.classId === source.classId);
      if (classClash) {
        // Pengecualian sah hanya untuk subjek selari yang dipadankan dengan kunci selari rasmi
        const isLegitParallel = source.isParallel && classClash.isParallel && 
          source.parallelSyncKey && classClash.parallelSyncKey && 
          source.parallelSyncKey === classClash.parallelSyncKey;

        if (!isLegitParallel) {
          const cls = classes.find(c => c.id === source.classId);
          const tObj = teachers.find(t => t.id === classClash.teacherId || t.code === classClash.teacherId);
          return {
            hasConflict: true,
            message: `⛔ PERTINDIHAN KELAS DIKESAN:\nKelas ${cls?.name || 'ini'} sudah mempunyai subjek ${classClash.subjectId} (${tObj?.fullName || classClash.teacherId}) pada Hari ${daysOfWeek[targetDay - 1]}, Waktu ${targetSlot}!`
          };
        }
      }

      // B. Semakan Konflik Bilik Fizikal (Bilik Darjah Asas atau Bilik Khas)
      const sourceEffectiveRoomId = source.roomId || classes.find(c => c.id === source.classId)?.homeroomId;
      if (sourceEffectiveRoomId) {
        const roomClash = existingAtTarget.find(e => {
          const otherRoomId = e.roomId || classes.find(c => c.id === e.classId)?.homeroomId;
          return otherRoomId === sourceEffectiveRoomId;
        });

        if (roomClash) {
          const rm = rooms.find(r => r.id === sourceEffectiveRoomId);
          const confCls = classes.find(c => c.id === roomClash.classId);
          const confTeacher = teachers.find(t => t.id === roomClash.teacherId || t.code === roomClash.teacherId);
          return {
            hasConflict: true,
            message: `⛔ PERTINDIHAN BILIK FIZIKAL:\nBilik ${rm?.name || 'ini'} sedang digunakan oleh ${confCls?.name || 'Kelas Lain'} bagi subjek ${roomClash.subjectId} (${confTeacher?.fullName || roomClash.teacherId}) pada Hari ${daysOfWeek[targetDay - 1]}, Waktu ${targetSlot}!`
          };
        }
      }

      // C. Semakan Konflik Guru Mengajar
      if (source.teacherId && source.teacherId !== 'ALL_TEACHERS') {
        const teacherClash = existingAtTarget.find(e => {
          if (e.teacherId === 'ALL_TEACHERS') return false;
          return e.teacherId === source.teacherId || 
                 (selectedTeacherObj && (e.teacherId === selectedTeacherObj.id || e.teacherId === selectedTeacherObj.code));
        });

        if (teacherClash) {
          const confCls = classes.find(c => c.id === teacherClash.classId);
          const tObj = teachers.find(t => t.id === source.teacherId || t.code === source.teacherId);
          return {
            hasConflict: true,
            message: `⛔ PERTINDIHAN GURU:\nGuru ${tObj?.fullName || source.teacherId} sudah mempunyai jadual mengajar subjek ${teacherClash.subjectId} di kelas ${confCls?.name || ''} pada Hari ${daysOfWeek[targetDay - 1]}, Waktu ${targetSlot}!`
          };
        }
      }
    }

    return { hasConflict: false };
  };

  const selectedClassSubjectBreakdown = useMemo(() => {
    if (!selectedClassId) return null;
    const cls = classes.find(c => c.id === selectedClassId);
    if (!cls) return null;

    const classEntries = entries.filter(e => e.classId === selectedClassId);
    const breakdownMap = new Map<string, { code: string; name: string; teacherNames: Set<string>; count: number }>();
    const kokuCfg = effectiveGridConfig?.cocurricularConfig;

    classEntries.forEach(entry => {
      let code = entry.subjectId;
      
      if (kokuCfg?.enabled) {
        const parts = entry.timeSlotId.split('_s');
        const day = Number(parts[0]?.replace('d', ''));
        const slot = Number(parts[1]);
        if (day === Number(kokuCfg.day || 3) && slot >= Number(kokuCfg.startSlot || 8) && slot < (Number(kokuCfg.startSlot || 8) + Number(kokuCfg.slotCount || 2))) {
          code = 'KOKU';
        }
      }

      if (!breakdownMap.has(code)) {
        const d = cls.demands?.find(dm => dm.code === code);
        let name = d?.name || code;
        if (code === 'KOKU') name = 'Kokurikulum Mingguan';
        if (code === 'PERH') name = 'Perhimpunan Rasmi';
        breakdownMap.set(code, { code, name, teacherNames: new Set<string>(), count: 0 });
      }
      const item = breakdownMap.get(code)!;
      item.count += 1;
      const t = teachers.find(tc => tc.id === entry.teacherId || tc.code === entry.teacherId);
      if (code === 'KOKU' || entry.teacherId === 'ALL_TEACHERS') {
        item.teacherNames.add('Semua Guru');
      } else if (t) {
        item.teacherNames.add(`${t.fullName} (${t.code})`);
      }
    });

    if (kokuCfg?.enabled && !breakdownMap.has('KOKU')) {
      breakdownMap.set('KOKU', {
        code: 'KOKU',
        name: 'Kokurikulum Mingguan',
        teacherNames: new Set(['Semua Guru']),
        count: Number(kokuCfg.slotCount || 2),
      });
    }

    const list = Array.from(breakdownMap.values()).sort((a, b) => b.count - a.count);
    const totalSlotsCalc = list.reduce((sum, item) => sum + item.count, 0);
    const totalHours = (totalSlotsCalc * currentSlotDuration) / 60;

    return { list, totalSlots: totalSlotsCalc, totalHours, className: cls.name };
  }, [selectedClassId, classes, entries, teachers, currentSlotDuration, effectiveGridConfig]);

  const generateScheduleText = (type: 'CLASS' | 'TEACHER', targetId: string) => {
    let text = '';
    const statusNote = isPdprActive 
      ? `Jadual PdPR (${pdprConfig.blockDurationMinutes}m / Blok)` 
      : (isFlexibleActive ? `Jadual Anjal (${flexibleConfig.slotDurationMinutes}m)` : 'Jadual Biasa');

    const kokuCfg = effectiveGridConfig?.cocurricularConfig;

    if (type === 'TEACHER') {
      const teacher = teachers.find(t => t.id === targetId || t.code === targetId);
      text += `*JADUAL WAKTU PERSENDIRIAN GURU*\n`;
      text += `Nama Guru: *${teacher?.fullName} (${teacher?.code})*\n`;
      text += `Nama Kelas: *${getNamaKelasForTeacher(targetId)}*\n`;
      text += `Status: ${statusNote}\n`;
      text += `Sesi: 2026 / 2027\n`;
      text += `------------------------------------\n\n`;

      daysOfWeek.forEach((dayName, dIdx) => {
        const dayNum = dIdx + 1;
        text += `📅 *${dayName.toUpperCase()}*\n`;

        if (isPdprActive) {
          pdprColumns.forEach((col) => {
            if (col.type === 'RECESS') {
              text += `  • ${col.timeLabel}: 🥪 *Rehat*\n`;
            } else {
              const slotIdx = col.blockIndex || 1;
              const mappedSlotId = `d${dayNum}_s${slotIdx * 2 - 1}`;
              const en = entries.find(e => (isMatchingTeacher(e.teacherId) || (e.isCocurricular && e.teacherId === 'ALL_TEACHERS')) && e.timeSlotId === mappedSlotId);
              if (en) {
                const cls = classes.find(c => c.id === en.classId);
                const modeTag = pdprModeMap[en.id] === 'MODUL' ? '[Modul]' : '[Online]';
                text += `  • ${col.label} (${col.timeLabel}): *${en.subjectId} ${modeTag}* - ${cls?.name || 'Semua Kelas'}\n`;
              } else {
                text += `  • ${col.label} (${col.timeLabel}): Bimbingan Kendiri / Persediaan Modul\n`;
              }
            }
          });
        } else {
          const dayEntries = entries.filter(e => 
            (isMatchingTeacher(e.teacherId) || (e.isCocurricular && e.teacherId === 'ALL_TEACHERS')) &&
            e.timeSlotId.startsWith(`d${dayNum}_`)
          );

          if (dayEntries.length === 0) {
            text += `  • Tiada kelas PdP\n`;
          } else {
            dayEntries.sort((a, b) => Number(a.timeSlotId.split('_s')[1]) - Number(b.timeSlotId.split('_s')[1]));
            dayEntries.forEach(en => {
              const slotNum = Number(en.timeSlotId.split('_s')[1]);
              const cls = classes.find(c => c.id === en.classId);
              const timeStr = formatCalculatedTime(effectiveGridConfig.morningStartTime || '07:30', slotNum, currentSlotDuration);
              
              const isKokuSlot = Boolean(
                kokuCfg?.enabled &&
                dayNum === Number(kokuCfg.day || 3) &&
                slotNum >= Number(kokuCfg.startSlot || 8) &&
                slotNum < (Number(kokuCfg.startSlot || 8) + Number(kokuCfg.slotCount || 2))
              );

              if (isKokuSlot || en.isCocurricular || en.subjectId === 'KOKU') {
                text += `  • W${slotNum} (${timeStr}): *⚽ KOKU* - Pengawasan Kokurikulum\n`;
              } else {
                text += `  • W${slotNum} (${timeStr}): *${en.subjectId}* - ${cls?.name || 'Kelas'}\n`;
              }
            });
          }
        }
        text += `\n`;
      });
    } else {
      const cls = classes.find(c => c.id === targetId);
      text += `*JADUAL WAKTU KELAS: ${cls?.name.toUpperCase()}*\n`;
      text += `Guru Kelas: *${getGuruKelasForClass(targetId)}*\n`;
      text += `Status: ${statusNote}\n`;
      text += `Sesi: 2026 / 2027\n`;
      text += `------------------------------------\n\n`;

      daysOfWeek.forEach((dayName, dIdx) => {
        const dayNum = dIdx + 1;
        text += `📅 *${dayName.toUpperCase()}*\n`;

        if (isPdprActive) {
          pdprColumns.forEach((col) => {
            if (col.type === 'RECESS') {
              text += `  • ${col.timeLabel}: 🥪 *Rehat*\n`;
            } else {
              const slotIdx = col.blockIndex || 1;
              const mappedSlotId = `d${dayNum}_s${slotIdx * 2 - 1}`;
              const en = entries.find(e => e.classId === targetId && e.timeSlotId === mappedSlotId);
              if (en) {
                const t = teachers.find(tc => tc.id === en.teacherId || tc.code === en.teacherId);
                const modeTag = pdprModeMap[en.id] === 'MODUL' ? '[Modul]' : '[Online]';
                text += `  • ${col.label} (${col.timeLabel}): *${en.subjectId} ${modeTag}* - ${t?.fullName || 'Guru'}\n`;
              } else {
                text += `  • ${col.label} (${col.timeLabel}): Pembelajaran Kendiri\n`;
              }
            }
          });
        } else {
          const dayEntries = entries.filter(e => e.classId === targetId && e.timeSlotId.startsWith(`d${dayNum}_`));
          if (dayEntries.length === 0) {
            text += `  • Tiada sesi PdP\n`;
          } else {
            dayEntries.sort((a, b) => Number(a.timeSlotId.split('_s')[1]) - Number(b.timeSlotId.split('_s')[1]));
            dayEntries.forEach(en => {
              const slotNum = Number(en.timeSlotId.split('_s')[1]);
              const t = teachers.find(tc => tc.id === en.teacherId || tc.code === en.teacherId);
              const timeStr = formatCalculatedTime(effectiveGridConfig.morningStartTime || '07:30', slotNum, currentSlotDuration);

              const isKokuSlot = Boolean(
                kokuCfg?.enabled &&
                dayNum === Number(kokuCfg.day || 3) &&
                slotNum >= Number(kokuCfg.startSlot || 8) &&
                slotNum < (Number(kokuCfg.startSlot || 8) + Number(kokuCfg.slotCount || 2))
              );

              if (isKokuSlot || en.isCocurricular || en.subjectId === 'KOKU') {
                text += `  • W${slotNum} (${timeStr}): *⚽ KOKU* - Aktiviti Kokurikulum Mingguan\n`;
              } else {
                text += `  • W${slotNum} (${timeStr}): *${en.subjectId}* - ${t?.fullName || 'Guru'}\n`;
              }
            });
          }
        }
        text += `\n`;
      });
    }

    text += `_Dijana secara rasmi oleh Sistem Pengurusan Jadual Waktu Sekolah._`;
    return text;
  };

  const handleOpenShareModal = (type: 'CLASS' | 'TEACHER') => {
    const targetId = type === 'CLASS' ? selectedClassId : selectedTeacherId;
    const msg = generateScheduleText(type, targetId);

    if (type === 'TEACHER') {
      const t = teachers.find(tc => tc.id === targetId || tc.code === targetId);
      setShareModalConfig({
        isOpen: true,
        type: 'TEACHER',
        title: `Kongsi Jadual Guru: ${t?.fullName}`,
        recipientName: t?.fullName || '',
        phoneNumber: '',
        emailAddress: '',
        messageText: msg,
      });
    } else {
      const c = classes.find(cl => cl.id === targetId);
      setShareModalConfig({
        isOpen: true,
        type: 'CLASS',
        title: `Kongsi Jadual Kelas: ${c?.name}`,
        recipientName: `Guru Kelas ${c?.name}`,
        phoneNumber: '',
        emailAddress: '',
        messageText: msg,
      });
    }
  };

  const handleSendWhatsApp = () => {
    let cleanPhone = shareModalConfig.phoneNumber.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '60' + cleanPhone.slice(1);
    const url = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(shareModalConfig.messageText)}`
      : `https://wa.me/?text=${encodeURIComponent(shareModalConfig.messageText)}`;
    window.open(url, '_blank');
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(shareModalConfig.title);
    const body = encodeURIComponent(shareModalConfig.messageText);
    const mailto = `mailto:${shareModalConfig.emailAddress}?subject=${subject}&body=${body}`;
    window.open(mailto, '_blank');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(shareModalConfig.messageText);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  const handleCellClick = (dayIndex: number, slotIndex: number, entry?: TimetableEntry, customClassId?: string) => {
    if (swapSourceSlot) {
      const sourceKey = `d${swapSourceSlot.day}_s${swapSourceSlot.slot}`;
      const targetKey = `d${dayIndex}_s${slotIndex}`;

      if (sourceKey === targetKey) {
        setSwapSourceSlot(null);
        return;
      }

      const r1 = effectiveGridConfig.recessGroup1Slot || 5;
      const r2 = effectiveGridConfig.recessGroup2Slot || 6;
      if (slotIndex === r1 || (effectiveGridConfig.recessMode === 'STAGGERED' && slotIndex === r2)) {
        alert('Slot Rehat adalah waktu tetap dan tidak boleh ditukar ganti.');
        return;
      }
      if (dayIndex === 5 && slotIndex === 10) {
        alert('Slot Bersurai pada hari Jumaat tidak boleh ditukar ganti.');
        return;
      }

      const kokuCfg = effectiveGridConfig?.cocurricularConfig;
      if (kokuCfg?.enabled && dayIndex === Number(kokuCfg.day || 3) && slotIndex >= Number(kokuCfg.startSlot || 8) && slotIndex < (Number(kokuCfg.startSlot || 8) + Number(kokuCfg.slotCount || 2))) {
        alert('Slot Kokurikulum adalah waktu terkunci dan tidak boleh ditukar ganti.');
        return;
      }

      // Kenal pasti entri yang ingin dipindahkan dari slot sumber
      let sourceEntriesToMove: TimetableEntry[] = [];
      if (activeVersion === 'CLASS') {
        sourceEntriesToMove = entries.filter(e => e.classId === selectedClassId && e.timeSlotId === sourceKey);
      } else if (activeVersion === 'TEACHER') {
        sourceEntriesToMove = entries.filter(e => isMatchingTeacher(e.teacherId) && e.timeSlotId === sourceKey);
      } else {
        const targetClass = customClassId || swapSourceSlot.classId || (classes[0]?.id || 'c1');
        sourceEntriesToMove = entries.filter(e => e.classId === targetClass && e.timeSlotId === sourceKey);
      }

      // Kenal pasti entri sasaran yang akan ditukar balik ke slot sumber (jika ada)
      let targetEntriesToSwap: TimetableEntry[] = [];
      if (activeVersion === 'CLASS') {
        targetEntriesToSwap = entries.filter(e => e.classId === selectedClassId && e.timeSlotId === targetKey);
      } else if (activeVersion === 'TEACHER') {
        targetEntriesToSwap = entries.filter(e => isMatchingTeacher(e.teacherId) && e.timeSlotId === targetKey);
      } else {
        const targetClass = customClassId || swapSourceSlot.classId || (classes[0]?.id || 'c1');
        targetEntriesToSwap = entries.filter(e => e.classId === targetClass && e.timeSlotId === targetKey);
      }

      // 4. JALANKAN SEMAKAN KESELAMATAN 3-DIMENSI (TRIPLE-LOCK GUARD)
      const targetConflict = checkTripleLockConflict(sourceEntriesToMove, dayIndex, slotIndex, targetEntriesToSwap);
      if (targetConflict.hasConflict) {
        alert(targetConflict.message);
        return;
      }

      if (targetEntriesToSwap.length > 0) {
        const sourceConflict = checkTripleLockConflict(targetEntriesToSwap, swapSourceSlot.day, swapSourceSlot.slot, sourceEntriesToMove);
        if (sourceConflict.hasConflict) {
          alert(sourceConflict.message);
          return;
        }
      }

      let updated: TimetableEntry[] = [];

      if (activeVersion === 'CLASS') {
        const targetClass = selectedClassId;
        updated = entries.map(item => {
          if (item.classId === targetClass) {
            if (item.timeSlotId === sourceKey) return { ...item, timeSlotId: targetKey };
            if (item.timeSlotId === targetKey) return { ...item, timeSlotId: sourceKey };
          }
          return item;
        });
      } else if (activeVersion === 'TEACHER') {
        updated = entries.map(item => {
          if (isMatchingTeacher(item.teacherId)) {
            if (item.timeSlotId === sourceKey) return { ...item, timeSlotId: targetKey };
            if (item.timeSlotId === targetKey) return { ...item, timeSlotId: sourceKey };
          }
          return item;
        });
      } else if (activeVersion === 'MASTER_ALL') {
        const targetClass = customClassId || swapSourceSlot.classId || (classes[0]?.id || 'c1');
        updated = entries.map(item => {
          if (item.classId === targetClass) {
            if (item.timeSlotId === sourceKey) return { ...item, timeSlotId: targetKey };
            if (item.timeSlotId === targetKey) return { ...item, timeSlotId: sourceKey };
          }
          return item;
        });
      }

      setEntries(updated);
      setSwapSourceSlot(null);

      setSwapToast('✓ Berjaya menukar ganti slot jadual waktu tanpa sebarang pertindihan bilik atau guru!');
      setTimeout(() => setSwapToast(null), 3000);

      if (typeof restProps.setEntries === 'function') restProps.setEntries(updated);
      if (typeof restProps.setTimetableEntries === 'function') restProps.setTimetableEntries(updated);
      if (typeof restProps.onUpdate === 'function') restProps.onUpdate(updated);
      return;
    }

    if (entry) {
      setActiveModalEntry({ entry, day: dayIndex, slot: slotIndex });
    } else {
      setAddingSlotLocation({ day: dayIndex, slot: slotIndex });
    }
  };

  const handleSaveModalEntry = (updated: Partial<TimetableEntry>) => {
    if (!activeModalEntry) return;

    // Semak sekiranya guru baharu bertindih pada slot waktu yang sama di kelas lain
    if (updated.teacherId && updated.teacherId !== activeModalEntry.entry.teacherId && updated.teacherId !== 'ALL_TEACHERS') {
      const clash = entries.find(e => 
        e.timeSlotId === activeModalEntry.entry.timeSlotId && 
        e.id !== activeModalEntry.entry.id && 
        (e.teacherId === updated.teacherId)
      );
      if (clash) {
        const confCls = classes.find(c => c.id === clash.classId);
        const tObj = teachers.find(t => t.id === updated.teacherId || t.code === updated.teacherId);
        alert(`⛔ PERTINDIHAN GURU:\nGuru ${tObj?.fullName || updated.teacherId} sudah mengajar subjek ${clash.subjectId} di kelas ${confCls?.name || ''} pada slot ini!`);
        return;
      }
    }

    const updatedList = entries.map(e => e.id === activeModalEntry.entry.id ? { ...e, ...updated } : e);
    setEntries(updatedList);
    setActiveModalEntry(null);
  };

  const handleDeleteCurrentModalEntry = () => {
    if (!activeModalEntry) return;
    if (confirm(`Padam subjek ${activeModalEntry.entry.subjectId} daripada slot ini?`)) {
      setEntries(entries.filter(e => e.id !== activeModalEntry.entry.id));
      setActiveModalEntry(null);
    }
  };

  const handleTriggerSwapFromModal = () => {
    if (!activeModalEntry) return;
    setSwapSourceSlot({
      day: activeModalEntry.day,
      slot: activeModalEntry.slot,
      classId: activeModalEntry.entry.classId,
      teacherId: activeModalEntry.entry.teacherId,
      subjectId: activeModalEntry.entry.subjectId,
    });
    setActiveModalEntry(null);
  };

  const handleSaveNewSlot = () => {
    if (!addingSlotLocation || !newSubjectCode || !newTeacherId) {
      alert('Sila pilih kod subjek dan guru.');
      return;
    }

    const timeSlotId = `d${addingSlotLocation.day}_s${addingSlotLocation.slot}`;
    const targetClassId = activeVersion === 'CLASS' ? selectedClassId : (classes[0]?.id || 'c1');
    const pssRoomId = rooms.find(r => r.roomType === 'LIBRARY')?.id;
    const targetRoomId = newIsNilam ? (pssRoomId || newRoomId || null) : (newRoomId || classes.find(c => c.id === targetClassId)?.homeroomId || null);

    // Semak kelayakan sebelum menyimpan slot manual baru
    const existingAtTarget = entries.filter(e => e.timeSlotId === timeSlotId);

    // 1. Semak kelas
    const classClash = existingAtTarget.find(e => e.classId === targetClassId);
    if (classClash) {
      const cls = classes.find(c => c.id === targetClassId);
      const tObj = teachers.find(t => t.id === classClash.teacherId || t.code === classClash.teacherId);
      alert(`⛔ PERTINDIHAN KELAS:\nKelas ${cls?.name || ''} sudah mempunyai subjek ${classClash.subjectId} (${tObj?.fullName || classClash.teacherId}) pada waktu ini!`);
      return;
    }

    // 2. Semak bilik fizikal
    if (targetRoomId) {
      const roomClash = existingAtTarget.find(e => {
        const eRoom = e.roomId || classes.find(c => c.id === e.classId)?.homeroomId;
        return eRoom === targetRoomId;
      });
      if (roomClash) {
        const rm = rooms.find(r => r.id === targetRoomId);
        const confCls = classes.find(c => c.id === roomClash.classId);
        alert(`⛔ PERTINDIHAN BILIK:\nBilik ${rm?.name || ''} sedang digunakan oleh ${confCls?.name || ''} (${roomClash.subjectId}) pada waktu ini!`);
        return;
      }
    }

    // 3. Semak guru
    const teacherClash = existingAtTarget.find(e => e.teacherId === newTeacherId && e.teacherId !== 'ALL_TEACHERS');
    if (teacherClash) {
      const tObj = teachers.find(t => t.id === newTeacherId || t.code === newTeacherId);
      const confCls = classes.find(c => c.id === teacherClash.classId);
      alert(`⛔ PERTINDIHAN GURU:\nGuru ${tObj?.fullName || newTeacherId} sedang mengajar kelas ${confCls?.name || ''} (${teacherClash.subjectId}) pada waktu ini!`);
      return;
    }

    const newEntry: TimetableEntry = {
      id: `manual_${Date.now()}`,
      timetableId: 'master',
      classId: targetClassId,
      timeSlotId,
      subjectId: newSubjectCode,
      teacherId: newTeacherId,
      roomId: targetRoomId,
      blockInstanceId: `manual_blk_${Date.now()}`,
      isLocked: false,
      isNilam: newIsNilam,
    };

    setEntries([...entries, newEntry]);
    setAddingSlotLocation(null);
    setNewSubjectCode('');
    setNewTeacherId('');
    setNewRoomId('');
    setNewIsNilam(false);
  };

  const handleMarkSlotAsKoku = () => {
    if (!addingSlotLocation) return;
    const timeSlotId = `d${addingSlotLocation.day}_s${addingSlotLocation.slot}`;

    const newEntry: TimetableEntry = {
      id: `manual_koku_${Date.now()}`,
      timetableId: 'master',
      classId: activeVersion === 'CLASS' ? selectedClassId : 'ALL_CLASSES',
      timeSlotId,
      subjectId: 'KOKU',
      teacherId: activeVersion === 'TEACHER' ? selectedTeacherId : 'ALL_TEACHERS',
      roomId: rooms.find(r => r.roomType === 'FIELD')?.id || null,
      blockInstanceId: `manual_koku_blk_${Date.now()}`,
      isLocked: true,
      isCocurricular: true,
    };

    setEntries([...entries, newEntry]);
    setAddingSlotLocation(null);
  };

  interface SlotCellData {
    type: 'ENTRY' | 'PARALLEL_ENTRY' | 'REHAT' | 'KOKU' | 'DISMISS' | 'EMPTY';
    entry?: TimetableEntry;
    entriesList?: TimetableEntry[];
    label?: string;
    mergeKey: string;
    canMerge: boolean;
  }

  const getSlotData = (dayIndex: number, slotIndex: number, targetClassId?: string, isPdprBlock?: boolean): SlotCellData => {
    const mappedSlot = isPdprBlock ? (slotIndex * 2 - 1) : slotIndex;
    const timeSlotId = `d${dayIndex}_s${mappedSlot}`;
    const currentClassId = targetClassId || selectedClassId;

    let activeEntries: TimetableEntry[] = [];
    if (activeVersion === 'CLASS' || targetClassId) {
      activeEntries = entries.filter(e => e.classId === currentClassId && e.timeSlotId === timeSlotId);
    } else {
      activeEntries = entries.filter(e => 
        (isMatchingTeacher(e.teacherId) || (e.isCocurricular && e.teacherId === 'ALL_TEACHERS')) && 
        e.timeSlotId === timeSlotId
      );
    }

    const kokuCfg = effectiveGridConfig?.cocurricularConfig;
    const isConfiguredKoku = Boolean(
      kokuCfg?.enabled &&
      dayIndex === Number(kokuCfg.day || 3) &&
      mappedSlot >= Number(kokuCfg.startSlot || 8) &&
      mappedSlot < (Number(kokuCfg.startSlot || 8) + Number(kokuCfg.slotCount || 2))
    );
    const hasKokuEntry = activeEntries.some(e => e.isCocurricular || e.subjectId === 'KOKU');

    if (isConfiguredKoku || hasKokuEntry) {
      const kEntry = activeEntries.find(e => e.isCocurricular || e.subjectId === 'KOKU');
      return {
        type: 'KOKU',
        label: 'KOKU',
        entry: kEntry,
        mergeKey: 'KOKU',
        canMerge: true,
      };
    }

    if (!isPdprActive) {
      const r1 = effectiveGridConfig.recessGroup1Slot || 5;
      const r2 = effectiveGridConfig.recessGroup2Slot || 6;
      const lunchSlot = Number(effectiveGridConfig.lunchPrayerSlot) || 11;

      if (activeVersion === 'CLASS' || targetClassId) {
        const cls = classes.find(c => c.id === currentClassId);
        const stage = cls?.academicStage;
        if (effectiveGridConfig.recessMode === 'STAGGERED') {
          if (stage === 'STAGE_1' && mappedSlot === r1) {
            return { type: 'REHAT', label: isFlexibleActive ? 'Rehat' : 'Rehat T1', mergeKey: 'REHAT_T1', canMerge: false };
          }
          if (stage === 'STAGE_2' && mappedSlot === r2) {
            return { type: 'REHAT', label: isFlexibleActive ? 'Rehat' : 'Rehat T2', mergeKey: 'REHAT_T2', canMerge: false };
          }
        } else if (mappedSlot === r1) {
          return { type: 'REHAT', label: 'Rehat', mergeKey: 'REHAT', canMerge: false };
        }
        if (totalSlots >= 13 && mappedSlot === lunchSlot) {
          return { type: 'REHAT', label: 'Zohor', mergeKey: 'ZOHOR', canMerge: false };
        }
        if (dayIndex === 5 && mappedSlot === 10) {
          return { type: 'DISMISS', label: 'Bersurai', mergeKey: 'DISMISS', canMerge: false };
        }
      }

      if (activeVersion === 'TEACHER' && !targetClassId && activeEntries.length === 0) {
        if (mappedSlot === r1) {
          return { type: 'REHAT', label: isFlexibleActive ? 'Rehat' : 'Rehat T1', mergeKey: 'REHAT_T1', canMerge: false };
        }
        if (effectiveGridConfig.recessMode === 'STAGGERED' && mappedSlot === r2) {
          return { type: 'REHAT', label: isFlexibleActive ? 'Rehat' : 'Rehat T2', mergeKey: 'REHAT_T2', canMerge: false };
        }
        if (totalSlots >= 13 && mappedSlot === lunchSlot) {
          return { type: 'REHAT', label: 'Zohor', mergeKey: 'ZOHOR', canMerge: false };
        }
        if (dayIndex === 5 && mappedSlot === 10) {
          return { type: 'DISMISS', label: 'Bersurai', mergeKey: 'DISMISS', canMerge: false };
        }
      }
    }

    if (activeEntries.length > 1 && (activeVersion === 'CLASS' || targetClassId)) {
      const codes = activeEntries.map(e => e.subjectId).sort().join('_');
      return {
        type: 'PARALLEL_ENTRY',
        entriesList: activeEntries,
        mergeKey: `PARALLEL_${codes}`,
        canMerge: true,
      };
    }

    if (activeEntries.length > 0) {
      const single = activeEntries[0];
      const mode = pdprModeMap[single.id] || (mappedSlot % 2 === 1 ? 'ONLINE' : 'MODUL');
      const mergeKey = `${single.subjectId}__${single.classId}__${single.teacherId}__${single.roomId || ''}__${single.isNilam ? '1' : '0'}__${isPdprActive ? mode : ''}`;
      return {
        type: 'ENTRY',
        entry: single,
        mergeKey,
        canMerge: true,
      };
    }

    return {
      type: 'EMPTY',
      mergeKey: `EMPTY_${dayIndex}_${mappedSlot}`,
      canMerge: false,
    };
  };

  const getRowCells = (dayIndex: number, targetClassId?: string) => {
    const result: Array<{
      startSlot: number;
      span: number;
      data: SlotCellData;
    }> = [];

    let s = 1;
    while (s <= totalSlots) {
      const current = getSlotData(dayIndex, s, targetClassId);
      let span = 1;

      if (current.canMerge) {
        while (s + span <= totalSlots) {
          const next = getSlotData(dayIndex, s + span, targetClassId);
          if (next.canMerge && next.mergeKey === current.mergeKey) {
            span++;
          } else {
            break;
          }
        }
      }

      result.push({
        startSlot: s,
        span,
        data: current,
      });

      s += span;
    }

    return result;
  };

  const renderMergedCell = (dayNum: number, item: { startSlot: number; span: number; data: SlotCellData }, targetClassId?: string) => {
    if (item.data.type === 'REHAT') {
      return (
        <td
          key={item.startSlot}
          colSpan={item.span}
          style={{
            backgroundColor: '#fef08a',
            borderRight: '1px solid #cbd5e1',
            borderBottom: '1px solid #cbd5e1',
            padding: '0',
            textAlign: 'center',
            verticalAlign: 'middle',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
          }}
        >
          <div style={{
            minHeight: '48px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fef08a',
            color: '#854d0e',
            padding: '4px 2px',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
          }}>
            <span style={{ fontSize: '0.62rem', lineHeight: 1 }}>{item.data.label === 'Zohor' ? '🍛' : '🥪'}</span>
            <span style={{ fontSize: '0.56rem', fontWeight: 700, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              {item.data.label}
            </span>
          </div>
        </td>
      );
    }

    if (item.data.type === 'DISMISS') {
      return (
        <td
          key={item.startSlot}
          colSpan={item.span}
          style={{
            backgroundColor: '#f8fafc',
            borderRight: '1px solid #cbd5e1',
            borderBottom: '1px solid #cbd5e1',
            padding: '2px',
            textAlign: 'center',
            verticalAlign: 'middle',
            color: '#64748b',
            fontSize: '0.66rem',
            fontWeight: 600
          }}
        >
          🕌 Bersurai
        </td>
      );
    }

    if (item.data.type === 'KOKU') {
      return (
        <td
          key={item.startSlot}
          colSpan={item.span}
          style={{
            backgroundColor: '#e0f2fe',
            borderRight: '1px solid #cbd5e1',
            borderBottom: '1px solid #cbd5e1',
            padding: '2px',
            verticalAlign: 'middle',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
            cursor: 'pointer'
          }}
          onClick={() => handleCellClick(dayNum, item.startSlot, item.data.entry, targetClassId)}
        >
          <div style={{
            backgroundColor: '#e0f2fe',
            color: '#0369a1',
            border: '1px solid #bae6fd',
            borderRadius: '8px',
            textAlign: 'center',
            padding: '6px 4px',
            minHeight: '48px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div style={{ fontWeight: 800, fontSize: '0.70rem' }}>
              ⚽ KOKU {item.span > 1 && <span style={{ fontSize: '0.55rem', fontWeight: 600, opacity: 0.85 }}>({getSpanTimeRange(item.startSlot, item.span)})</span>}
            </div>
            <div style={{ fontSize: '0.58rem', color: '#0369a1', fontWeight: 500, marginTop: '2px' }}>
              {isPdprActive ? '[Modul]' : (activeVersion === 'CLASS' ? 'Aktiviti Padang' : 'Pengawasan')}
            </div>
          </div>
        </td>
      );
    }

    if (item.data.type === 'EMPTY') {
      const isTargetForSwap = swapSourceSlot !== null;
      let isSwapConflict = false;
      let swapConflictReason = '';

      // SEMAKAN VISUAL: Jika dalam Mod Swap, periksa jika petak ini bertindih untuk subjek yang dipindahkan
      if (isTargetForSwap && swapSourceSlot) {
        let movingSub = entries.filter(e => {
          if (activeVersion === 'CLASS') return e.classId === selectedClassId && e.timeSlotId === `d${swapSourceSlot.day}_s${swapSourceSlot.slot}`;
          if (activeVersion === 'TEACHER') return isMatchingTeacher(e.teacherId) && e.timeSlotId === `d${swapSourceSlot.day}_s${swapSourceSlot.slot}`;
          return e.timeSlotId === `d${swapSourceSlot.day}_s${swapSourceSlot.slot}`;
        });

        if (movingSub.length > 0) {
          const testConf = checkTripleLockConflict(movingSub, dayNum, item.startSlot, []);
          if (testConf.hasConflict) {
            isSwapConflict = true;
            swapConflictReason = testConf.message || 'Slot ini bertindih bilik atau kelas';
          }
        }
      }

      return (
        <td
          key={item.startSlot}
          colSpan={item.span}
          style={{
            borderRight: '1px solid #cbd5e1',
            borderBottom: '1px solid #cbd5e1',
            padding: '2px',
            verticalAlign: 'middle'
          }}
        >
          <div
            className={`${styles.cellCard} ${styles.cellFree}`}
            title={isSwapConflict ? swapConflictReason : (isTargetForSwap ? 'Klik untuk pindah ke slot ini' : '')}
            style={{
              cursor: 'pointer',
              borderRadius: '8px',
              border: isTargetForSwap 
                ? (isSwapConflict ? '1.5px dashed #ef4444' : '2px dashed #16a34a') 
                : '1px dashed #e2e8f0',
              backgroundColor: isTargetForSwap 
                ? (isSwapConflict ? '#fef2f2' : '#f0fdf4') 
                : '#ffffff',
              minHeight: '48px',
              transition: 'all 0.15s ease'
            }}
            onClick={() => handleCellClick(dayNum, item.startSlot, undefined, targetClassId)}
          >
            <div className="screen-only-btn" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '3px',
              color: isTargetForSwap 
                ? (isSwapConflict ? '#dc2626' : '#15803d') 
                : '#94a3b8' 
            }}>
              {isTargetForSwap ? (
                isSwapConflict ? (
                  <>
                    <AlertTriangle size={11} color="#dc2626" />
                    <span style={{ fontWeight: 800, fontSize: '0.62rem' }}>Bertindih</span>
                  </>
                ) : (
                  <>
                    <Check size={11} color="#16a34a" />
                    <span style={{ fontWeight: 800, fontSize: '0.64rem' }}>Pindah Sini</span>
                  </>
                )
              ) : (
                <>
                  <PlusCircle size={10} style={{ display: 'inline', marginRight: '2px' }} />
                  <span style={{ fontWeight: 500, fontSize: '0.66rem' }}>Tambah</span>
                </>
              )}
            </div>
            <div className="print-only-dash" style={{ display: 'none' }}>-</div>
          </div>
        </td>
      );
    }

    if (item.data.type === 'PARALLEL_ENTRY' && item.data.entriesList) {
      const list = item.data.entriesList;
      return (
        <td
          key={item.startSlot}
          colSpan={item.span}
          style={{
            borderRight: '1px solid #cbd5e1',
            borderBottom: '1px solid #cbd5e1',
            padding: '2px',
            verticalAlign: 'middle',
            backgroundColor: '#ffffff',
          }}
        >
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '4px',
            minHeight: '48px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '3px',
            cursor: 'pointer'
          }}
          onClick={() => handleCellClick(dayNum, item.startSlot, list[0], targetClassId)}
          >
            {list.map((en, i) => {
              const tc = teachers.find(t => t.id === en.teacherId || t.code === en.teacherId);
              const rm = rooms.find(r => r.id === en.roomId);
              const cStyle = getSubjectColorStyle(en.subjectId);

              return (
                <div 
                  key={en.id || i} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: cStyle.bg,
                    border: `1px solid ${cStyle.border}`,
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.68rem', color: cStyle.color }}>
                    {en.subjectId} {item.span > 1 && <span style={{ fontSize: '0.54rem', fontWeight: 600 }}>({getSpanTimeRange(item.startSlot, item.span)})</span>}
                  </div>
                  <div style={{ fontSize: '0.60rem', color: cStyle.color }}>
                    {tc?.code || 'Guru'} {rm && `(${formatRoomShortName(rm.name)})`}
                  </div>
                </div>
              );
            })}
          </div>
        </td>
      );
    }

    const single = item.data.entry!;
    const teacher = teachers.find(t => t.id === single.teacherId || t.code === single.teacherId);
    const room = rooms.find(r => r.id === single.roomId);
    const targetClass = classes.find(c => c.id === single.classId);

    const isSelectedForSwap = swapSourceSlot?.day === dayNum && swapSourceSlot?.slot === item.startSlot && (!targetClassId || swapSourceSlot?.classId === targetClassId);
    const isNilamSlot = single.isNilam || room?.roomType === 'LIBRARY';
    const colorStyle = getSubjectColorStyle(single.subjectId, isNilamSlot, single.isCocurricular);
    const currentPdprMode = pdprModeMap[single.id] || (item.startSlot % 2 === 1 ? 'ONLINE' : 'MODUL');

    return (
      <td
        key={item.startSlot}
        colSpan={item.span}
        style={{
          borderRight: '1px solid #cbd5e1',
          borderBottom: '1px solid #cbd5e1',
          padding: '2px',
          verticalAlign: 'middle',
          backgroundColor: isSelectedForSwap ? '#dbeafe' : colorStyle.bg,
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        }}
      >
        <div
          className={styles.cellCard}
          style={{
            outline: isSelectedForSwap ? '3px solid #2563eb' : 'none',
            boxShadow: isSelectedForSwap ? '0 0 10px rgba(37,99,235,0.4)' : '0 1px 3px rgba(0,0,0,0.02)',
            backgroundColor: isSelectedForSwap ? '#dbeafe' : colorStyle.bg,
            border: `1px solid ${colorStyle.border}`,
            borderRadius: '8px',
            cursor: 'pointer',
            position: 'relative',
            padding: '5px 8px',
            minHeight: '48px',
            width: '100%',
            boxSizing: 'border-box',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
          }}
          onClick={() => handleCellClick(dayNum, item.startSlot, single, targetClassId)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className={styles.cellSubject} style={{ color: colorStyle.color, fontWeight: 800, fontSize: '0.72rem' }}>
              {single.subjectId} {isNilamSlot && <span style={{ fontSize: '0.52rem' }}>📖</span>}
              {item.span > 1 && (
                <span style={{ fontSize: '0.56rem', fontWeight: 600, opacity: 0.85, marginLeft: '5px' }}>
                  ({getSpanTimeRange(item.startSlot, item.span)})
                </span>
              )}
            </div>

            {isPdprActive ? (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setPdprModeMap({
                    ...pdprModeMap,
                    [single.id]: currentPdprMode === 'ONLINE' ? 'MODUL' : 'ONLINE'
                  });
                }}
                title="Klik untuk tukar mod [Online] atau [Modul]"
                style={{
                  fontSize: '0.52rem',
                  fontWeight: 700,
                  padding: '0px 4px',
                  borderRadius: '4px',
                  backgroundColor: currentPdprMode === 'ONLINE' ? '#dbeafe' : '#fef3c7',
                  color: currentPdprMode === 'ONLINE' ? '#1e40af' : '#b45309',
                  border: currentPdprMode === 'ONLINE' ? '1px solid #93c5fd' : '1px solid #fcd34d',
                  cursor: 'pointer'
                }}
              >
                {currentPdprMode === 'ONLINE' ? '[Online]' : '[Modul]'}
              </span>
            ) : (
              <div style={{ opacity: 0.5 }} className="screen-only-btn">
                <Edit3 size={8} color={colorStyle.color} />
              </div>
            )}
          </div>

          <div className={styles.cellTeacher} style={{ color: colorStyle.color, fontSize: '0.60rem', fontWeight: 600, marginTop: '2px' }}>
            {activeVersion === 'CLASS' ? (teacher?.code || 'Tiada Guru') : (targetClass?.name || 'Semua Kelas')}
          </div>

          {room && !isPdprActive && (
            <div className={styles.cellRoom} style={{ color: colorStyle.color, opacity: 0.8, fontSize: '0.54rem' }}>
              {formatRoomShortName(room.name)}
            </div>
          )}
        </div>
      </td>
    );
  };

  const selectedClassObj = classes.find(c => c.id === selectedClassId);

  return (
    <div style={{
      background: '#f1f5f9',
      minHeight: '100vh',
      padding: '0.85rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", "Inter", sans-serif'
    }}>
      
      {/* GAYA CETAK GLOBAL */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 landscape !important;
            margin: 3mm 5mm !important;
          }
          body, html {
            background: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
            font-family: Arial, -apple-system, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .screen-only-header,
          .screen-only-controls,
          .screen-only-btn,
          .screen-only-summary,
          #summary-table-section,
          button,
          select,
          input,
          textarea {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-only-header {
            display: block !important;
            margin-bottom: 2px !important;
            border-bottom: 1.5px solid #000000 !important;
            padding-bottom: 2px !important;
          }
          .print-only-dash {
            display: block !important;
            text-align: center !important;
            color: #94a3b8 !important;
            font-size: 0.70rem !important;
          }
          .print-only-footer {
            display: block !important;
            margin-top: 4px !important;
            page-break-inside: avoid !important;
          }
          table {
            page-break-inside: avoid !important;
            width: 100% !important;
            border-collapse: collapse !important;
          }
        }
      `}} />

      {/* KEPALA SURAT CETAKAN */}
      <div className="print-only-header" style={{ display: 'none' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            SK DATO&apos; MOHD SAID, NILAI
          </h2>
          <h3 style={{ fontSize: '0.80rem', fontWeight: 700, margin: '1px 0', textTransform: 'uppercase', color: '#1e3a8a' }}>
            {isPdprActive 
              ? `Jadual Waktu Pengajaran dan Pembelajaran di Rumah (PdPR) — ${activeVersion === 'CLASS' ? `Kelas ${selectedClassObj?.name}` : `Persendirian Guru`}`
              : (activeVersion === 'MASTER_ALL' ? `Jadual Waktu Induk Sekolah — Hari ${daysOfWeek[masterDayFilter - 1]}` : (activeVersion === 'CLASS' ? `Jadual Waktu Kelas: ${selectedClassObj?.name}` : `Jadual Waktu Persendirian Guru`))
            }
          </h3>
        </div>
      </div>

      {/* TOAST SWAP */}
      {swapToast && (
        <div style={{ position: 'fixed', top: '16px', right: '16px', backgroundColor: '#15803d', color: '#ffffff', padding: '0.6rem 1.2rem', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)', zIndex: 9999, fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={15} />
          <span>{swapToast}</span>
        </div>
      )}

      {/* BANNER SWAP */}
      {swapSourceSlot && (
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1.5px solid #2563eb',
          borderRadius: '10px',
          padding: '0.6rem 1rem',
          marginBottom: '0.65rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={16} color="#2563eb" style={{ animation: 'spin 2s linear infinite' }} />
            <div>
              <strong style={{ color: '#1e40af', fontSize: '0.82rem' }}>
                MOD SWAP: Slot Terpilih Hari {daysOfWeek[swapSourceSlot.day - 1]}, Waktu {swapSourceSlot.slot} ({swapSourceSlot.subjectId || 'Subjek'})
              </strong>
              <span style={{ fontSize: '0.74rem', color: '#2563eb', marginLeft: '6px' }}>
                Klik mana-mana petak sasaran untuk bertukar posisi.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSwapSourceSlot(null)}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              padding: '0.3rem 0.8rem',
              borderRadius: '6px',
              fontSize: '0.74rem',
              fontWeight: 700,
              color: '#dc2626',
              cursor: 'pointer'
            }}
          >
            Batal Swap
          </button>
        </div>
      )}

      {/* BANNER PdPR / ANJAL */}
      {isPdprActive && (
        <div className="screen-only-header" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.4rem 0.8rem', borderRadius: '8px', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Wifi size={14} color="#1d4ed8" />
            <strong style={{ color: '#1e40af', fontSize: '0.78rem' }}>MOD JADUAL PdPR AKTIF: {pdprConfig.name}</strong>
            <span style={{ fontSize: '0.70rem', color: '#1d4ed8' }}>({pdprConfig.blockDurationMinutes}m / blok diselangi Rehat)</span>
          </div>
          <button
            type="button"
            onClick={() => setScheduleMode('MASTER')}
            style={{ fontSize: '0.72rem', backgroundColor: '#ffffff', border: '1px solid #2563eb', color: '#1d4ed8', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
          >
            Kembali ke Jadual Induk
          </button>
        </div>
      )}

      {isFlexibleActive && (
        <div className="screen-only-header" style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '0.4rem 0.8rem', borderRadius: '8px', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Moon size={14} color="#b45309" />
            <strong style={{ color: '#92400e', fontSize: '0.78rem' }}>MOD ANJAL RAMADAN: {flexibleConfig.name}</strong>
            <span style={{ fontSize: '0.70rem', color: '#b45309' }}>({flexibleConfig.slotDurationMinutes}m / slot)</span>
          </div>
          <button
            type="button"
            onClick={() => setScheduleMode('MASTER')}
            style={{ fontSize: '0.72rem', backgroundColor: '#ffffff', border: '1px solid #d97706', color: '#b45309', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
          >
            Kembali ke Jadual Asal
          </button>
        </div>
      )}

      {/* BAR KAWALAN UTAMA */}
      <div className="screen-only-header" style={{
        backgroundColor: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '12px',
        padding: '0.65rem 1rem',
        marginBottom: '0.65rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        
        {/* TAB PILIHAN */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          
          <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={() => setActiveVersion('CLASS')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                border: 'none',
                backgroundColor: activeVersion === 'CLASS' ? '#2563eb' : 'transparent',
                color: activeVersion === 'CLASS' ? '#ffffff' : '#475569',
                boxShadow: activeVersion === 'CLASS' ? '0 1px 3px rgba(37,99,235,0.3)' : 'none'
              }}
            >
              <BookOpen size={13} /> 2. Jadual Kelas
            </button>

            <button
              type="button"
              onClick={() => setActiveVersion('TEACHER')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                border: 'none',
                backgroundColor: activeVersion === 'TEACHER' ? '#2563eb' : 'transparent',
                color: activeVersion === 'TEACHER' ? '#ffffff' : '#475569',
                boxShadow: activeVersion === 'TEACHER' ? '0 1px 3px rgba(37,99,235,0.3)' : 'none'
              }}
            >
              <UserCheck size={13} /> 3. Jadual Guru Individu
            </button>

            <button
              type="button"
              onClick={() => setActiveVersion('MASTER_ALL')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                border: 'none',
                backgroundColor: activeVersion === 'MASTER_ALL' ? '#2563eb' : 'transparent',
                color: activeVersion === 'MASTER_ALL' ? '#ffffff' : '#475569',
                boxShadow: activeVersion === 'MASTER_ALL' ? '0 1px 3px rgba(37,99,235,0.3)' : 'none'
              }}
            >
              <Layers size={13} /> 1. Jadual Induk
            </button>
          </div>

          {activeVersion === 'CLASS' && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Kelas:</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                style={{ padding: '0.32rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.76rem', fontWeight: 700, backgroundColor: '#ffffff', color: '#0f172a' }}
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.academicStage === 'STAGE_1' ? 'Tahap 1' : 'Tahap 2'})</option>
                ))}
              </select>
            </div>
          )}

          {activeVersion === 'TEACHER' && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Guru:</span>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                style={{ padding: '0.32rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.76rem', fontWeight: 700, backgroundColor: '#ffffff', color: '#0f172a' }}
              >
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.code} - {t.fullName}</option>
                ))}
              </select>
            </div>
          )}

          {activeVersion === 'MASTER_ALL' && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Hari:</span>
              {daysOfWeek.map((dayName, idx) => (
                <button
                  key={idx + 1}
                  type="button"
                  onClick={() => setMasterDayFilter(idx + 1)}
                  style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '5px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: masterDayFilter === idx + 1 ? '1px solid #2563eb' : '1px solid #cbd5e1',
                    backgroundColor: masterDayFilter === idx + 1 ? '#2563eb' : '#ffffff',
                    color: masterDayFilter === idx + 1 ? '#ffffff' : '#334155'
                  }}
                >
                  {dayName}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* TINDAKAN */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          
          <div style={{ display: 'inline-flex', background: '#f8fafc', padding: '2px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
            <button
              type="button"
              onClick={() => setScheduleMode('MASTER')}
              style={{
                padding: '0.25rem 0.65rem',
                fontSize: '0.72rem',
                borderRadius: '4px',
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
                backgroundColor: scheduleMode === 'MASTER' ? '#2563eb' : 'transparent',
                color: scheduleMode === 'MASTER' ? '#ffffff' : '#64748b'
              }}
            >
              Fizikal
            </button>
            <button
              type="button"
              onClick={() => setScheduleMode('FLEXIBLE')}
              style={{
                padding: '0.25rem 0.65rem',
                fontSize: '0.72rem',
                borderRadius: '4px',
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
                backgroundColor: scheduleMode === 'FLEXIBLE' ? '#f59e0b' : 'transparent',
                color: scheduleMode === 'FLEXIBLE' ? '#ffffff' : '#64748b'
              }}
            >
              Anjal
            </button>
            <button
              type="button"
              onClick={() => setScheduleMode('PDPR')}
              style={{
                padding: '0.25rem 0.65rem',
                fontSize: '0.72rem',
                borderRadius: '4px',
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
                backgroundColor: scheduleMode === 'PDPR' ? '#2563eb' : 'transparent',
                color: scheduleMode === 'PDPR' ? '#ffffff' : '#64748b',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <Wifi size={11} /> PdPR
            </button>
          </div>

          {isPdprActive ? (
            <button 
              type="button" 
              onClick={() => setIsPdprModalOpen(true)}
              style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
            >
              <SlidersHorizontal size={12} /> Tetapan PdPR
            </button>
          ) : (
            <button 
              type="button" 
              onClick={() => setIsFlexibleModalOpen(true)}
              style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
            >
              <SlidersHorizontal size={12} /> Tetapan Anjal
            </button>
          )}

          {activeVersion !== 'MASTER_ALL' && (
            <>
              <button
                type="button"
                onClick={() => handleOpenShareModal(activeVersion)}
                style={{ backgroundColor: '#16a34a', color: '#ffffff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Send size={12} /> WhatsApp
              </button>

              <button
                type="button"
                onClick={() => handleOpenShareModal(activeVersion)}
                style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Mail size={12} /> Emel
              </button>
            </>
          )}

          <button 
            type="button" 
            onClick={() => window.print()}
            style={{ backgroundColor: '#0f172a', color: '#ffffff', border: 'none', padding: '0.35rem 0.85rem', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Printer size={13} /> Cetak
          </button>
        </div>
      </div>

      {/* KAD KONTENA UTAMA JADUAL WAKTU */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '12px',
        padding: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        marginBottom: '0.85rem'
      }}>
        
        {/* Reben Maklumat */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          backgroundColor: '#f8fafc',
          borderBottom: '1.5px solid #e2e8f0',
          padding: '6px 10px',
          marginBottom: '8px',
          fontSize: '0.75rem',
          color: '#334155'
        }}>
          {activeVersion === 'CLASS' && (
            <>
              <div><span style={{ color: '#64748b' }}>Kelas:</span> <strong style={{ color: '#0f172a' }}>{selectedClassObj?.name}</strong></div>
              <div><span style={{ color: '#64748b' }}>Guru Kelas:</span> <strong style={{ color: '#0f172a' }}>{getGuruKelasForClass(selectedClassId)}</strong></div>
              <div><span style={{ color: '#64748b' }}>Sesi:</span> <strong style={{ color: '#0f172a' }}>{isPdprActive ? 'PdPR 2026/2027' : '2026 / 2027'}</strong></div>
            </>
          )}
          {activeVersion === 'TEACHER' && (
            <>
              <div><span style={{ color: '#64748b' }}>Guru:</span> <strong style={{ color: '#0f172a' }}>{selectedTeacherObj?.fullName} ({selectedTeacherObj?.code})</strong></div>
              <div><span style={{ color: '#64748b' }}>Nama Kelas:</span> <strong style={{ color: '#0f172a' }}>{getNamaKelasForTeacher(selectedTeacherId)}</strong></div>
              <div><span style={{ color: '#64748b' }}>Sesi:</span> <strong style={{ color: '#0f172a' }}>{isPdprActive ? 'PdPR 2026/2027' : '2026 / 2027'}</strong></div>
            </>
          )}
          {activeVersion === 'MASTER_ALL' && (
            <>
              <div><span style={{ color: '#64748b' }}>Jadual Induk:</span> <strong style={{ color: '#0f172a' }}>Hari {daysOfWeek[masterDayFilter - 1]}</strong></div>
              <div><span style={{ color: '#64748b' }}>Jumlah Kelas:</span> <strong style={{ color: '#0f172a' }}>{classes.length} Kelas</strong></div>
              <div><span style={{ color: '#64748b' }}>Sesi:</span> <strong style={{ color: '#0f172a' }}>{isPdprActive ? 'PdPR 2026/2027' : '2026 / 2027'}</strong></div>
            </>
          )}
        </div>

        {/* JADUAL INDUK SEKOLAH */}
        {activeVersion === 'MASTER_ALL' && (
          <div className={styles.gridWrapper} style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
            <table className={styles.timetable} style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: '95px', textAlign: 'center', fontWeight: 700, background: '#f8fafc', padding: '6px' }}>Kelas</th>
                  {standardTimeSlots.map(slot => (
                    <th key={slot.slotIndex} style={{ fontWeight: 700, textAlign: 'center', background: '#f8fafc', padding: '6px' }}>
                      W{slot.slotIndex}<br/>
                      <small style={{ fontSize: '0.60rem', fontWeight: 400 }}>{slot.timeLabel}</small>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classes.map(cls => {
                  const rowCells = getRowCells(masterDayFilter, cls.id);
                  return (
                    <tr key={cls.id}>
                      <td style={{ fontWeight: 700, textAlign: 'center', backgroundColor: '#f8fafc', color: '#0f172a', fontSize: '0.74rem', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                        {cls.name}
                      </td>
                      {rowCells.map((item) => renderMergedCell(masterDayFilter, item, cls.id))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* JADUAL KELAS & JADUAL GURU INDIVIDU */}
        {(activeVersion === 'CLASS' || activeVersion === 'TEACHER') && (
          <div className={styles.gridWrapper} style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
            <table className={styles.timetable} style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center', fontWeight: 700, background: '#f8fafc', padding: '6px' }}>
                    HARI / MASA
                  </th>
                  {standardTimeSlots.map(slot => (
                    <th key={slot.slotIndex} style={{ fontWeight: 700, textAlign: 'center', background: '#f8fafc', padding: '6px' }}>
                      W{slot.slotIndex}<br/>
                      <small style={{ fontSize: '0.60rem', fontWeight: 400 }}>{slot.timeLabel}</small>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {daysOfWeek.map((dayName, dIdx) => {
                  const dayNum = dIdx + 1;
                  const rowCells = getRowCells(dayNum);
                  return (
                    <tr key={dIdx}>
                      <td className={styles.dayCol} style={{ backgroundColor: '#f8fafc', fontWeight: 800, color: '#334155', textAlign: 'center', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                        <span>{dayName}</span>
                      </td>
                      {rowCells.map((item) => renderMergedCell(dayNum, item))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* JADUAL RUMUSAN PdP GURU INDIVIDU DENGAN LAJUR PERBANDINGAN SEBENAR VS SEMASA */}
      {activeVersion === 'TEACHER' && selectedTeacherSubjectBreakdown && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '10px 14px', marginBottom: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BarChart3 size={15} color="#2563eb" />
              <span style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 800 }}>
                Rumusan Analisa Beban PdP Mengikut Subjek: {selectedTeacherObj?.fullName} {isPdprActive && '(Sesi PdPR)'}
              </span>
            </div>
            
            {/* LENCANA STATUS PERBANDINGAN KUOTA */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Had Maksimum: <strong style={{ color: selectedTeacherSubjectBreakdown.isOverload ? '#dc2626' : '#0f172a' }}>{selectedTeacherSubjectBreakdown.maxLimit} Waktu</strong> Seminggu
              </span>
              
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: selectedTeacherSubjectBreakdown.isOverload ? '#fef2f2' : '#f0fdf4',
                color: selectedTeacherSubjectBreakdown.isOverload ? '#dc2626' : '#166534',
                border: `1.5px solid ${selectedTeacherSubjectBreakdown.isOverload ? '#fca5a5' : '#86efac'}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {selectedTeacherSubjectBreakdown.isOverload ? <AlertTriangle size={13} color="#dc2626" /> : <Check size={13} color="#16a34a" />}
                <span>
                  {selectedTeacherSubjectBreakdown.isOverload 
                    ? `⚠️ Melebihi Kuota (+${Math.max(selectedTeacherSubjectBreakdown.grandAssignedTotal, selectedTeacherSubjectBreakdown.totalScheduled) - selectedTeacherSubjectBreakdown.maxLimit}W)` 
                    : '✓ Optimum / Mematuhi Kuota'}
                </span>
              </span>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', fontSize: '0.70rem', backgroundColor: '#ffffff', borderRadius: '6px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ width: '32px', textAlign: 'center', border: '1px solid #cbd5e1', padding: '5px 3px', fontWeight: 700, color: '#1e293b' }}>Bil.</th>
                <th style={{ width: '60px', textAlign: 'center', border: '1px solid #cbd5e1', padding: '5px 3px', fontWeight: 700, color: '#1e293b' }}>Kod</th>
                <th style={{ textAlign: 'left', border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 700, color: '#1e293b' }}>Mata Pelajaran</th>
                <th style={{ textAlign: 'left', border: '1px solid #cbd5e1', padding: '5px 8px', fontWeight: 700, color: '#1e293b' }}>Kelas Terlibat</th>
                
                {/* LAJUR PERBANDINGAN: KUOTA SEBENAR VS SEMASA */}
                <th style={{ width: '120px', textAlign: 'center', border: '1px solid #cbd5e1', padding: '5px 4px', fontWeight: 700, color: '#1e40af', background: '#eff6ff' }}>
                  Kuota Ditugaskan (L5)
                </th>
                <th style={{ width: '120px', textAlign: 'center', border: '1px solid #cbd5e1', padding: '5px 4px', fontWeight: 700, color: '#0f172a', background: '#f8fafc' }}>
                  Kuota Terjana (L6)
                </th>
                <th style={{ width: '100px', textAlign: 'center', border: '1px solid #cbd5e1', padding: '5px 4px', fontWeight: 700, color: '#334155' }}>
                  Beza (Status)
                </th>
                <th style={{ width: '90px', textAlign: 'center', border: '1px solid #cbd5e1', padding: '5px 4px', fontWeight: 700, color: '#1e293b' }}>
                  Jam Setara
                </th>
              </tr>
            </thead>
            <tbody>
              {selectedTeacherSubjectBreakdown.list.map((item, idx) => {
                const cStyle = getSubjectColorStyle(item.code);
                const itemHours = ((item.scheduledCount * currentSlotDuration) / 60).toFixed(1);
                const diff = item.scheduledCount - item.assignedCount;
                const isUnderPlaced = item.assignedCount > 0 && item.scheduledCount < item.assignedCount;

                return (
                  <tr key={item.code} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ textAlign: 'center', border: '1px solid #cbd5e1', padding: '4px 3px', color: '#64748b' }}>{idx + 1}</td>
                    <td style={{ textAlign: 'center', border: '1px solid #cbd5e1', padding: '4px 3px' }}>
                      <span style={{ padding: '1px 5px', borderRadius: '4px', fontSize: '0.64rem', fontWeight: 700, backgroundColor: cStyle.bg, color: cStyle.color, border: `1px solid ${cStyle.border}` }}>
                        {item.code}
                      </span>
                    </td>
                    <td style={{ textAlign: 'left', border: '1px solid #cbd5e1', padding: '4px 8px', color: '#1e293b', fontWeight: 600 }}>{item.name}</td>
                    <td style={{ textAlign: 'left', border: '1px solid #cbd5e1', padding: '4px 8px', color: '#475569' }}>
                      {Array.from(item.classesList).join(', ') || '-'}
                    </td>
                    
                    {/* KUOTA DITUGASKAN (L5) */}
                    <td style={{ textAlign: 'center', border: '1px solid #cbd5e1', padding: '4px', fontWeight: 700, color: '#1d4ed8', background: '#eff6ff' }}>
                      {item.assignedCount} Waktu ({item.assignedCount}W)
                    </td>

                    {/* KUOTA TERJANA (L6) - MERAH JIKA KURANG DARIPADA YANG DITETAPKAN */}
                    <td style={{ textAlign: 'center', border: '1px solid #cbd5e1', padding: '4px', fontWeight: 800, color: isUnderPlaced ? '#dc2626' : '#15803d' }}>
                      {item.scheduledCount} Waktu ({item.scheduledCount}W)
                    </td>

                    {/* BEZA STATUS */}
                    <td style={{ textAlign: 'center', border: '1px solid #cbd5e1', padding: '4px' }}>
                      {isUnderPlaced ? (
                        <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.64rem' }}>
                          ⚠️ Kurang {item.assignedCount - item.scheduledCount}W
                        </span>
                      ) : diff > 0 ? (
                        <span style={{ color: '#d97706', fontWeight: 700, fontSize: '0.64rem' }}>
                          +{diff}W (Koku/Tambahan)
                        </span>
                      ) : (
                        <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.64rem' }}>
                          ✓ Tepat
                        </span>
                      )}
                    </td>

                    <td style={{ textAlign: 'center', border: '1px solid #cbd5e1', padding: '4px', color: '#475569', fontWeight: 600 }}>
                      {itemHours} Jam
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#f1f5f9', borderTop: '2px solid #cbd5e1' }}>
                <td colSpan={4} style={{ textAlign: 'right', border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 800, color: '#0f172a' }}>
                  Jumlah Keseluruhan Waktu Mengajar:
                </td>
                
                {/* TOTAL KUOTA SEBENAR (L5) */}
                <td style={{ textAlign: 'center', border: '1px solid #cbd5e1', padding: '6px', color: selectedTeacherSubjectBreakdown.grandAssignedTotal > selectedTeacherSubjectBreakdown.maxLimit ? '#dc2626' : '#1d4ed8', fontWeight: 800, background: '#eff6ff', fontSize: '0.74rem' }}>
                  {selectedTeacherSubjectBreakdown.grandAssignedTotal} Waktu
                </td>

                {/* TOTAL KUOTA SEMASA (L6) - MERAH JIKA LEBIH HAD */}
                <td style={{ textAlign: 'center', border: '1px solid #cbd5e1', padding: '6px', color: selectedTeacherSubjectBreakdown.totalScheduled > selectedTeacherSubjectBreakdown.maxLimit ? '#dc2626' : '#15803d', fontWeight: 800, fontSize: '0.74rem' }}>
                  {selectedTeacherSubjectBreakdown.totalScheduled} Waktu
                </td>

                {/* STATUS FOOTER */}
                <td style={{ textAlign: 'center', border: '1px solid #cbd5e1', padding: '6px', fontWeight: 800 }}>
                  {selectedTeacherSubjectBreakdown.totalScheduled > selectedTeacherSubjectBreakdown.maxLimit ? (
                    <span style={{ color: '#dc2626', fontSize: '0.66rem' }}>
                      ⚠️ LEBIH {selectedTeacherSubjectBreakdown.totalScheduled - selectedTeacherSubjectBreakdown.maxLimit}W
                    </span>
                  ) : selectedTeacherSubjectBreakdown.totalScheduled < selectedTeacherSubjectBreakdown.grandAssignedTotal ? (
                    <span style={{ color: '#dc2626', fontSize: '0.66rem' }}>
                      ⚠️ TERCICIR {selectedTeacherSubjectBreakdown.grandAssignedTotal - selectedTeacherSubjectBreakdown.totalScheduled}W
                    </span>
                  ) : (
                    <span style={{ color: '#16a34a', fontSize: '0.66rem' }}>
                      ✓ OPTIMUM
                    </span>
                  )}
                </td>

                <td style={{ textAlign: 'center', border: '1px solid #cbd5e1', padding: '6px', color: '#0f172a', fontWeight: 800 }}>
                  {selectedTeacherSubjectBreakdown.totalHours.toFixed(1)} Jam / Minggu
                </td>
              </tr>
            </tfoot>
          </table>

          {/* PERINGATAN KEKANGAN APABILA ADA WAKTU TERCICIR */}
          {selectedTeacherSubjectBreakdown.totalScheduled < selectedTeacherSubjectBreakdown.grandAssignedTotal && (
            <div style={{ marginTop: '6px', padding: '6px 10px', borderRadius: '6px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', color: '#991b1b' }}>
              <AlertTriangle size={13} color="#dc2626" />
              <span>
                <strong>Nota Integriti:</strong> Terdapat {selectedTeacherSubjectBreakdown.grandAssignedTotal - selectedTeacherSubjectBreakdown.totalScheduled} waktu tidak dapat ditempatkan kerana kekangan hari cuti guru (cth: Isnin tiada kelas) bertembung dengan waktu kelas murid yang sudah padat.
              </span>
            </div>
          )}
        </div>
      )}

      {/* JADUAL RUMUSAN KELAS */}
      {activeVersion === 'CLASS' && selectedClassSubjectBreakdown && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '8px 12px', marginBottom: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BarChart3 size={14} color="#2563eb" />
              <span style={{ fontSize: '0.74rem', color: '#0f172a', fontWeight: 800 }}>
                Rumusan Analisa Mata Pelajaran Kelas: {selectedClassSubjectBreakdown.className} {isPdprActive && '(Sesi PdPR)'}
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
              Jumlah Beban Murid Seminggu
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', fontSize: '0.66rem', backgroundColor: '#ffffff', borderRadius: '6px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ width: '30px', textAlign: 'center', border: '1px solid #cbd5e1', padding: '3px', fontWeight: 700, color: '#1e293b' }}>Bil.</th>
                <th style={{ width: '55px', textAlign: 'center', border: '1px solid #cbd5e1', padding: '3px', fontWeight: 700, color: '#1e293b' }}>Kod</th>
                <th style={{ textAlign: 'left', border: '1px solid #cbd5e1', padding: '3px 6px', fontWeight: 700, color: '#1e293b' }}>Mata Pelajaran</th>
                <th style={{ textAlign: 'left', border: '1px solid #cbd5e1', padding: '3px 6px', fontWeight: 700, color: '#1e293b' }}>Guru Pengajar</th>
                <th style={{ width: '120px', textAlign: 'center', border: '1px solid #cbd5e1', padding: '3px', fontWeight: 700, color: '#1e293b' }}>Waktu Seminggu</th>
                <th style={{ width: '100px', textAlign: 'center', border: '1px solid #cbd5e1', padding: '3px', fontWeight: 700, color: '#1e293b' }}>Jam PdP Setara</th>
              </tr>
            </thead>
            <tbody>
              {selectedClassSubjectBreakdown.list.map((item, idx) => {
                const cStyle = getSubjectColorStyle(item.code);
                const itemHours = ((item.count * currentSlotDuration) / 60).toFixed(1);
                return (
                  <tr key={item.code} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ textAlign: 'center', border: '1px solid #cbd5e1', padding: '3px', color: '#64748b' }}>{idx + 1}</td>
                    <td style={{ textAlign: 'center', border: '1px solid #cbd5e1', padding: '3px' }}>
                      <span style={{ padding: '1px 5px', borderRadius: '4px', fontSize: '0.62rem', fontWeight: 700, backgroundColor: cStyle.bg, color: cStyle.color, border: `1px solid ${cStyle.border}` }}>
                        {item.code}
                      </span>
                    </td>
                    <td style={{ textAlign: 'left', border: '1px solid #cbd5e1', padding: '3px 6px', color: '#1e293b', fontWeight: 500 }}>{item.name}</td>
                    <td style={{ textAlign: 'left', border: '1px solid #cbd5e1', padding: '3px 6px', color: '#475569', fontWeight: 400 }}>
                      {Array.from(item.teacherNames).join(', ') || '-'}
                    </td>
                    <td style={{ textAlign: 'center', border: '1px solid #cbd5e1', padding: '3px', color: '#1d4ed8', fontWeight: 700 }}>
                      {item.count} Waktu ({item.count}W)
                    </td>
                    <td style={{ textAlign: 'center', border: '1px solid #cbd5e1', padding: '3px', color: '#475569', fontWeight: 500 }}>
                      {itemHours} Jam
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#f1f5f9', borderTop: '1.5px solid #cbd5e1' }}>
                <td colSpan={4} style={{ textAlign: 'right', border: '1px solid #cbd5e1', padding: '4px 8px', fontWeight: 700, color: '#0f172a' }}>
                  Jumlah Keseluruhan Waktu Pembelajaran:
                </td>
                <td style={{ textAlign: 'center', border: '1px solid #cbd5e1', padding: '3px', color: '#15803d', fontWeight: 800 }}>
                  {selectedClassSubjectBreakdown.totalSlots} Waktu ({selectedClassSubjectBreakdown.totalSlots}W)
                </td>
                <td style={{ textAlign: 'center', border: '1px solid #cbd5e1', padding: '3px', color: '#15803d', fontWeight: 800 }}>
                  {selectedClassSubjectBreakdown.totalHours.toFixed(1)} Jam / Minggu
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* JADUAL RUMUSAN INDUK GURU */}
      {activeVersion === 'MASTER_ALL' && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '8px 12px', marginBottom: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BarChart3 size={14} color="#2563eb" />
              <span style={{ fontSize: '0.74rem', color: '#0f172a', fontWeight: 800 }}>
                Rumusan Keseluruhan Taburan Masa Mengajar Guru (Semua Guru)
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
              Status Audit Beban Mengajar Mingguan
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', fontSize: '0.66rem', backgroundColor: '#ffffff', borderRadius: '6px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ width: '45px', textAlign: 'left', border: '1px solid #cbd5e1', padding: '3px 5px', fontWeight: 700, color: '#1e293b' }}>Kod</th>
                <th style={{ textAlign: 'left', border: '1px solid #cbd5e1', padding: '3px 6px', fontWeight: 700, color: '#1e293b' }}>Nama Guru</th>
                <th style={{ width: '85px', textAlign: 'left', border: '1px solid #cbd5e1', padding: '3px 5px', fontWeight: 700, color: '#1e293b' }}>Jawatan</th>
                <th style={{ textAlign: 'center', width: '38px', border: '1px solid #cbd5e1', padding: '3px', fontWeight: 700, color: '#1e293b' }}>{daysOfWeek[0]}</th>
                <th style={{ textAlign: 'center', width: '38px', border: '1px solid #cbd5e1', padding: '3px', fontWeight: 700, color: '#1e293b' }}>{daysOfWeek[1]}</th>
                <th style={{ textAlign: 'center', width: '38px', border: '1px solid #cbd5e1', padding: '3px', fontWeight: 700, color: '#1e293b' }}>{daysOfWeek[2]}</th>
                <th style={{ textAlign: 'center', width: '38px', border: '1px solid #cbd5e1', padding: '3px', fontWeight: 700, color: '#1e293b' }}>{daysOfWeek[3]}</th>
                <th style={{ textAlign: 'center', width: '38px', border: '1px solid #cbd5e1', padding: '3px', fontWeight: 700, color: '#1e293b' }}>{daysOfWeek[4]}</th>
                <th style={{ textAlign: 'center', width: '55px', border: '1px solid #cbd5e1', padding: '3px', fontWeight: 700, background: '#eff6ff', color: '#1d4ed8' }}>Kuota L5</th>
                <th style={{ textAlign: 'center', width: '55px', border: '1px solid #cbd5e1', padding: '3px', fontWeight: 700, color: '#0f172a' }}>Dijana L6</th>
                <th style={{ textAlign: 'center', width: '50px', border: '1px solid #cbd5e1', padding: '3px', fontWeight: 700, color: '#1e293b' }}>Had</th>
                <th style={{ width: '75px', textAlign: 'center', border: '1px solid #cbd5e1', padding: '3px 5px', fontWeight: 700, color: '#1e293b' }}>Status Audit</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t, idx) => {
                const dayCounts = [1, 2, 3, 4, 5].map(d => {
                  const uniqueDaySlots = new Set<string>();
                  entries.forEach(e => {
                    const match = e.teacherId === t.id || e.teacherId === t.code || (e.isCocurricular && e.teacherId === 'ALL_TEACHERS');
                    if (match && e.timeSlotId.startsWith(`d${d}_`)) {
                      uniqueDaySlots.add(e.timeSlotId);
                    }
                  });
                  return uniqueDaySlots.size;
                });
                const totalPlaced = dayCounts.reduce((a, b) => a + b, 0);
                const assignedTotal = globalTeacherAssignedMap.get(t.id)?.totalAssigned || 0;
                const maxLimit = t.maxWeeklySlots ?? 26;
                const isOver = assignedTotal > maxLimit || totalPlaced > maxLimit;

                return (
                  <tr key={t.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ border: '1px solid #cbd5e1', padding: '3px 5px', fontWeight: 700, color: '#0f172a' }}>{t.code}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '3px 6px', color: '#1e293b', fontWeight: 500 }}>{t.fullName}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '3px 5px' }}>
                      <span style={{ fontSize: '0.60rem', fontWeight: 700, padding: '1px 5px', borderRadius: '3px', background: '#e2e8f0', color: '#334155' }}>
                        {t.role}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', border: '1px solid #cbd5e1', padding: '3px' }}>{dayCounts[0]}W</td>
                    <td style={{ textAlign: 'center', border: '1px solid #cbd5e1', padding: '3px' }}>{dayCounts[1]}W</td>
                    <td style={{ textAlign: 'center', border: '1px solid #cbd5e1', padding: '3px' }}>{dayCounts[2]}W</td>
                    <td style={{ textAlign: 'center', border: '1px solid #cbd5e1', padding: '3px' }}>{dayCounts[3]}W</td>
                    <td style={{ textAlign: 'center', border: '1px solid #cbd5e1', padding: '3px' }}>{dayCounts[4]}W</td>
                    
                    {/* KUOTA L5 */}
                    <td style={{ textAlign: 'center', border: '1px solid #cbd5e1', padding: '3px', fontWeight: 800, background: '#eff6ff', color: assignedTotal > maxLimit ? '#dc2626' : '#1d4ed8' }}>
                      {assignedTotal}W
                    </td>

                    {/* DIJANA L6 */}
                    <td style={{ textAlign: 'center', border: '1px solid #cbd5e1', padding: '3px', fontWeight: 800, color: totalPlaced > maxLimit ? '#dc2626' : '#15803d' }}>
                      {totalPlaced}W
                    </td>

                    <td style={{ textAlign: 'center', border: '1px solid #cbd5e1', padding: '3px', color: '#64748b' }}>{maxLimit}W</td>
                    
                    <td style={{ textAlign: 'center', border: '1px solid #cbd5e1', padding: '3px 5px' }}>
                      {isOver ? (
                        <span style={{ color: '#dc2626', fontWeight: 700 }}>⚠️ Lebih</span>
                      ) : (
                        <span style={{ color: '#166534', fontWeight: 700 }}>
                          ✓ Teratur
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TANDATANGAN CETAKAN */}
      <div className="print-only-footer" style={{ display: 'none' }}>
        <table style={{ width: '100%', border: 'none', borderCollapse: 'collapse', marginTop: '6px' }}>
          <tbody>
            <tr>
              <td style={{ width: '50%', textAlign: 'left', border: 'none', verticalAlign: 'top', paddingLeft: '35px' }}>
                <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 500 }}>Disediakan Oleh:</p>
                <div style={{ height: '24px' }}></div>
                <div style={{ borderTop: '1px solid #000000', width: '190px', paddingTop: '1px' }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.70rem' }}>(PENYELARAS JADUAL WAKTU)</p>
                  <p style={{ margin: 0, fontSize: '0.60rem', color: '#475569' }}>Jawatankuasa Pengurusan Kurikulum</p>
                </div>
              </td>
              <td style={{ width: '50%', textAlign: 'right', border: 'none', verticalAlign: 'top', paddingRight: '35px' }}>
                <div style={{ display: 'inline-block', textAlign: 'left' }}>
                  <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 500 }}>Disahkan Oleh:</p>
                  <div style={{ height: '24px' }}></div>
                  <div style={{ borderTop: '1px solid #000000', width: '190px', paddingTop: '1px' }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.70rem' }}>(GURU BESAR / PENGETUA)</p>
                    <p style={{ margin: 0, fontSize: '0.60rem', color: '#475569' }}>Tarikh Kuat Kuasa: ....................................</p>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* BAR NAVIGASI PENAMAT: HANYA TOMBOL KEMBALI DAN STATUS SELESAI */}
      <div className="screen-only-btn" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '1.25rem',
        paddingTop: '1rem',
        borderTop: '1px solid #cbd5e1',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <button
          type="button"
          onClick={handleGoBackToStep5}
          style={{
            backgroundColor: '#ffffff',
            border: '1.5px solid #cbd5e1',
            color: '#1e293b',
            padding: '0.55rem 1.25rem',
            borderRadius: '8px',
            fontSize: '0.80rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            transition: 'all 0.15s ease'
          }}
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Penjana (Langkah 5)</span>
        </button>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '0.45rem 0.95rem',
          borderRadius: '8px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #86efac',
          color: '#166534',
          fontSize: '0.78rem',
          fontWeight: 700
        }}>
          <CheckCircle2 size={16} color="#16a34a" />
          <span>Jadual Waktu Selesai Dijana & Sedia Digunakan</span>
        </div>
      </div>

      {/* MODAL KONFIGURASI PdPR */}
      {isPdprModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '10px', maxWidth: '460px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wifi size={16} color="#2563eb" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Konfigurasi Parameter Jadual PdPR
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsPdprModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={15} color="#64748b" />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '2px' }}>Waktu Mula:</label>
                <input
                  type="time"
                  className={styles.viewSelector}
                  style={{ width: '100%', borderRadius: '6px' }}
                  value={pdprConfig.startTime}
                  onChange={(e) => setPdprConfig({ ...pdprConfig, startTime: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '2px' }}>Blok Sehari:</label>
                <select
                  className={styles.viewSelector}
                  style={{ width: '100%', borderRadius: '6px' }}
                  value={pdprConfig.totalBlocks}
                  onChange={(e) => setPdprConfig({ ...pdprConfig, totalBlocks: Number(e.target.value) })}
                >
                  <option value={3}>3 Blok Sehari (Standard)</option>
                  <option value={4}>4 Blok Sehari</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '2px' }}>Durasi Blok:</label>
                <select
                  className={styles.viewSelector}
                  style={{ width: '100%', borderRadius: '6px' }}
                  value={pdprConfig.blockDurationMinutes}
                  onChange={(e) => setPdprConfig({ ...pdprConfig, blockDurationMinutes: Number(e.target.value) })}
                >
                  <option value={45}>45 Minit</option>
                  <option value={60}>60 Minit (Standard)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '2px' }}>Rehat Skrin:</label>
                <select
                  className={styles.viewSelector}
                  style={{ width: '100%', borderRadius: '6px' }}
                  value={pdprConfig.recessMinutes}
                  onChange={(e) => setPdprConfig({ ...pdprConfig, recessMinutes: Number(e.target.value) })}
                >
                  <option value={15}>15 Minit</option>
                  <option value={20}>20 Minit (Standard)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setIsPdprModalOpen(false)}
                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.35rem 0.85rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                type="button"
                style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '0.35rem 1rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                onClick={() => {
                  setScheduleMode('PDPR');
                  setIsPdprModalOpen(false);
                }}
              >
                Gunakan Parameter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL WHATSAPP & EMEL */}
      {shareModalConfig.isOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '10px', maxWidth: '500px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Send size={15} color="#16a34a" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  {shareModalConfig.title}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShareModalConfig({ ...shareModalConfig, isOpen: false })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={15} color="#64748b" />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.65rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '2px' }}>Nombor WhatsApp:</label>
                <input
                  type="text"
                  placeholder="Cth: 0123456789"
                  className={styles.viewSelector}
                  style={{ width: '100%', borderRadius: '6px' }}
                  value={shareModalConfig.phoneNumber}
                  onChange={(e) => setShareModalConfig({ ...shareModalConfig, phoneNumber: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '2px' }}>Alamat Emel:</label>
                <input
                  type="email"
                  placeholder="Cth: guru@moe.edu.my"
                  className={styles.viewSelector}
                  style={{ width: '100%', borderRadius: '6px' }}
                  value={shareModalConfig.emailAddress}
                  onChange={(e) => setShareModalConfig({ ...shareModalConfig, emailAddress: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>Pratonton Teks:</label>
                <button
                  type="button"
                  onClick={handleCopyText}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  {copiedToast ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                  <span>{copiedToast ? 'Tersalin!' : 'Salin Teks'}</span>
                </button>
              </div>
              <textarea
                readOnly
                rows={7}
                style={{ width: '100%', fontSize: '0.74rem', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontFamily: 'monospace', lineHeight: 1.35 }}
                value={shareModalConfig.messageText}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShareModalConfig({ ...shareModalConfig, isOpen: false })}
                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.35rem 0.85rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
              >
                Tutup
              </button>

              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={handleSendEmail}
                  style={{ backgroundColor: '#ffffff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '0.35rem 0.85rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Mail size={13} /> Buka Emel
                </button>

                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  style={{ backgroundColor: '#16a34a', color: '#ffffff', border: 'none', padding: '0.35rem 1rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Send size={13} /> WhatsApp Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT PETAK */}
      {activeModalEntry && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '10px', maxWidth: '420px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Edit3 size={15} color="#2563eb" />
                <h3 style={{ fontSize: '0.94rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Sunting Slot: {daysOfWeek[activeModalEntry.day - 1]} (W{activeModalEntry.slot})
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveModalEntry(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={15} color="#64748b" />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '2px' }}>Mata Pelajaran (Kod):</label>
                <input 
                  type="text" 
                  className={styles.viewSelector} 
                  style={{ width: '100%', borderRadius: '6px' }}
                  value={activeModalEntry.entry.subjectId}
                  onChange={(e) => setActiveModalEntry({
                    ...activeModalEntry,
                    entry: { ...activeModalEntry.entry, subjectId: e.target.value.toUpperCase() }
                  })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '2px' }}>Guru Pengajar:</label>
                <select 
                  className={styles.viewSelector} 
                  style={{ width: '100%', borderRadius: '6px' }}
                  value={activeModalEntry.entry.teacherId}
                  onChange={(e) => setActiveModalEntry({
                    ...activeModalEntry,
                    entry: { ...activeModalEntry.entry, teacherId: e.target.value }
                  })}
                >
                  <option value="ALL_TEACHERS">Semua Guru (Perhimpunan / Kokurikulum)</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.code} - {t.fullName}</option>
                  ))}
                </select>
              </div>

              {isPdprActive && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '2px' }}>Mod Pelaksanaan PdPR:</label>
                  <select 
                    className={styles.viewSelector} 
                    style={{ width: '100%', borderRadius: '6px' }}
                    value={pdprModeMap[activeModalEntry.entry.id] || 'ONLINE'}
                    onChange={(e) => {
                      setPdprModeMap({
                        ...pdprModeMap,
                        [activeModalEntry.entry.id]: e.target.value as 'ONLINE' | 'MODUL'
                      });
                    }}
                  >
                    <option value="ONLINE">[Online] (Google Meet / Zoom / Live)</option>
                    <option value="MODUL">[Modul] (Luar Talian / Buku Aktiviti / DELIMa)</option>
                  </select>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={handleDeleteCurrentModalEntry}
                  style={{ backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Padam
                </button>
                <button
                  type="button"
                  onClick={handleTriggerSwapFromModal}
                  style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Swap
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveModalEntry(null)}
                  style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '0.35rem 1rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  onClick={() => handleSaveModalEntry(activeModalEntry.entry)}
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH SLOT */}
      {addingSlotLocation && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '10px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.4rem', color: '#0f172a' }}>
              Tambah Slot PdP: Hari {daysOfWeek[addingSlotLocation.day - 1]}
            </h3>

            <div style={{ marginBottom: '0.65rem' }}>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '2px' }}>Kod Subjek:</label>
              <input 
                type="text" 
                placeholder="Cth: BM, BI, MAT" 
                className={styles.viewSelector} 
                style={{ width: '100%', borderRadius: '6px' }}
                value={newSubjectCode}
                onChange={(e) => setNewSubjectCode(e.target.value.toUpperCase())}
              />
            </div>

            <div style={{ marginBottom: '0.65rem' }}>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '2px' }}>Guru Pengajar:</label>
              <select 
                className={styles.viewSelector} 
                style={{ width: '100%', borderRadius: '6px' }}
                value={newTeacherId}
                onChange={(e) => setNewTeacherId(e.target.value)}
              >
                <option value="">-- Pilih Guru --</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.code} - {t.fullName}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '0.65rem' }}>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '2px' }}>Bilik / Lokasi:</label>
              <select 
                className={styles.viewSelector} 
                style={{ width: '100%', borderRadius: '6px' }}
                value={newRoomId}
                onChange={(e) => setNewRoomId(e.target.value)}
              >
                <option value="">Bilik Darjah Biasa</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
              <button
                type="button"
                onClick={handleMarkSlotAsKoku}
                style={{ backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
              >
                ⚽ Tanda KOKU
              </button>

              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button type="button" className={styles.viewSelector} onClick={() => setAddingSlotLocation(null)}>Batal</button>
                <button type="button" className={styles.btnExport} onClick={handleSaveNewSlot}>Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}