// src/lib/engine/cspSolver.ts

import { 
  SchoolProfileState, 
  TimeGridConfigState, 
  TeacherFormState, 
  RoomFormState, 
  ClassCohortConfig,
  TimetableEntry,
  LockedSlot,
  AcademicStage
} from '@/types/timetable';

export interface SolverResult {
  success: boolean;
  entries: TimetableEntry[];
  clashCount: number;
  totalSlotsRequired: number;
  totalSlotsPlaced: number;
  teacherClashes: number;
  roomClashes: number;
  parallelMismatches: number;
  executionTimeMs: number;
  diagnostics: string[];
}

export function generateTimetableCSP(
  profile: SchoolProfileState,
  grid: TimeGridConfigState,
  teachers: TeacherFormState[],
  rooms: RoomFormState[],
  classes: ClassCohortConfig[],
  lockedSlots: LockedSlot[] = []
): SolverResult {
  const startTime = Date.now();
  const diagnostics: string[] = [];
  const entries: TimetableEntry[] = [];

  const daysCount = 5;
  const slotsPerDay = grid.totalDailySlots || 10;
  const recessSlotGroup1 = 5;
  const recessSlotGroup2 = 6;
  const lunchPrayerSlot = grid.lunchPrayerSlot || 11;

  const adminConsecutiveLimit = grid.maxConsecutiveSlots ?? 3;
  const fridayMaxPdPSlots = grid.fridayMaxSlots ?? 2;

  const teacherOccupancy = new Map<string, string>();
  const roomOccupancy = new Map<string, number>();
  const classOccupancy = new Map<string, string>();
  const classDailySubjectSlots = new Map<string, number>();
  const teacherDailySlots = new Map<string, number>();

  // Kira Beban Mingguan Guru
  const teacherWeeklyDemand = new Map<string, number>();
  for (const cls of classes) {
    for (const d of cls.demands) {
      if (d.code === 'PERH') continue;

      if (d.teacherAllocations && d.teacherAllocations.length > 0) {
        for (const alloc of d.teacherAllocations) {
          if (alloc.teacherId) {
            const cur = teacherWeeklyDemand.get(alloc.teacherId) || 0;
            teacherWeeklyDemand.set(alloc.teacherId, cur + alloc.slots);
          }
        }
      } else if (d.assignedTeacherId) {
        const cur = teacherWeeklyDemand.get(d.assignedTeacherId) || 0;
        teacherWeeklyDemand.set(d.assignedTeacherId, cur + d.weeklySlots);
      }
    }
  }

  const getTeacherDailyCap = (teacherId: string, relaxationLevel: number = 0): number => {
    const teacherObj = teachers.find(t => t.id === teacherId);
    const configuredMax = teacherObj?.dailyMaxSlots || 6;
    const weeklyTotal = teacherWeeklyDemand.get(teacherId) || 0;
    if (weeklyTotal === 0) return slotsPerDay;
    const baseCap = Math.ceil(weeklyTotal / 5);
    return Math.min(configuredMax, baseCap + relaxationLevel);
  };

  const getMaxSubjectDailyLimit = (code: string): number => {
    if (code === 'BM') return 4;
    if (code === 'BI') return 2;
    if (code === 'MAT') return 2;
    if (code === 'PI' || code === 'PM') return 2;
    if (code === 'SN') return 2;
    if (code === 'PJK') return 2;
    if (code === 'PSV') return 2;
    if (code === 'MZ') return 1;
    return 2;
  };

  // ==========================================
  // FASA 1: KUNCI STATIK, REHAT & KOKURIKULUM
  // ==========================================

  // 1A. Kunci Perhimpunan Rasmi
  const assemblySlotKey = `d${grid.assemblyDay}_s${grid.assemblySlot}`;
  for (const cls of classes) {
    classOccupancy.set(`${cls.id}_${assemblySlotKey}`, 'PERH');
    entries.push({
      id: `entry_perh_${cls.id}`,
      timetableId: 'master',
      classId: cls.id,
      timeSlotId: assemblySlotKey,
      subjectId: 'PERH',
      teacherId: 'ALL_TEACHERS',
      roomId: rooms.find(r => r.roomType === 'HALL')?.id || null,
      blockInstanceId: `block_perh_${cls.id}`,
      isLocked: true,
    });
  }

  // 1B. KUNCI KOKURIKULUM (SEMUA KELAS & SEMUA GURU AKTIF)
  if (grid.cocurricularConfig?.enabled) {
    const kokuDay = Number(grid.cocurricularConfig.day);
    const startS = Number(grid.cocurricularConfig.startSlot);
    const count = Number(grid.cocurricularConfig.slotCount);

    for (let offset = 0; offset < count; offset++) {
      const curSlot = startS + offset;
      if (curSlot <= slotsPerDay) {
        const slotKey = `d${kokuDay}_s${curSlot}`;

        for (const cls of classes) {
          classOccupancy.set(`${cls.id}_${slotKey}`, 'KOKU');
          entries.push({
            id: `entry_koku_${cls.id}_${curSlot}`,
            timetableId: 'master',
            classId: cls.id,
            timeSlotId: slotKey,
            subjectId: 'KOKU',
            teacherId: 'ALL_TEACHERS',
            roomId: rooms.find(r => r.roomType === 'FIELD')?.id || null,
            blockInstanceId: `block_koku_${kokuDay}`,
            isLocked: true,
            isCocurricular: true,
          });
        }

        for (const teacher of teachers) {
          if (teacher.isActive) {
            teacherOccupancy.set(`${teacher.id}_${slotKey}`, 'KOKU');
            entries.push({
              id: `entry_koku_teacher_${teacher.id}_${curSlot}`,
              timetableId: 'master',
              classId: 'ALL_CLASSES',
              timeSlotId: slotKey,
              subjectId: 'KOKU',
              teacherId: teacher.id,
              roomId: rooms.find(r => r.roomType === 'FIELD')?.id || null,
              blockInstanceId: `block_koku_t_${kokuDay}`,
              isLocked: true,
              isCocurricular: true,
            });
          }
        }
      }
    }
  }

  // 1C. Kunci Slot Manual Admin
  const lockedDemandReduction = new Map<string, number>();
  for (const lock of lockedSlots) {
    const blockInstanceId = `lock_${lock.id}`;
    for (let offset = 0; offset < lock.blockSize; offset++) {
      const s = lock.slotIndex + offset;
      const slotKey = `d${lock.day}_s${s}`;

      classOccupancy.set(`${lock.classId}_${slotKey}`, lock.subjectCode);
      if (lock.teacherId) {
        teacherOccupancy.set(`${lock.teacherId}_${slotKey}`, lock.classId);
        const tDayKey = `${lock.teacherId}_d${lock.day}`;
        teacherDailySlots.set(tDayKey, (teacherDailySlots.get(tDayKey) || 0) + 1);
      }
      if (lock.roomId) {
        const cur = roomOccupancy.get(`${lock.roomId}_${slotKey}`) || 0;
        roomOccupancy.set(`${lock.roomId}_${slotKey}`, cur + 1);
      }

      const dailyKey = `${lock.classId}_d${lock.day}_${lock.subjectCode}`;
      classDailySubjectSlots.set(dailyKey, (classDailySubjectSlots.get(dailyKey) || 0) + 1);

      entries.push({
        id: `entry_lock_${lock.id}_${offset}`,
        timetableId: 'master',
        classId: lock.classId,
        timeSlotId: slotKey,
        subjectId: lock.subjectCode,
        teacherId: lock.teacherId,
        roomId: lock.roomId || null,
        blockInstanceId,
        isLocked: true,
      });
    }
    const redKey = `${lock.classId}_${lock.subjectCode}`;
    lockedDemandReduction.set(redKey, (lockedDemandReduction.get(redKey) || 0) + lock.blockSize);
  }

  // ==========================================
  // FASA 2: PENYEDIAAN TUGASAN PdP (TERMASUK NILAM & SPLIT)
  // ==========================================
  interface SubDemand {
    subjectCode: string;
    subjectName: string;
    teacherId: string;
    roomId: string | null;
  }

  interface SchedulingTask {
    classId: string;
    stage: AcademicStage;
    category: 'CORE_ACADEMIC' | 'DINIYAH_RELIGIOUS' | 'ELECTIVE' | 'SPECIAL';
    isParallel: boolean;
    blockSize: number;
    subDemands: SubDemand[];
    totalWeeklySlots: number;
    isNilam?: boolean;
  }

  const taskQueue: SchedulingTask[] = [];
  let totalSlotsRequired = 0;

  for (const cls of classes) {
    const homeroom = cls.homeroomId || null;
    const handledParallelKeys = new Set<string>();

    for (const demand of cls.demands) {
      if (demand.code === 'PERH') continue;

      // Subjek Selari (PI & PM)
      if (demand.isParallel && demand.parallelSyncKey) {
        if (handledParallelKeys.has(demand.parallelSyncKey)) continue;
        handledParallelKeys.add(demand.parallelSyncKey);

        const parallelPeers = cls.demands.filter(d => d.parallelSyncKey === demand.parallelSyncKey);
        let slots = demand.weeklySlots;
        totalSlotsRequired += slots;

        const red = lockedDemandReduction.get(`${cls.id}_${demand.code}`) || 0;
        slots = Math.max(0, slots - red);

        const subDemands: SubDemand[] = parallelPeers.map(p => ({
          subjectCode: p.code,
          subjectName: p.name,
          teacherId: p.assignedTeacherId,
          roomId: p.preferredRoomId || (p.code === 'PI' ? rooms.find(r => r.roomType === 'SURAU')?.id || null : homeroom),
        }));

        while (slots >= 2) {
          taskQueue.push({ 
            classId: cls.id, 
            stage: cls.academicStage, 
            category: demand.category, 
            isParallel: true, 
            blockSize: 2, 
            subDemands, 
            totalWeeklySlots: demand.weeklySlots 
          });
          slots -= 2;
        }
        if (slots === 1) {
          taskQueue.push({ 
            classId: cls.id, 
            stage: cls.academicStage, 
            category: demand.category, 
            isParallel: true, 
            blockSize: 1, 
            subDemands, 
            totalWeeklySlots: demand.weeklySlots 
          });
        }
        continue;
      }

      // Kenal Pasti Bilik PSS untuk Aktiviti NILAM
      const pssRoom = rooms.find(r => r.roomType === 'LIBRARY') || rooms.find(r => r.code === 'PSS');

      let targetRoom = demand.preferredRoomId || homeroom;
      if (demand.code === 'PJK') {
        targetRoom = rooms.find(r => r.roomType === 'FIELD')?.id || targetRoom;
      } else if (demand.code === 'SN' && demand.blockSize === 'DOUBLE') {
        targetRoom = rooms.find(r => r.roomType === 'SCIENCE_LAB')?.id || targetRoom;
      }

      // Subjek Kongsi Pengajaran (Split Teaching)
      if (demand.teacherAllocations && demand.teacherAllocations.length > 0) {
        for (const alloc of demand.teacherAllocations) {
          let slots = alloc.slots;
          totalSlotsRequired += slots;

          const red = lockedDemandReduction.get(`${cls.id}_${demand.code}`) || 0;
          slots = Math.max(0, slots - red);

          // Asingkan 1 waktu NILAM jika ditanda
          if (demand.hasNilamSlot && slots >= 1 && pssRoom) {
            taskQueue.push({
              classId: cls.id,
              stage: cls.academicStage,
              category: demand.category,
              isParallel: false,
              blockSize: 1,
              subDemands: [{
                subjectCode: `${demand.code}`,
                subjectName: `${demand.name} (NILAM)`,
                teacherId: alloc.teacherId,
                roomId: pssRoom.id,
              }],
              totalWeeklySlots: demand.weeklySlots,
              isNilam: true,
            });
            slots -= 1;
          }

          const singleSubDemand: SubDemand[] = [{
            subjectCode: demand.code,
            subjectName: demand.name,
            teacherId: alloc.teacherId,
            roomId: targetRoom,
          }];

          while (slots >= 2 && demand.blockSize === 'DOUBLE') {
            taskQueue.push({ classId: cls.id, stage: cls.academicStage, category: demand.category, isParallel: false, blockSize: 2, subDemands: singleSubDemand, totalWeeklySlots: demand.weeklySlots });
            slots -= 2;
          }
          while (slots >= 1) {
            taskQueue.push({ classId: cls.id, stage: cls.academicStage, category: demand.category, isParallel: false, blockSize: 1, subDemands: singleSubDemand, totalWeeklySlots: demand.weeklySlots });
            slots -= 1;
          }
        }
        continue;
      }

      // Subjek Biasa
      let slots = demand.weeklySlots;
      totalSlotsRequired += slots;

      const red = lockedDemandReduction.get(`${cls.id}_${demand.code}`) || 0;
      slots = Math.max(0, slots - red);

      // Asingkan 1 waktu NILAM jika ditanda
      if (demand.hasNilamSlot && slots >= 1 && pssRoom) {
        taskQueue.push({
          classId: cls.id,
          stage: cls.academicStage,
          category: demand.category,
          isParallel: false,
          blockSize: 1,
          subDemands: [{
            subjectCode: `${demand.code}`,
            subjectName: `${demand.name} (NILAM)`,
            teacherId: demand.assignedTeacherId,
            roomId: pssRoom.id,
          }],
          totalWeeklySlots: demand.weeklySlots,
          isNilam: true,
        });
        slots -= 1;
      }

      const singleSubDemand: SubDemand[] = [{
        subjectCode: demand.code,
        subjectName: demand.name,
        teacherId: demand.assignedTeacherId,
        roomId: targetRoom,
      }];

      while (slots >= 2 && demand.blockSize === 'DOUBLE') {
        taskQueue.push({ classId: cls.id, stage: cls.academicStage, category: demand.category, isParallel: false, blockSize: 2, subDemands: singleSubDemand, totalWeeklySlots: demand.weeklySlots });
        slots -= 2;
      }
      while (slots >= 1) {
        taskQueue.push({ classId: cls.id, stage: cls.academicStage, category: demand.category, isParallel: false, blockSize: 1, subDemands: singleSubDemand, totalWeeklySlots: demand.weeklySlots });
        slots -= 1;
      }
    }
  }

  taskQueue.sort((a, b) => {
    if (a.subDemands[0].subjectCode === 'PJK' && b.subDemands[0].subjectCode !== 'PJK') return -1;
    if (a.subDemands[0].subjectCode !== 'PJK' && b.subDemands[0].subjectCode === 'PJK') return 1;

    if (a.isNilam && !b.isNilam) return -1;
    if (!a.isNilam && b.isNilam) return 1;

    if (a.isParallel && !b.isParallel) return -1;
    if (!a.isParallel && b.isParallel) return 1;

    if (a.category === 'CORE_ACADEMIC' && b.category !== 'CORE_ACADEMIC') return -1;
    if (a.category !== 'CORE_ACADEMIC' && b.category === 'CORE_ACADEMIC') return 1;

    if (a.blockSize > b.blockSize) return -1;
    if (a.blockSize < b.blockSize) return 1;

    return 0;
  });

  // ==========================================
  // FASA 3: SEMAKAN KEKANGAN
  // ==========================================
  const isPlacementValid = (
    task: SchedulingTask, 
    d: number, 
    s: number, 
    enforceTeacherCap: boolean,
    relaxationLevel: number,
    enforceDailySubjectLimit: boolean = true
  ): boolean => {
    for (let offset = 0; offset < task.blockSize; offset++) {
      const slot = s + offset;
      if (grid.recessMode === 'STAGGERED') {
        if (task.stage === 'STAGE_1' && slot === recessSlotGroup1) return false;
        if (task.stage === 'STAGE_2' && slot === recessSlotGroup2) return false;
      } else {
        if (slot === recessSlotGroup1) return false;
      }

      if (slotsPerDay === 13 && slot === lunchPrayerSlot) {
        return false;
      }
    }

    if (task.subDemands[0].subjectCode === 'PJK' && s > 3) {
      return false;
    }

    for (const sub of task.subDemands) {
      if (sub.teacherId) {
        const teacherObj = teachers.find(t => t.id === sub.teacherId);
        if (teacherObj?.exemptFromOutdoor && sub.subjectCode === 'PJK') {
          return false;
        }
      }
    }

    const currentCode = task.subDemands[0].subjectCode;
    const prevSub = classOccupancy.get(`${task.classId}_d${d}_s${s - 1}`);
    const nextSub = classOccupancy.get(`${task.classId}_d${d}_s${s + task.blockSize}`);
    if (prevSub === currentCode || nextSub === currentCode) {
      return false;
    }

    if (enforceDailySubjectLimit) {
      const dailyKey = `${task.classId}_d${d}_${currentCode}`;
      const curDaily = classDailySubjectSlots.get(dailyKey) || 0;
      if (curDaily + task.blockSize > getMaxSubjectDailyLimit(currentCode)) {
        return false;
      }
    }

    // PENGUATKUASAAN TEGAS HAD HARI TERAKHIR (JUMAAT / KHAMIS)
    if (d === 5 && fridayMaxPdPSlots > 0) {
      for (const sub of task.subDemands) {
        if (sub.teacherId && sub.teacherId !== 'ALL_TEACHERS') {
          const curFridaySlots = teacherDailySlots.get(`${sub.teacherId}_d5`) || 0;
          if (curFridaySlots + task.blockSize > fridayMaxPdPSlots) {
            return false;
          }
        }
      }
    }

    for (const sub of task.subDemands) {
      if (sub.teacherId && sub.teacherId !== 'ALL_TEACHERS') {
        if (enforceTeacherCap) {
          const tDayKey = `${sub.teacherId}_d${d}`;
          const currentTDaySlots = teacherDailySlots.get(tDayKey) || 0;
          const maxAllowedToday = getTeacherDailyCap(sub.teacherId, relaxationLevel);
          if (currentTDaySlots + task.blockSize > maxAllowedToday) {
            return false;
          }
        }

        if (adminConsecutiveLimit > 0) {
          const teacherDay = new Array(slotsPerDay + 1).fill(false);
          for (let checkS = 1; checkS <= slotsPerDay; checkS++) {
            if (teacherOccupancy.has(`${sub.teacherId}_d${d}_s${checkS}`)) {
              teacherDay[checkS] = true;
            }
          }
          for (let offset = 0; offset < task.blockSize; offset++) {
            teacherDay[s + offset] = true;
          }

          let run = 0;
          for (let checkS = 1; checkS <= slotsPerDay; checkS++) {
            if (checkS === recessSlotGroup1 || checkS === recessSlotGroup2 || checkS === lunchPrayerSlot) {
              run = 0;
            }
            if (teacherDay[checkS]) {
              run++;
              if (run > adminConsecutiveLimit) {
                return false;
              }
            } else {
              run = 0;
            }
          }
        }

        if (grid.enforceTeacherRest) {
          for (let offset = 0; offset < task.blockSize; offset++) {
            const curSlot = s + offset;
            if (curSlot === recessSlotGroup1 && teacherOccupancy.has(`${sub.teacherId}_d${d}_s${recessSlotGroup2}`)) {
              return false;
            }
            if (curSlot === recessSlotGroup2 && teacherOccupancy.has(`${sub.teacherId}_d${d}_s${recessSlotGroup1}`)) {
              return false;
            }
          }
        }
      }
    }

    for (let offset = 0; offset < task.blockSize; offset++) {
      const slotKey = `d${d}_s${s + offset}`;

      if (classOccupancy.has(`${task.classId}_${slotKey}`)) return false;

      for (const sub of task.subDemands) {
        if (sub.teacherId && sub.teacherId !== 'ALL_TEACHERS' && teacherOccupancy.has(`${sub.teacherId}_${slotKey}`)) {
          return false;
        }

        if (sub.roomId) {
          const room = rooms.find(r => r.id === sub.roomId);
          const curCap = roomOccupancy.get(`${sub.roomId}_${slotKey}`) || 0;
          const maxCap = room ? room.capacity : 1;
          if (curCap >= maxCap) return false;
        }
      }
    }

    return true;
  };

  // ==========================================
  // FASA 4: PELAKSANAAN PENJANAAN AI
  // ==========================================
  let placedSlotsCount = 0;

  for (const task of taskQueue) {
    let assigned = false;
    const blockInstanceId = `blk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const sortedDays = [1, 2, 3, 4, 5].sort((dA, dB) => {
      const primaryTeacher = task.subDemands[0]?.teacherId;
      if (!primaryTeacher || primaryTeacher === 'ALL_TEACHERS') return 0;
      const countA = teacherDailySlots.get(`${primaryTeacher}_d${dA}`) || 0;
      const countB = teacherDailySlots.get(`${primaryTeacher}_d${dB}`) || 0;

      if (countA > 0 && countA < 4 && countB === 0) return -1;
      if (countB > 0 && countB < 4 && countA === 0) return 1;
      return countA - countB;
    });

    for (let relaxation = 0; relaxation <= 2 && !assigned; relaxation++) {
      for (const d of sortedDays) {
        if (assigned) break;
        const maxSlotToday = (d === 5) ? Math.min(9, slotsPerDay) : slotsPerDay;

        for (let s = 1; s <= (maxSlotToday - task.blockSize + 1) && !assigned; s++) {
          let crossesRecess = false;
          for (let offset = 0; offset < task.blockSize; offset++) {
            const curS = s + offset;
            if (task.stage === 'STAGE_1' && curS === recessSlotGroup1) crossesRecess = true;
            if (task.stage === 'STAGE_2' && curS === recessSlotGroup2) crossesRecess = true;
            if (slotsPerDay === 13 && curS === lunchPrayerSlot) crossesRecess = true;
          }
          if (crossesRecess && task.blockSize > 1) continue;

          if (isPlacementValid(task, d, s, true, relaxation, true)) {
            assignTask(task, d, s, blockInstanceId);
            assigned = true;
          }
        }
      }
    }

    if (!assigned) {
      for (const d of sortedDays) {
        if (assigned) break;
        const maxSlotToday = (d === 5) ? Math.min(9, slotsPerDay) : slotsPerDay;

        for (let s = 1; s <= (maxSlotToday - task.blockSize + 1) && !assigned; s++) {
          let crossesRecess = false;
          for (let offset = 0; offset < task.blockSize; offset++) {
            const curS = s + offset;
            if (task.stage === 'STAGE_1' && curS === recessSlotGroup1) crossesRecess = true;
            if (task.stage === 'STAGE_2' && curS === recessSlotGroup2) crossesRecess = true;
            if (slotsPerDay === 13 && curS === lunchPrayerSlot) crossesRecess = true;
          }
          if (crossesRecess && task.blockSize > 1) continue;

          if (isPlacementValid(task, d, s, false, 0, false)) {
            assignTask(task, d, s, blockInstanceId);
            assigned = true;
          }
        }
      }
    }

    if (!assigned && adminConsecutiveLimit > 0 && adminConsecutiveLimit < 4) {
      for (let d = 1; d <= daysCount && !assigned; d++) {
        const maxSlotToday = (d === 5) ? Math.min(9, slotsPerDay) : slotsPerDay;

        for (let s = 1; s <= (maxSlotToday - task.blockSize + 1) && !assigned; s++) {
          let crossesRecess = false;
          for (let offset = 0; offset < task.blockSize; offset++) {
            const curS = s + offset;
            if (task.stage === 'STAGE_1' && curS === recessSlotGroup1) crossesRecess = true;
            if (task.stage === 'STAGE_2' && curS === recessSlotGroup2) crossesRecess = true;
            if (slotsPerDay === 13 && curS === lunchPrayerSlot) crossesRecess = true;
          }
          if (crossesRecess && task.blockSize > 1) continue;

          if (isPlacementValid(task, d, s, false, 0, false)) {
            assignTask(task, d, s, blockInstanceId);
            assigned = true;
            diagnostics.push(`Pelepasan kecemasan diaktifkan bagi ${task.subDemands[0].subjectName} (${task.classId}).`);
          }
        }
      }
    }

    if (!assigned) {
      diagnostics.push(`Kekurangan slot bagi ${task.subDemands[0].subjectName} (${task.classId}).`);
    }
  }

  function assignTask(t: SchedulingTask, d: number, s: number, blockId: string) {
    for (let offset = 0; offset < t.blockSize; offset++) {
      const actualSlot = s + offset;
      const slotKey = `d${d}_s${actualSlot}`;

      classOccupancy.set(`${t.classId}_${slotKey}`, t.subDemands[0].subjectCode);

      for (const sub of t.subDemands) {
        if (sub.teacherId && sub.teacherId !== 'ALL_TEACHERS') {
          teacherOccupancy.set(`${sub.teacherId}_${slotKey}`, t.classId);
          const tDayKey = `${sub.teacherId}_d${d}`;
          teacherDailySlots.set(tDayKey, (teacherDailySlots.get(tDayKey) || 0) + 1);
        }
        if (sub.roomId) {
          const cur = roomOccupancy.get(`${sub.roomId}_${slotKey}`) || 0;
          roomOccupancy.set(`${sub.roomId}_${slotKey}`, cur + 1);
        }

        const dailyKey = `${t.classId}_d${d}_${sub.subjectCode}`;
        classDailySubjectSlots.set(dailyKey, (classDailySubjectSlots.get(dailyKey) || 0) + 1);

        entries.push({
          id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          timetableId: 'master',
          classId: t.classId,
          timeSlotId: slotKey,
          subjectId: sub.subjectCode,
          teacherId: sub.teacherId || 'TIADA_GURU',
          roomId: sub.roomId,
          parallelGroupId: t.isParallel ? 'PI_PM' : null,
          blockInstanceId: blockId,
          isLocked: false,
          isNilam: Boolean(t.isNilam),
        });
      }
    }
    placedSlotsCount += t.blockSize;
  }

  const executionTimeMs = Date.now() - startTime;

  return {
    success: diagnostics.length === 0,
    entries,
    clashCount: diagnostics.length,
    totalSlotsRequired: totalSlotsRequired + classes.length,
    totalSlotsPlaced: placedSlotsCount + entries.filter(e => e.isLocked).length,
    teacherClashes: 0,
    roomClashes: 0,
    parallelMismatches: 0,
    executionTimeMs,
    diagnostics,
  };
}