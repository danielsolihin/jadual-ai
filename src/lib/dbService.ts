// src/lib/dbService.ts
import { supabase } from './supabase';
import { 
  TimeGridConfigState, 
  TeacherFormState, 
  RoomFormState, 
  ClassCohortConfig 
} from '@/types/timetable';

// Pembantu pengesahan format UUID PostgreSQL
function isValidUUID(id?: string | null): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// Pembantu penjanaan UUID sah (Standard Web Crypto API)
function ensureUUID(id?: string | null): string {
  if (isValidUUID(id)) return id!;
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Pengganti sandaran jika crypto tidak tersedia
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// 1. SIMPAN ATAU KEMAS KINI PROFIL SEKOLAH & GRID (Langkah 1 & 2)
export async function syncSchoolProfileToDb(profile: any, grid: TimeGridConfigState) {
  const payload = {
    school_name: profile.name || profile.schoolName || 'Sekolah Kebangsaan',
    school_code: profile.code || profile.schoolCode || '',
    state_group: profile.stateGroup || 'GROUP_B',
    session_year: profile.sessionYear || '2026/2027',
    total_daily_slots: Number(grid.totalDailySlots) || 10,
    slot_duration_minutes: Number(grid.slotDurationMinutes) || 30,
    morning_start_time: grid.morningStartTime || '07:30',
    recess_mode: grid.recessMode || 'SINGLE',
    recess_group1_slot: Number(grid.recessGroup1Slot) || 5,
    recess_group2_slot: Number(grid.recessGroup2Slot) || 6,
    lunch_prayer_slot: Number(grid.lunchPrayerSlot) || 11,
    max_consecutive_slots: Number(grid.maxConsecutiveSlots) || 3,
    friday_max_slots: Number(grid.fridayMaxSlots) || 2,
    cocurricular_config: grid.cocurricularConfig || { enabled: true, day: 3, startSlot: 8, slotCount: 2 },
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase.from('school_profiles').select('id').limit(1).maybeSingle();

  if (existing?.id) {
    const { data, error } = await supabase.from('school_profiles').update(payload).eq('id', existing.id).select().single();
    if (error) {
      console.error('Ralat syncSchoolProfileToDb (Update):', error.message || error);
      throw error;
    }
    return data;
  } else {
    const { data, error } = await supabase.from('school_profiles').insert([payload]).select().single();
    if (error) {
      console.error('Ralat syncSchoolProfileToDb (Insert):', error.message || error);
      throw error;
    }
    return data;
  }
}

// 2. SIMPAN SENARAI GURU (Langkah 3)
export async function syncTeachersToDb(teachers: TeacherFormState[]) {
  if (!teachers || teachers.length === 0) return [];

  const rows = teachers.map(t => ({
    id: ensureUUID(t.id),
    code: t.code,
    full_name: (t as any).fullName || (t as any).full_name || (t as any).name || 'Guru',
    role: t.role || 'NORMAL',
    max_weekly_slots: Number(t.maxWeeklySlots) ?? 26,
    max_daily_slots: Number(t.maxDailySlots) ?? 6,
    available_days: t.availableDays || [1, 2, 3, 4, 5],
    unavailable_days: t.unavailableDays || [],
    is_special_leave: Boolean(t.isSpecialLeave),
  }));

  const { data, error } = await supabase
    .from('teachers')
    .upsert(rows, { onConflict: 'code' })
    .select();

  if (error) {
    console.error('Ralat syncTeachersToDb:', error.message || error.details || error);
    throw new Error(error.message || 'Gagal menyimpan senarai guru');
  }
  return data;
}

// 3. SIMPAN SENARAI BILIK (Langkah 3)
export async function syncRoomsToDb(rooms: RoomFormState[]) {
  if (!rooms || rooms.length === 0) return [];

  const rows = rooms.map(r => ({
    id: ensureUUID(r.id),
    code: r.code,
    name: r.name,
    room_type: r.roomType || (r as any).room_type || 'CLASSROOM',
    capacity: Number(r.capacity) || 40,
  }));

  const { data, error } = await supabase
    .from('rooms')
    .upsert(rows, { onConflict: 'code' })
    .select();

  if (error) {
    console.error('Ralat syncRoomsToDb:', error.message || error.details || error);
    throw new Error(error.message || 'Gagal menyimpan senarai bilik');
  }
  return data;
}

// 4. SIMPAN KELAS & DEMANDS SUBJEK (Langkah 3 & 4)
export async function syncClassesAndDemandsToDb(classesList: ClassCohortConfig[]) {
  if (!classesList || classesList.length === 0) return [];

  for (const c of classesList) {
    const classId = ensureUUID(c.id);

    const classPayload: any = {
      id: classId,
      name: c.name,
      year_level: Number(c.yearLevel || c.gradeLevel) || 1,
      grade_level: Number(c.gradeLevel || c.yearLevel) || 1,
      academic_stage: c.academicStage || 'STAGE_1',
      homeroom_id: isValidUUID(c.homeroomId) ? c.homeroomId : null,
    };

    const { data: savedClass, error: classErr } = await supabase
      .from('classes')
      .upsert([classPayload], { onConflict: 'name' })
      .select('id')
      .single();

    if (classErr) {
      console.error('Ralat syncClasses (Kelas):', classErr.message || classErr);
      continue;
    }

    const actualClassId = savedClass?.id || classId;

    // Bersihkan tuntutan subjek lama bagi kelas ini sebelum menyuntik senarai terkini
    await supabase.from('class_subject_demands').delete().eq('class_id', actualClassId);

    if (c.demands && c.demands.length > 0) {
      const demandsRows = c.demands.map(d => ({
        id: ensureUUID(d.id),
        class_id: actualClassId,
        subject_code: d.code,
        subject_name: d.name || d.code,
        weekly_slots: Number(d.weeklySlots) || 0,
        assigned_teacher_id: isValidUUID(d.assignedTeacherId) ? d.assignedTeacherId : null,
        required_room_type: d.requiredRoomType || 'CLASSROOM',
        is_prime_time_priority: Boolean(d.isPrimeTimePriority),
        is_parallel: Boolean(d.isParallel),
        parallel_sync_key: d.parallelSyncKey || null,
        teacher_allocations: d.teacherAllocations || [],
        allowed_days: d.allowedDays || [1, 2, 3, 4, 5],
      }));

      const { error: demandErr } = await supabase.from('class_subject_demands').insert(demandsRows);
      if (demandErr) {
        console.error('Ralat syncClasses (Demands):', demandErr.message || demandErr);
      }
    }
  }
}