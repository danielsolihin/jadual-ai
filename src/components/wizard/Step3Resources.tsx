// src/components/wizard/Step3Resources.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  TeacherFormState, 
  RoomFormState, 
  TeacherRole,
  ClassCohortConfig,
  SubjectDemand
} from '@/types/timetable';
import { supabase } from '@/lib/supabase';
import styles from './Step3Resources.module.css';
import { 
  Users, 
  DoorOpen, 
  Layers, 
  Library,
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  X, 
  Check, 
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Link2,
  Loader2,
  CheckSquare,
  Square
} from 'lucide-react';

export interface PredefinedSubject {
  code: string;
  name: string;
  defaultSlots: number;
  category: 'CORE_ACADEMIC' | 'DINIYAH_RELIGIOUS' | 'ELECTIVE' | 'SPECIAL';
  requiredRoomType: string;
  isParallel?: boolean;
  parallelSyncKey?: string;
}

const INITIAL_SUBJECT_REGISTRY: PredefinedSubject[] = [
  { code: 'BM', name: 'Bahasa Melayu', defaultSlots: 10, category: 'CORE_ACADEMIC', requiredRoomType: 'CLASSROOM' },
  { code: 'BI', name: 'Bahasa Inggeris', defaultSlots: 8, category: 'CORE_ACADEMIC', requiredRoomType: 'CLASSROOM' },
  { code: 'MAT', name: 'Matematik', defaultSlots: 6, category: 'CORE_ACADEMIC', requiredRoomType: 'CLASSROOM' },
  { code: 'SN', name: 'Sains', defaultSlots: 4, category: 'CORE_ACADEMIC', requiredRoomType: 'LAB' },
  { code: 'PI', name: 'Pendidikan Islam', defaultSlots: 5, category: 'DINIYAH_RELIGIOUS', requiredRoomType: 'SURAU', isParallel: true, parallelSyncKey: 'PI_PM' },
  { code: 'PM', name: 'Pendidikan Moral', defaultSlots: 5, category: 'CORE_ACADEMIC', requiredRoomType: 'CLASSROOM', isParallel: true, parallelSyncKey: 'PI_PM' },
  { code: 'PJK', name: 'Pendidikan Jasmani & Kesihatan', defaultSlots: 3, category: 'SPECIAL', requiredRoomType: 'FIELD' },
  { code: 'PSV', name: 'Pendidikan Seni Visual', defaultSlots: 2, category: 'ELECTIVE', requiredRoomType: 'CLASSROOM' },
  { code: 'MZ', name: 'Pendidikan Muzik', defaultSlots: 1, category: 'ELECTIVE', requiredRoomType: 'CLASSROOM' },
  { code: 'RBT', name: 'Reka Bentuk & Teknologi', defaultSlots: 2, category: 'ELECTIVE', requiredRoomType: 'CLASSROOM' },
  { code: 'SEJ', name: 'Sejarah', defaultSlots: 2, category: 'CORE_ACADEMIC', requiredRoomType: 'CLASSROOM' },
  { code: 'BA', name: 'Bahasa Arab', defaultSlots: 3, category: 'DINIYAH_RELIGIOUS', requiredRoomType: 'CLASSROOM' },
  { code: 'TQS', name: 'Tilawah & Hifz Al-Quran', defaultSlots: 4, category: 'DINIYAH_RELIGIOUS', requiredRoomType: 'SURAU' },
  { code: 'ULUM', name: "Ulum Syar'iyyah", defaultSlots: 3, category: 'DINIYAH_RELIGIOUS', requiredRoomType: 'CLASSROOM' },
  { code: 'SIR', name: 'Sirah Nabawiyyah', defaultSlots: 2, category: 'DINIYAH_RELIGIOUS', requiredRoomType: 'CLASSROOM' },
  { code: 'ADAB', name: 'Adab & Akhlak Islamiah', defaultSlots: 2, category: 'DINIYAH_RELIGIOUS', requiredRoomType: 'CLASSROOM' },
];

interface Props {
  teachers?: TeacherFormState[];
  setTeachers?: React.Dispatch<React.SetStateAction<TeacherFormState[]>> | ((teachers: TeacherFormState[]) => void);
  rooms?: RoomFormState[];
  setRooms?: React.Dispatch<React.SetStateAction<RoomFormState[]>> | ((rooms: RoomFormState[]) => void);
  classes?: ClassCohortConfig[];
  setClasses?: React.Dispatch<React.SetStateAction<ClassCohortConfig[]>> | ((classes: ClassCohortConfig[]) => void);
  subjectRegistry?: PredefinedSubject[];
  setSubjectRegistry?: React.Dispatch<React.SetStateAction<PredefinedSubject[]>> | ((subs: PredefinedSubject[]) => void);
  onNext?: (data?: any) => void;
  onBack?: () => void;
  stateGroup?: string;
  timeGridConfig?: any;
  [key: string]: any;
}

const ROLE_OPTIONS: Array<{
  value: TeacherRole | string;
  label: string;
  defaultWeekly: number;
  defaultDaily: number;
  defaultFriday: number;
  isLeave: boolean;
  badgeColor: { bg: string; text: string; border: string };
}> = [
  { 
    value: 'NORMAL', 
    label: 'Guru Biasa (22-28 Waktu)', 
    defaultWeekly: 26, 
    defaultDaily: 6, 
    defaultFriday: 2, 
    isLeave: false,
    badgeColor: { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' }
  },
  { 
    value: 'ADMIN_PK', 
    label: 'Pentadbir / GPK (8-12 Waktu)', 
    defaultWeekly: 12, 
    defaultDaily: 3, 
    defaultFriday: 2, 
    isLeave: false,
    badgeColor: { bg: '#ede9fe', text: '#6d28d9', border: '#ddd6fe' }
  },
  { 
    value: 'COUNSELOR', 
    label: 'Guru Bimbingan & Kaunseling (0-2 Waktu)', 
    defaultWeekly: 2, 
    defaultDaily: 1, 
    defaultFriday: 0, 
    isLeave: false,
    badgeColor: { bg: '#fef3c7', text: '#b45309', border: '#fde68a' }
  },
  { 
    value: 'LEAVE_MATERNITY', 
    label: 'Cuti Bersalin (CK - 0 Waktu)', 
    defaultWeekly: 0, 
    defaultDaily: 0, 
    defaultFriday: 0, 
    isLeave: true,
    badgeColor: { bg: '#fce7f3', text: '#be185d', border: '#fbcfe8' }
  },
  { 
    value: 'LEAVE_PILGRIMAGE', 
    label: 'Cuti Haji / Umrah (CK - 0 Waktu)', 
    defaultWeekly: 0, 
    defaultDaily: 0, 
    defaultFriday: 0, 
    isLeave: true,
    badgeColor: { bg: '#ffedd5', text: '#c2410c', border: '#fed7aa' }
  },
  { 
    value: 'LEAVE_MEDICAL', 
    label: 'Rawatan Kesihatan Berpanjangan (CK - 0 Waktu)', 
    defaultWeekly: 0, 
    defaultDaily: 0, 
    defaultFriday: 0, 
    isLeave: true,
    badgeColor: { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca' }
  },
  { 
    value: 'LEAVE_STUDY', 
    label: 'Cuti Belajar / Kursus Panjang (CK - 0 Waktu)', 
    defaultWeekly: 0, 
    defaultDaily: 0, 
    defaultFriday: 0, 
    isLeave: true,
    badgeColor: { bg: '#f3e8ff', text: '#7e22ce', border: '#e9d5ff' }
  },
  { 
    value: 'LEAVE_OTHER', 
    label: 'Cuti Khas Lain (CK - 0 Waktu)', 
    defaultWeekly: 0, 
    defaultDaily: 0, 
    defaultFriday: 0, 
    isLeave: true,
    badgeColor: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' }
  },
];

const isLeaveRole = (role?: string) => {
  return Boolean(role && (role.startsWith('LEAVE_') || role.includes('CK')));
};

const normalizeTeacher = (t: TeacherFormState): TeacherFormState => {
  const isLeave = isLeaveRole(t.role as string) || Boolean(t.isSpecialLeave);
  const opt = ROLE_OPTIONS.find(r => r.value === t.role) || ROLE_OPTIONS[0];

  const maxWeekly = isLeave 
    ? 0 
    : (t.maxWeeklySlots !== undefined && t.maxWeeklySlots !== null ? t.maxWeeklySlots : opt.defaultWeekly);

  const maxDaily = isLeave 
    ? 0 
    : (t.maxDailySlots && t.maxDailySlots > 0 ? t.maxDailySlots : opt.defaultDaily);

  const maxFriday = isLeave 
    ? 0 
    : (t.fridayMaxSlots !== undefined && t.fridayMaxSlots !== null ? t.fridayMaxSlots : opt.defaultFriday);

  const availableDays = Array.isArray(t.availableDays) && t.availableDays.length > 0
    ? t.availableDays
    : (Array.isArray(t.unavailableDays) 
        ? [1, 2, 3, 4, 5].filter(d => !t.unavailableDays!.includes(d))
        : [1, 2, 3, 4, 5]);

  const unavailableDays = Array.isArray(t.unavailableDays)
    ? t.unavailableDays
    : [1, 2, 3, 4, 5].filter(d => !availableDays.includes(d));

  return {
    ...t,
    maxWeeklySlots: maxWeekly,
    maxDailySlots: maxDaily,
    fridayMaxSlots: maxFriday,
    isSpecialLeave: isLeave,
    availableDays,
    unavailableDays,
  };
};

export default function Step3Resources(props: Props) {
  const {
    teachers = [],
    setTeachers,
    rooms = [],
    setRooms,
    onNext,
    onBack,
  } = props;

  // 4 TAB NAVIGASI UTAMA
  const [activeTab, setActiveTab] = useState<'TEACHERS' | 'ROOMS' | 'CLASSES' | 'SUBJECTS'>('CLASSES');

  const [teachersList, setTeachersList] = useState<TeacherFormState[]>(() => 
    (teachers || []).map(normalizeTeacher)
  );
  const [roomsList, setRoomsList] = useState<RoomFormState[]>(rooms || []);
  const [classesList, setClassesList] = useState<ClassCohortConfig[]>(() => {
    let savedHomerooms: Record<string, string> = {};
    if (typeof window !== 'undefined') {
      try {
        savedHomerooms = JSON.parse(localStorage.getItem('timetable_saved_homerooms') || '{}');
      } catch (e) {}
    }
    const base = props.classes && Array.isArray(props.classes) ? props.classes : [];
    return base.map(c => ({
      ...c,
      homeroomId: c.homeroomId || savedHomerooms[c.id] || (c.name ? savedHomerooms[c.name] : undefined) || undefined
    }));
  });

  const [subjectsList, setSubjectsList] = useState<PredefinedSubject[]>(() => {
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
            base.forEach(s => map.set(s.code, s));
            parsed.forEach(s => map.set(s.code, s));
            return Array.from(map.values());
          }
        }
      } catch (e) {}
    }
    return base;
  });

  const [isSubmittingClass, setIsSubmittingClass] = useState(false);
  const [isSubmittingSubject, setIsSubmittingSubject] = useState(false);

  // STATE UNTUK KOTAK PILIHAN (CHECKBOX SELECT ALL)
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [selectedSubjectCodes, setSelectedSubjectCodes] = useState<string[]>([]);

  // STATE UNTUK MODAL SUNTING (EDIT)
  const [editingTeacher, setEditingTeacher] = useState<TeacherFormState | null>(null);
  const [editingRoom, setEditingRoom] = useState<RoomFormState | null>(null);
  const [editingClass, setEditingClass] = useState<ClassCohortConfig | null>(null);
  const [editingSubject, setEditingSubject] = useState<PredefinedSubject | null>(null);

  // 1. AUTO-FETCH DATA DARI SUPABASE PADA AWAL LOAD (DENGAN SUNTIKAN BILIK ASAS KEKAL)
  useEffect(() => {
    async function loadDataFromSupabase() {
      try {
        // A. Muat turun subjek
        const { data: dbSubjects, error: subErr } = await supabase
          .from('subjects')
          .select('*')
          .order('name', { ascending: true });

        if (!subErr && dbSubjects && dbSubjects.length > 0) {
          const formattedSubs: PredefinedSubject[] = dbSubjects.map((s: any) => ({
            code: s.code || s.subject_code,
            name: s.name || s.subject_name,
            defaultSlots: Number(s.default_slots ?? s.defaultSlots ?? 2),
            category: s.category || 'CORE_ACADEMIC',
            requiredRoomType: s.required_room_type || s.requiredRoomType || 'CLASSROOM',
            isParallel: Boolean(s.is_parallel ?? s.isParallel),
            parallelSyncKey: s.parallel_sync_key || s.parallelSyncKey || undefined,
          }));

          setSubjectsList(prev => {
            const map = new Map<string, PredefinedSubject>();
            INITIAL_SUBJECT_REGISTRY.forEach(item => map.set(item.code, item));
            prev.forEach(item => map.set(item.code, item));
            formattedSubs.forEach(item => map.set(item.code, item));
            const merged = Array.from(map.values());
            if (typeof props.setSubjectRegistry === 'function') {
              try { (props.setSubjectRegistry as any)(merged); } catch (e) {}
            }
            if (typeof window !== 'undefined') {
              try { localStorage.setItem('timetable_custom_subjects', JSON.stringify(merged)); } catch (e) {}
            }
            return merged;
          });
        }
      } catch (err) {
        console.warn('Ralat sambungan database subjects:', err);
      }

      // B. Muat turun kelas beserta sandaran bilik asas
      try {
        const { data: dbClasses, error: classErr } = await supabase
          .from('classes')
          .select('*, class_subject_demands(*)');

        if (classErr) {
          console.error('Ralat membaca kelas dari Supabase:', classErr.message);
          return;
        }

        if (dbClasses && dbClasses.length > 0) {
          let savedHomerooms: Record<string, string> = {};
          if (typeof window !== 'undefined') {
            try {
              savedHomerooms = JSON.parse(localStorage.getItem('timetable_saved_homerooms') || '{}');
            } catch (e) {}
          }

          const formatted: ClassCohortConfig[] = dbClasses.map((c: any) => {
            const resolvedHomeroom = c.homeroom_id || c.room_id || savedHomerooms[c.id] || savedHomerooms[c.name] || undefined;

            return {
              id: c.id,
              name: c.name,
              gradeLevel: c.grade_level ?? c.year_level ?? 1,
              yearLevel: c.year_level ?? c.grade_level ?? 1,
              academicStage: c.academic_stage || ((c.grade_level || c.year_level || 1) <= 3 ? 'STAGE_1' : 'STAGE_2'),
              homeroomId: resolvedHomeroom,
              demands: (c.class_subject_demands || []).map((d: any) => ({
                id: d.id,
                code: d.subject_code,
                name: d.subject_name,
                weeklySlots: d.weekly_slots,
                assignedTeacherId: d.assigned_teacher_id,
                requiredRoomType: d.required_room_type,
                isPrimeTimePriority: d.is_prime_time_priority,
                isParallel: d.is_parallel,
                parallelSyncKey: d.parallel_sync_key,
                teacherAllocations: d.teacher_allocations || [],
                allowedDays: d.allowed_days || [1, 2, 3, 4, 5],
              })),
            };
          });

          setClassesList(formatted);
          if (typeof props.setClasses === 'function') {
            (props.setClasses as any)(formatted);
          }
          if (typeof props.onUpdateClasses === 'function') {
            props.onUpdateClasses(formatted);
          }
        }
      } catch (err) {
        console.error('Ralat sambungan database classes:', err);
      }
    }

    loadDataFromSupabase();
  }, []);

  useEffect(() => {
    if (props.teachers && Array.isArray(props.teachers) && props.teachers.length > 0) {
      setTeachersList(props.teachers.map(normalizeTeacher));
    }
  }, [props.teachers]);

  useEffect(() => {
    if (props.rooms && Array.isArray(props.rooms) && props.rooms.length > 0) {
      setRoomsList(props.rooms);
    }
  }, [props.rooms]);

  useEffect(() => {
    if (props.classes && Array.isArray(props.classes) && props.classes.length > 0) {
      let savedHomerooms: Record<string, string> = {};
      if (typeof window !== 'undefined') {
        try {
          savedHomerooms = JSON.parse(localStorage.getItem('timetable_saved_homerooms') || '{}');
        } catch (e) {}
      }
      setClassesList(props.classes.map(c => ({
        ...c,
        homeroomId: c.homeroomId || savedHomerooms[c.id] || (c.name ? savedHomerooms[c.name] : undefined) || undefined
      })));
    }
  }, [props.classes]);

  useEffect(() => {
    if (props.subjectRegistry && Array.isArray(props.subjectRegistry) && props.subjectRegistry.length > 0) {
      setSubjectsList(prev => {
        const map = new Map<string, PredefinedSubject>();
        INITIAL_SUBJECT_REGISTRY.forEach(s => map.set(s.code, s));
        prev.forEach(s => map.set(s.code, s));
        props.subjectRegistry!.forEach(s => map.set(s.code, s));
        return Array.from(map.values());
      });
    }
  }, [props.subjectRegistry]);

  const commitTeachers = (updated: TeacherFormState[]) => {
    const normalized = updated.map(normalizeTeacher);
    setTeachersList(normalized);
    if (typeof setTeachers === 'function') {
      try {
        (setTeachers as any)(normalized);
      } catch (err) {
        console.warn('Gagal memanggil setTeachers prop:', err);
      }
    }
    if (typeof props.onUpdateTeachers === 'function') {
      props.onUpdateTeachers(normalized);
    }
    if (typeof props.onUpdate === 'function') {
      props.onUpdate({ teachers: normalized, rooms: roomsList, classes: classesList, subjects: subjectsList });
    }
  };

  const commitRooms = (updated: RoomFormState[]) => {
    setRoomsList(updated);
    if (typeof setRooms === 'function') {
      try {
        (setRooms as any)(updated);
      } catch (err) {
        console.warn('Gagal memanggil setRooms prop:', err);
      }
    }
    if (typeof props.onUpdateRooms === 'function') {
      props.onUpdateRooms(updated);
    }
    if (typeof props.onUpdate === 'function') {
      props.onUpdate({ teachers: teachersList, rooms: updated, classes: classesList, subjects: subjectsList });
    }
  };

  const commitClasses = (updated: ClassCohortConfig[]) => {
    setClassesList(updated);
    if (typeof props.setClasses === 'function') {
      try {
        (props.setClasses as any)(updated);
      } catch (err) {
        console.warn('Gagal memanggil setClasses prop:', err);
      }
    }
    if (typeof props.onUpdateClasses === 'function') {
      props.onUpdateClasses(updated);
    }
    if (typeof props.onUpdate === 'function') {
      props.onUpdate({ teachers: teachersList, rooms: roomsList, classes: updated, subjects: subjectsList });
    }
  };

  const commitSubjects = (updated: PredefinedSubject[]) => {
    setSubjectsList(updated);
    if (typeof props.setSubjectRegistry === 'function') {
      try {
        (props.setSubjectRegistry as any)(updated);
      } catch (err) {
        console.warn('Gagal memanggil setSubjectRegistry prop:', err);
      }
    }
    if (typeof props.onUpdate === 'function') {
      props.onUpdate({ teachers: teachersList, rooms: roomsList, classes: classesList, subjects: updated });
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('timetable_custom_subjects', JSON.stringify(updated));
      } catch (e) {}
    }
  };

  const isGroupA = props.stateGroup === 'GROUP_A' || (props.timeGridConfig && props.timeGridConfig.stateGroup === 'GROUP_A');
  
  const dayPills = useMemo(() => {
    return isGroupA
      ? [
          { day: 1, label: 'A', name: 'Ahad' },
          { day: 2, label: 'I', name: 'Isnin' },
          { day: 3, label: 'S', name: 'Selasa' },
          { day: 4, label: 'R', name: 'Rabu' },
          { day: 5, label: 'K', name: 'Khamis' },
        ]
      : [
          { day: 1, label: 'I', name: 'Isnin' },
          { day: 2, label: 'S', name: 'Selasa' },
          { day: 3, label: 'R', name: 'Rabu' },
          { day: 4, label: 'K', name: 'Khamis' },
          { day: 5, label: 'J', name: 'Jumaat' },
        ];
  }, [isGroupA]);

  const lastDayLabel = isGroupA ? 'Had Khamis' : 'Had Jumaat';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'ALL' | 'ACTIVE' | 'LEAVE' | 'ADMIN'>('ALL');

  // State Guru
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<string>('NORMAL');
  const [newSubjects, setNewSubjects] = useState('');
  const [newMaxWeekly, setNewMaxWeekly] = useState<number>(26);
  const [newMaxDaily, setNewMaxDaily] = useState<number>(6);
  const [newMaxFriday, setNewMaxFriday] = useState<number>(2);
  const [newAvailableDays, setNewAvailableDays] = useState<number[]>([1, 2, 3, 4, 5]);

  // State Bilik
  const [newRoomCode, setNewRoomCode] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState<string>('CLASSROOM');

  // State Kelas Pengajian
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('');
  const [newClassHomeroomId, setNewClassHomeroomId] = useState('');

  // State Bank Subjek
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubSlots, setNewSubSlots] = useState(2);
  const [newSubCategory, setNewSubCategory] = useState<'CORE_ACADEMIC' | 'DINIYAH_RELIGIOUS' | 'ELECTIVE' | 'SPECIAL'>('CORE_ACADEMIC');
  const [newSubRoom, setNewSubRoom] = useState<string>('CLASSROOM');
  const [newSubIsParallel, setNewSubIsParallel] = useState(false);
  const [newSubParallelKey, setNewSubParallelKey] = useState('');

  const formatNameWithCkTag = (name: string, isLeave: boolean): string => {
    let clean = (name || '').replace(/\s*\(CK\)\s*/gi, '').trim();
    return isLeave ? `${clean} (CK)` : clean;
  };

  const handleRoleChangeForNew = (roleVal: string) => {
    setNewRole(roleVal);
    const opt = ROLE_OPTIONS.find(r => r.value === roleVal);
    if (opt) {
      setNewMaxWeekly(opt.defaultWeekly);
      setNewMaxDaily(opt.defaultDaily);
      setNewMaxFriday(opt.defaultFriday);
      if (newName) {
        setNewName(formatNameWithCkTag(newName, opt.isLeave));
      }
    }
  };

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) {
      alert('Sila masukkan Kod Guru dan Nama Penuh.');
      return;
    }

    const opt = ROLE_OPTIONS.find(r => r.value === newRole);
    const isLeave = Boolean(opt?.isLeave);
    const finalizedName = formatNameWithCkTag(newName, isLeave);

    const teacherObj: TeacherFormState = {
      id: `t_${Date.now()}`,
      code: newCode.trim().toUpperCase(),
      fullName: finalizedName,
      role: newRole,
      subjectCodes: newSubjects.split(',').map(s => s.trim().toUpperCase()).filter(Boolean),
      maxWeeklySlots: isLeave ? 0 : (Number(newMaxWeekly) || opt?.defaultWeekly || 26),
      maxDailySlots: isLeave ? 0 : (Number(newMaxDaily) || opt?.defaultDaily || 6),
      fridayMaxSlots: isLeave ? 0 : (Number(newMaxFriday) || opt?.defaultFriday || 2),
      isSpecialLeave: isLeave,
      availableDays: newAvailableDays,
      unavailableDays: [1, 2, 3, 4, 5].filter(d => !newAvailableDays.includes(d)),
    };

    commitTeachers([...teachersList, teacherObj]);
    setNewCode('');
    setNewName('');
    setNewRole('NORMAL');
    setNewSubjects('');
    setNewMaxWeekly(26);
    setNewMaxDaily(6);
    setNewMaxFriday(2);
    setNewAvailableDays([1, 2, 3, 4, 5]);
  };

  const handleOpenEditModal = (t: TeacherFormState) => {
    const opt = ROLE_OPTIONS.find(r => r.value === t.role) || ROLE_OPTIONS[0];
    const isL = isLeaveRole(t.role as string);

    const currentDays = Array.isArray(t.availableDays) && t.availableDays.length > 0
      ? t.availableDays
      : (Array.isArray(t.unavailableDays)
          ? [1, 2, 3, 4, 5].filter(d => !t.unavailableDays!.includes(d))
          : [1, 2, 3, 4, 5]);

    setEditingTeacher({
      ...t,
      code: t.code || '',
      fullName: t.fullName || '',
      role: t.role || 'NORMAL',
      subjectCodes: t.subjectCodes || [],
      maxWeeklySlots: isL ? 0 : (t.maxWeeklySlots ?? opt.defaultWeekly),
      maxDailySlots: isL ? 0 : (t.maxDailySlots && t.maxDailySlots > 0 ? t.maxDailySlots : opt.defaultDaily),
      fridayMaxSlots: isL ? 0 : (t.fridayMaxSlots ?? opt.defaultFriday),
      availableDays: currentDays,
      unavailableDays: [1, 2, 3, 4, 5].filter(d => !currentDays.includes(d)),
    });
  };

  const handleSaveEditTeacher = () => {
    if (!editingTeacher) return;
    const isLeave = isLeaveRole(editingTeacher.role as string);
    const finalizedName = formatNameWithCkTag(editingTeacher.fullName || '', isLeave);

    const updatedAvailableDays = editingTeacher.availableDays || [1, 2, 3, 4, 5];
    const updatedUnavailableDays = [1, 2, 3, 4, 5].filter(d => !updatedAvailableDays.includes(d));

    const updated = teachersList.map(t => {
      if (t.id === editingTeacher.id) {
        return {
          ...editingTeacher,
          fullName: finalizedName,
          isSpecialLeave: isLeave,
          maxWeeklySlots: isLeave ? 0 : (Number(editingTeacher.maxWeeklySlots) || 0),
          maxDailySlots: isLeave ? 0 : (Number(editingTeacher.maxDailySlots) || 0),
          fridayMaxSlots: isLeave ? 0 : (Number(editingTeacher.fridayMaxSlots) || 0),
          availableDays: updatedAvailableDays,
          unavailableDays: updatedUnavailableDays,
        };
      }
      return t;
    });

    commitTeachers(updated);
    setEditingTeacher(null);
  };

  const handleDeleteTeacher = (id: string, name: string) => {
    if (confirm(`Adakah anda pasti ingin memadam rekod guru: ${name}?`)) {
      const updated = teachersList.filter(t => t.id !== id);
      commitTeachers(updated);
    }
  };

  // PENGURUSAN BILIK & SUNTING BILIK
  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomCode.trim() || !newRoomName.trim()) {
      alert('Sila masukkan Kod Bilik dan Nama Bilik.');
      return;
    }

    const roomObj: RoomFormState = {
      id: `r_${Date.now()}`,
      code: newRoomCode.trim().toUpperCase(),
      name: newRoomName.trim(),
      roomType: newRoomType as any,
      capacity: 35,
    };

    commitRooms([...roomsList, roomObj]);
    setNewRoomCode('');
    setNewRoomName('');
    setNewRoomType('CLASSROOM');
  };

  const handleSaveEditRoom = () => {
    if (!editingRoom) return;
    const updated = roomsList.map(r => r.id === editingRoom.id ? editingRoom : r);
    commitRooms(updated);
    setEditingRoom(null);
  };

  const handleDeleteRoom = (id: string, name: string) => {
    if (confirm(`Padam bilik: ${name}?`)) {
      const updated = roomsList.filter(r => r.id !== id);
      commitRooms(updated);
    }
  };

  // CHECKBOX SELECTION HANDLERS BAGI BILIK
  const handleToggleSelectAllRooms = () => {
    if (selectedRoomIds.length === roomsList.length) {
      setSelectedRoomIds([]);
    } else {
      setSelectedRoomIds(roomsList.map(r => r.id));
    }
  };

  const handleToggleSelectRoom = (id: string) => {
    setSelectedRoomIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // PENGURUSAN KELAS & SUNTING KELAS (DENGAN PENYIMPANAN KEKAL BILIK ASAS)
  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !newClassGrade) {
      alert('Sila masukkan Nama Kelas dan pilih Gred / Tingkatan.');
      return;
    }

    let gradeNum = 1;
    let stage: 'STAGE_1' | 'STAGE_2' = 'STAGE_1';

    if (newClassGrade.startsWith('Tahun ')) {
      gradeNum = parseInt(newClassGrade.replace('Tahun ', ''), 10) || 1;
      stage = gradeNum <= 3 ? 'STAGE_1' : 'STAGE_2';
    } else if (newClassGrade.startsWith('Tingkatan ')) {
      gradeNum = (parseInt(newClassGrade.replace('Tingkatan ', ''), 10) || 1) + 6;
      stage = 'STAGE_2';
    } else {
      gradeNum = 1;
      stage = 'STAGE_1';
    }

    const defaultDemands: SubjectDemand[] = [
      { code: 'BM', name: 'Bahasa Melayu', weeklySlots: 10, requiredRoomType: 'CLASSROOM', isPrimeTimePriority: true, allowedDays: [1,2,3,4,5] },
      { code: 'BI', name: 'Bahasa Inggeris', weeklySlots: 8, requiredRoomType: 'CLASSROOM', isPrimeTimePriority: true, allowedDays: [1,2,3,4,5] },
      { code: 'MAT', name: 'Matematik', weeklySlots: 6, requiredRoomType: 'CLASSROOM', isPrimeTimePriority: true, allowedDays: [1,2,3,4,5] },
      { code: 'SN', name: 'Sains', weeklySlots: 4, requiredRoomType: 'LAB', isPrimeTimePriority: false, allowedDays: [1,2,3,4,5] },
      { code: 'PI', name: 'Pendidikan Islam', weeklySlots: 5, requiredRoomType: 'SURAU', isPrimeTimePriority: false, allowedDays: [1,2,3,4,5] },
      { code: 'PJK', name: 'Pendidikan Jasmani & Kesihatan', weeklySlots: 3, requiredRoomType: 'FIELD', isPrimeTimePriority: false, allowedDays: [1,2,3,4,5] },
      { code: 'PSV', name: 'Pendidikan Seni Visual', weeklySlots: 2, requiredRoomType: 'CLASSROOM', isPrimeTimePriority: false, allowedDays: [1,2,3,4,5] },
      { code: 'PERH', name: 'Perhimpunan Rasmi', weeklySlots: 1, requiredRoomType: 'CLASSROOM', isPrimeTimePriority: true, allowedDays: [1] },
    ];

    setIsSubmittingClass(true);

    try {
      const homeroomVal = newClassHomeroomId && newClassHomeroomId.trim() !== '' ? newClassHomeroomId.trim() : null;

      const payload: any = {
        name: newClassName.trim(),
        grade_level: gradeNum,
        year_level: gradeNum,
        academic_stage: stage,
        homeroom_id: homeroomVal,
      };

      const { data: savedClass, error: classErr } = await supabase
        .from('classes')
        .insert([payload])
        .select()
        .single();

      if (classErr) {
        if (classErr.code === '23505') {
          alert(`Kelas dengan nama "${newClassName.trim()}" telah pun wujud.`);
          return;
        }
        throw classErr;
      }

      const createdId = savedClass.id;

      // Sandarkan ke LocalStorage
      if (typeof window !== 'undefined' && homeroomVal) {
        try {
          const cache = JSON.parse(localStorage.getItem('timetable_saved_homerooms') || '{}');
          cache[createdId] = homeroomVal;
          cache[newClassName.trim()] = homeroomVal;
          localStorage.setItem('timetable_saved_homerooms', JSON.stringify(cache));
        } catch (e) {}
      }

      const demandsPayload = defaultDemands.map(d => ({
        class_id: createdId,
        subject_code: d.code,
        subject_name: d.name || d.code,
        weekly_slots: Number(d.weeklySlots) || 0,
        required_room_type: d.requiredRoomType || 'CLASSROOM',
        is_prime_time_priority: Boolean(d.isPrimeTimePriority),
        is_parallel: Boolean(d.isParallel),
        allowed_days: d.allowedDays || [1, 2, 3, 4, 5],
      }));

      await supabase.from('class_subject_demands').insert(demandsPayload);

      const newClassObj: ClassCohortConfig = {
        id: createdId,
        name: newClassName.trim(),
        gradeLevel: gradeNum,
        yearLevel: gradeNum,
        academicStage: stage,
        homeroomId: homeroomVal || undefined,
        demands: defaultDemands,
      };

      const updated = [...classesList, newClassObj];
      commitClasses(updated);

      setNewClassName('');
      setNewClassGrade('');
      setNewClassHomeroomId('');
      alert(`Kelas "${newClassObj.name}" berjaya disimpan ke pangkalan data Supabase!`);
    } catch (err: any) {
      console.error('Ralat simpan kelas ke database:', err);
      alert(`Gagal menyimpan kelas: ${err.message || 'Sila cuba lagi'}`);
    } finally {
      setIsSubmittingClass(false);
    }
  };

  // =========================================================================
  // FUNGSI SUNTING KELAS: MENJAMIN BILIK ASAS TERSIMPAN KEKAL DI SUPABASE & STORAGE
  // =========================================================================
  const handleSaveEditClass = async () => {
    if (!editingClass) return;

    const homeroomVal = editingClass.homeroomId && editingClass.homeroomId.trim() !== ''
      ? editingClass.homeroomId.trim()
      : null;

    try {
      if (editingClass.id) {
        // Kemas kini terus ke pangkalan data Supabase
        const { error: err1 } = await supabase.from('classes').update({
          name: editingClass.name.trim(),
          grade_level: editingClass.gradeLevel,
          year_level: editingClass.yearLevel,
          academic_stage: editingClass.academicStage,
          homeroom_id: homeroomVal,
        }).eq('id', editingClass.id);

        if (err1) {
          // Cubaan sandaran jika skema menggunakan nama lajur room_id
          await supabase.from('classes').update({
            name: editingClass.name.trim(),
            grade_level: editingClass.gradeLevel,
            year_level: editingClass.yearLevel,
            academic_stage: editingClass.academicStage,
            room_id: homeroomVal,
          }).eq('id', editingClass.id);
        }
      }
    } catch (err) {
      console.warn('Amaran kemaskini kelas di database:', err);
    }

    // Sandaran ke LocalStorage supaya pasti tidak hilang semasa muat semula (refresh)
    if (typeof window !== 'undefined') {
      try {
        const cache = JSON.parse(localStorage.getItem('timetable_saved_homerooms') || '{}');
        if (editingClass.id) cache[editingClass.id] = homeroomVal || '';
        if (editingClass.name) cache[editingClass.name] = homeroomVal || '';
        localStorage.setItem('timetable_saved_homerooms', JSON.stringify(cache));
      } catch (e) {}
    }

    const updated = classesList.map(c => 
      c.id === editingClass.id ? { ...editingClass, homeroomId: homeroomVal || undefined } : c
    );
    commitClasses(updated);
    setEditingClass(null);
    alert('Penetapan bilik kelas berjaya dikemaskini dan disimpan kekal!');
  };

  const handleDeleteClass = async (id?: string, name?: string) => {
    if (!id) return;
    if (confirm(`Adakah anda pasti ingin memadam kelas "${name}" daripada pangkalan data?`)) {
      try {
        await supabase.from('class_subject_demands').delete().eq('class_id', id);
        const { error } = await supabase.from('classes').delete().eq('id', id);
        if (error) throw error;

        const updated = classesList.filter(c => c.id !== id);
        commitClasses(updated);
      } catch (err: any) {
        console.error('Ralat padam kelas dari Supabase:', err);
        alert(`Gagal memadam kelas: ${err.message || 'Ralat'}`);
      }
    }
  };

  // CHECKBOX SELECTION HANDLERS BAGI KELAS
  const handleToggleSelectAllClasses = () => {
    if (selectedClassIds.length === classesList.length) {
      setSelectedClassIds([]);
    } else {
      setSelectedClassIds(classesList.map(c => c.id || ''));
    }
  };

  const handleToggleSelectClass = (id: string) => {
    setSelectedClassIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // PENGURUSAN SUBJEK & SUNTING SUBJEK
  const handleAddSubjectToBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim() || !newSubCode.trim()) {
      alert('Sila lengkapkan Nama dan Kod Subjek.');
      return;
    }

    const codeUpper = newSubCode.trim().toUpperCase();
    if (subjectsList.some(s => s.code === codeUpper)) {
      alert(`Kod subjek "${codeUpper}" telah sedia ada dalam Bank Subjek.`);
      return;
    }

    const newSub: PredefinedSubject = {
      code: codeUpper,
      name: newSubName.trim(),
      defaultSlots: Number(newSubSlots) || 2,
      category: newSubCategory,
      requiredRoomType: newSubRoom,
      isParallel: newSubIsParallel,
      parallelSyncKey: newSubIsParallel ? (newSubParallelKey.trim().toUpperCase() || `${codeUpper}_GROUP`) : undefined,
    };

    setIsSubmittingSubject(true);

    try {
      const payload = {
        code: newSub.code,
        name: newSub.name,
        default_slots: newSub.defaultSlots,
        category: newSub.category,
        required_room_type: newSub.requiredRoomType,
        is_parallel: newSub.isParallel,
        parallel_sync_key: newSub.parallelSyncKey || null,
      };

      const { error: subErr } = await supabase
        .from('subjects')
        .upsert([payload], { onConflict: 'code' });

      if (subErr) {
        console.warn('Ralat upsert jadual subjects, mencuba arahan insert biasa:', subErr.message);
        await supabase.from('subjects').insert([payload]);
      }
    } catch (err: any) {
      console.warn('Amaran sambungan pangkalan data subjects:', err?.message || err);
    } finally {
      setIsSubmittingSubject(false);
    }

    const updated = [...subjectsList, newSub];
    commitSubjects(updated);

    setNewSubName('');
    setNewSubCode('');
    setNewSubSlots(2);
    setNewSubIsParallel(false);
    setNewSubParallelKey('');
    alert(`Subjek ${newSub.name} (${newSub.code}) berjaya disimpan dan didaftarkan ke Bank Subjek!`);
  };

  const handleSaveEditSubject = async () => {
    if (!editingSubject) return;
    try {
      await supabase.from('subjects').upsert([{
        code: editingSubject.code,
        name: editingSubject.name,
        default_slots: editingSubject.defaultSlots,
        category: editingSubject.category,
        required_room_type: editingSubject.requiredRoomType,
        is_parallel: editingSubject.isParallel,
        parallel_sync_key: editingSubject.parallelSyncKey || null
      }], { onConflict: 'code' });
    } catch (err) {
      console.warn('Ralat kemaskini subjek di database:', err);
    }
    const updated = subjectsList.map(s => s.code === editingSubject.code ? editingSubject : s);
    commitSubjects(updated);
    setEditingSubject(null);
  };

  const handleDeleteSubjectFromBank = async (code: string, name: string) => {
    if (confirm(`Padam subjek "${name}" (${code}) daripada Bank Subjek?`)) {
      try {
        await supabase.from('subjects').delete().eq('code', code);
      } catch (delErr) {
        console.warn('Ralat padam subjek dari Supabase:', delErr);
      }
      const updated = subjectsList.filter(s => s.code !== code);
      commitSubjects(updated);
    }
  };

  // CHECKBOX SELECTION HANDLERS BAGI SUBJEK
  const handleToggleSelectAllSubjects = () => {
    if (selectedSubjectCodes.length === subjectsList.length) {
      setSelectedSubjectCodes([]);
    } else {
      setSelectedSubjectCodes(subjectsList.map(s => s.code));
    }
  };

  const handleToggleSelectSubject = (code: string) => {
    setSelectedSubjectCodes(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  };

  const handleBackNavigation = () => {
    if (typeof onBack === 'function') {
      onBack();
    }
  };

  const handleNextNavigation = () => {
    if (typeof onNext === 'function') {
      onNext({ 
        teachers: teachersList, 
        rooms: roomsList, 
        classes: classesList, 
        subjects: subjectsList 
      });
    }
  };

  const filteredTeachers = useMemo(() => {
    return teachersList.filter(t => {
      const q = (searchQuery || '').toLowerCase();
      const matchSearch = (t.code || '').toLowerCase().includes(q) || 
                          (t.fullName || '').toLowerCase().includes(q) ||
                          (t.subjectCodes && t.subjectCodes.some(s => s.toLowerCase().includes(q)));

      if (!matchSearch) return false;

      const isLeave = isLeaveRole(t.role as string);
      if (filterRole === 'ACTIVE') return !isLeave;
      if (filterRole === 'LEAVE') return isLeave;
      if (filterRole === 'ADMIN') return t.role === 'ADMIN_PK';
      return true;
    });
  }, [teachersList, searchQuery, filterRole]);

  const countLeave = teachersList.filter(t => isLeaveRole(t.role as string)).length;
  const countAdmin = teachersList.filter(t => t.role === 'ADMIN_PK').length;
  const countNormal = teachersList.length - countLeave - countAdmin;

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

        {/* HEADER LANGKAH */}
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
              Langkah 3 daripada 6
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
              Direktori Guru, Fasiliti, Kelas & Bank Subjek ({isGroupA ? 'Kumpulan A: Ahad - Khamis' : 'Kumpulan B: Isnin - Jumaat'})
            </span>
          </div>

          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.3px' }}>
            Pangkalan Tenaga Pengajar, Fasiliti, Kelas & Bank Subjek
          </h1>
          <p style={{ fontSize: '0.80rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
            Daftarkan guru dengan status khusus, tetapkan hari mengajar guru ({isGroupA ? 'Ahad hingga Khamis' : 'Isnin hingga Jumaat'}), bilik PdP, cipta kelas pengajian, serta urus Bank Subjek sekolah dengan pantas.
          </p>
        </div>

        {/* SUIS TAB BERSEPADU */}
        <div style={{
          display: 'inline-flex',
          background: '#f1f5f9',
          padding: '3px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '2px'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('TEACHERS')}
            style={{
              padding: '0.45rem 1.1rem',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              backgroundColor: activeTab === 'TEACHERS' ? '#2563eb' : 'transparent',
              color: activeTab === 'TEACHERS' ? '#ffffff' : '#64748b',
              boxShadow: activeTab === 'TEACHERS' ? '0 2px 6px rgba(37,99,235,0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Users size={14} />
            <span>Senarai Guru ({teachersList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ROOMS')}
            style={{
              padding: '0.45rem 1.1rem',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              backgroundColor: activeTab === 'ROOMS' ? '#2563eb' : 'transparent',
              color: activeTab === 'ROOMS' ? '#ffffff' : '#64748b',
              boxShadow: activeTab === 'ROOMS' ? '0 2px 6px rgba(37,99,235,0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <DoorOpen size={14} />
            <span>Bilik Darjah & Fasiliti ({roomsList.length})</span>
          </button>

          {/* TAB 3: KELAS PENGAJIAN */}
          <button
            type="button"
            onClick={() => setActiveTab('CLASSES')}
            style={{
              padding: '0.45rem 1.1rem',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              backgroundColor: activeTab === 'CLASSES' ? '#2563eb' : 'transparent',
              color: activeTab === 'CLASSES' ? '#ffffff' : '#64748b',
              boxShadow: activeTab === 'CLASSES' ? '0 2px 6px rgba(37,99,235,0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Layers size={14} />
            <span>Kelas Pengajian ({classesList.length})</span>
          </button>

          {/* TAB 4: BANK SUBJEK SEKOLAH */}
          <button
            type="button"
            onClick={() => setActiveTab('SUBJECTS')}
            style={{
              padding: '0.45rem 1.1rem',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              backgroundColor: activeTab === 'SUBJECTS' ? '#2563eb' : 'transparent',
              color: activeTab === 'SUBJECTS' ? '#ffffff' : '#64748b',
              boxShadow: activeTab === 'SUBJECTS' ? '0 2px 6px rgba(37,99,235,0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Library size={14} />
            <span>Bank Subjek Sekolah ({subjectsList.length})</span>
          </button>
        </div>

        {/* TAB 1: SENARAI GURU */}
        {activeTab === 'TEACHERS' && (
          <div>
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.75rem' }}>
                <Plus size={15} color="#2563eb" />
                <strong style={{ fontSize: '0.82rem', color: '#0f172a' }}>Daftar Guru Baharu</strong>
              </div>

              <form onSubmit={handleAddTeacher}>
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1.6fr 1.6fr 1.1fr', gap: '0.65rem', marginBottom: '0.65rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>Kod Guru:</label>
                    <input
                      type="text"
                      placeholder="Cth: G08"
                      value={newCode || ''}
                      onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                      style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', textTransform: 'uppercase', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>Nama Penuh:</label>
                    <input
                      type="text"
                      placeholder="Cth: Pn. Fadilah Binti Ariffin"
                      value={newName || ''}
                      onChange={(e) => setNewName(e.target.value)}
                      style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>Status / Jawatan:</label>
                    <select
                      value={newRole || 'NORMAL'}
                      onChange={(e) => handleRoleChangeForNew(e.target.value)}
                      style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', background: '#ffffff', boxSizing: 'border-box' }}
                    >
                      {ROLE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>Opsyen Subjek:</label>
                    <input
                      type="text"
                      placeholder="Cth: BM, MAT"
                      value={newSubjects || ''}
                      onChange={(e) => setNewSubjects(e.target.value.toUpperCase())}
                      style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 110px) 1fr 130px', gap: '0.65rem', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>Had Minggu:</label>
                    <input
                      type="number"
                      min={0}
                      max={36}
                      value={newMaxWeekly ?? 0}
                      disabled={isLeaveRole(newRole)}
                      onChange={(e) => setNewMaxWeekly(Number(e.target.value) || 0)}
                      style={{ width: '100%', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', background: isLeaveRole(newRole) ? '#f1f5f9' : '#ffffff', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>Had Sehari:</label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={newMaxDaily ?? 0}
                      disabled={isLeaveRole(newRole)}
                      onChange={(e) => setNewMaxDaily(Number(e.target.value) || 0)}
                      style={{ width: '100%', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', background: isLeaveRole(newRole) ? '#f1f5f9' : '#ffffff', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>{lastDayLabel}:</label>
                    <input
                      type="number"
                      min={0}
                      max={6}
                      value={newMaxFriday ?? 0}
                      disabled={isLeaveRole(newRole)}
                      onChange={(e) => setNewMaxFriday(Number(e.target.value) || 0)}
                      style={{ width: '100%', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', background: isLeaveRole(newRole) ? '#f1f5f9' : '#ffffff', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>
                      Hari Boleh Mengajar (Klik untuk sekat):
                    </label>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#ffffff', padding: '2px 5px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                      {dayPills.map(p => {
                        const isAllowed = newAvailableDays.includes(p.day);
                        return (
                          <button
                            key={p.day}
                            type="button"
                            onClick={() => {
                              if (isAllowed) {
                                if (newAvailableDays.length === 1) {
                                  alert('Guru mesti boleh mengajar sekurang-kurangnya 1 hari seminggu.');
                                  return;
                                }
                                setNewAvailableDays(newAvailableDays.filter(d => d !== p.day));
                              } else {
                                setNewAvailableDays([...newAvailableDays, p.day].sort((a, b) => a - b));
                              }
                            }}
                            title={`${p.name}: ${isAllowed ? 'Dibenarkan (Klik untuk sekat)' : 'Disekat (Klik untuk benarkan)'}`}
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
                      <span style={{ fontSize: '0.62rem', color: newAvailableDays.length === 5 ? '#16a34a' : '#ea580c', fontWeight: 600, marginLeft: '4px' }}>
                        {newAvailableDays.length === 5 ? '5 Hari' : `${newAvailableDays.length} Hari`}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <button
                      type="submit"
                      style={{
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.45rem 1.15rem',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: '0 2px 6px rgba(37,99,235,0.25)'
                      }}
                    >
                      <Plus size={14} /> Daftar Guru
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* BAR CARIAN & PENAPIS */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '0.6rem 0.85rem',
              marginBottom: '0.65rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.6rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', width: '240px' }}>
                  <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Cari kod, nama, subjek..."
                    value={searchQuery || ''}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '0.35rem 0.6rem 0.35rem 28px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.76rem', boxSizing: 'border-box' }}
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <X size={12} color="#94a3b8" />
                    </button>
                  )}
                </div>

                <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '2px', borderRadius: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setFilterRole('ALL')}
                    style={{
                      padding: '0.3rem 0.65rem',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      border: 'none',
                      background: filterRole === 'ALL' ? '#2563eb' : 'transparent',
                      color: filterRole === 'ALL' ? '#ffffff' : '#64748b',
                    }}
                  >
                    Semua ({teachersList.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterRole('ACTIVE')}
                    style={{
                      padding: '0.3rem 0.65rem',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      border: 'none',
                      background: filterRole === 'ACTIVE' ? '#2563eb' : 'transparent',
                      color: filterRole === 'ACTIVE' ? '#ffffff' : '#64748b',
                    }}
                  >
                    Aktif ({countNormal + countAdmin})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterRole('LEAVE')}
                    style={{
                      padding: '0.3rem 0.65rem',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      border: 'none',
                      background: filterRole === 'LEAVE' ? '#be185d' : '#ffffff',
                      color: filterRole === 'LEAVE' ? '#ffffff' : '#64748b',
                    }}
                  >
                    Cuti Khas (CK) ({countLeave})
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                Memaparkan <strong>{filteredTeachers.length}</strong> daripada <strong>{teachersList.length}</strong> orang guru
              </div>
            </div>

            {/* JADUAL SENARAI GURU */}
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
                    <th style={{ padding: '0.55rem 0.6rem', textAlign: 'center', width: '40px', fontWeight: 700, color: '#334155' }}>Bil.</th>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'left', width: '65px', fontWeight: 700, color: '#334155' }}>Kod</th>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'left', fontWeight: 700, color: '#334155' }}>Nama Penuh</th>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'left', width: '170px', fontWeight: 700, color: '#334155' }}>Status / Jawatan</th>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'left', width: '120px', fontWeight: 700, color: '#334155' }}>Opsyen Subjek</th>
                    <th style={{ padding: '0.55rem 0.6rem', textAlign: 'center', width: '90px', fontWeight: 700, color: '#334155' }}>Had Minggu</th>
                    <th style={{ padding: '0.55rem 0.6rem', textAlign: 'center', width: '80px', fontWeight: 700, color: '#334155' }}>Had Sehari</th>
                    <th style={{ padding: '0.55rem 0.6rem', textAlign: 'center', width: '85px', fontWeight: 700, color: '#334155' }}>{lastDayLabel}</th>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center', width: '150px', fontWeight: 700, color: '#334155' }}>Hari Bertugas</th>
                    <th style={{ padding: '0.55rem 0.6rem', textAlign: 'center', width: '85px', fontWeight: 700, color: '#334155' }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.map((t, idx) => {
                    const opt = ROLE_OPTIONS.find(r => r.value === t.role) || ROLE_OPTIONS[0];
                    const isLeave = isLeaveRole(t.role as string);

                    const weeklySlots = isLeave ? 0 : (t.maxWeeklySlots ?? opt.defaultWeekly);
                    const dailySlots = isLeave ? 0 : (t.maxDailySlots && t.maxDailySlots > 0 ? t.maxDailySlots : opt.defaultDaily);
                    const fridaySlots = isLeave ? 0 : (t.fridayMaxSlots ?? opt.defaultFriday);

                    const daysAllowed = (t.availableDays && t.availableDays.length > 0)
                      ? t.availableDays
                      : (t.unavailableDays ? [1, 2, 3, 4, 5].filter(d => !t.unavailableDays!.includes(d)) : [1, 2, 3, 4, 5]);

                    const blockedNames = dayPills.filter(p => !daysAllowed.includes(p.day)).map(p => p.name);

                    return (
                      <tr 
                        key={t.id} 
                        style={{ 
                          borderBottom: '1px solid #e2e8f0', 
                          background: isLeave ? '#fffafb' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc'),
                        }}
                      >
                        <td style={{ padding: '0.5rem 0.6rem', textAlign: 'center', color: '#64748b', fontWeight: 400 }}>
                          {idx + 1}.
                        </td>

                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 400, color: '#1e293b' }}>
                          {t.code}
                        </td>

                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 400, color: '#1e293b' }}>
                          <span>{t.fullName}</span>
                          {isLeave && (
                            <span style={{ marginLeft: '6px', fontSize: '0.64rem', fontWeight: 500, background: '#fce7f3', color: '#be185d', border: '1px solid #fbcfe8', padding: '1px 5px', borderRadius: '4px' }}>
                              CK
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '0.5rem 0.75rem' }}>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 500,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: opt.badgeColor.bg,
                            color: opt.badgeColor.text,
                            border: `1px solid ${opt.badgeColor.border}`,
                            display: 'inline-block'
                          }}>
                            {opt.label.split('(')[0].trim()}
                          </span>
                        </td>

                        <td style={{ padding: '0.5rem 0.75rem', color: '#475569', fontSize: '0.74rem', fontWeight: 400 }}>
                          {t.subjectCodes && t.subjectCodes.length > 0 ? t.subjectCodes.join(', ') : <span style={{ color: '#94a3b8' }}>-</span>}
                        </td>

                        <td style={{ padding: '0.5rem 0.6rem', textAlign: 'center', fontWeight: 400, color: isLeave ? '#be185d' : '#1e293b' }}>
                          {weeklySlots} waktu
                        </td>

                        <td style={{ padding: '0.5rem 0.6rem', textAlign: 'center', fontWeight: 400, color: '#475569' }}>
                          {dailySlots} waktu
                        </td>

                        <td style={{ padding: '0.5rem 0.6rem', textAlign: 'center', fontWeight: 400, color: '#475569' }}>
                          {fridaySlots} waktu
                        </td>

                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            {dayPills.map(p => {
                              const isAvail = daysAllowed.includes(p.day);
                              return (
                                <span
                                  key={p.day}
                                  title={`${p.name}: ${isAvail ? 'Boleh Mengajar' : 'Disekat / Cuti'}`}
                                  style={{
                                    width: '18px',
                                    height: '18px',
                                    fontSize: '0.62rem',
                                    fontWeight: isAvail ? 700 : 400,
                                    borderRadius: '3px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: isAvail ? '#eff6ff' : '#f1f5f9',
                                    color: isAvail ? '#1d4ed8' : '#cbd5e1',
                                    border: isAvail ? '1px solid #bfdbfe' : '1px dashed #e2e8f0',
                                  }}
                                >
                                  {p.label}
                                </span>
                              );
                            })}
                          </div>
                          {blockedNames.length > 0 && (
                            <div style={{ fontSize: '0.58rem', color: '#dc2626', fontWeight: 700, marginTop: '2px' }}>
                              Tiada: {blockedNames.join(', ')}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '0.5rem 0.6rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '5px' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(t)}
                              title="Sunting profil & hari bertugas guru"
                              style={{
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                color: '#1d4ed8',
                                padding: '3px 6px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center'
                              }}
                            >
                              <Edit3 size={12} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteTeacher(t.id, t.fullName)}
                              title="Padam rekod guru"
                              style={{
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                color: '#dc2626',
                                padding: '3px 6px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center'
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: BILIK DARJAH & FASILITI (UNBOLD & SELECT ALL & EDIT) */}
        {activeTab === 'ROOMS' && (
          <div>
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.75rem' }}>
                <Plus size={15} color="#2563eb" />
                <strong style={{ fontSize: '0.82rem', color: '#0f172a' }}>Tambah Bilik / Fasiliti PdP</strong>
              </div>

              <form onSubmit={handleAddRoom} style={{ display: 'grid', gridTemplateColumns: '120px 1.5fr 1.2fr 130px', gap: '0.65rem', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>Kod Bilik:</label>
                  <input
                    type="text"
                    placeholder="Cth: LAB1"
                    value={newRoomCode || ''}
                    onChange={(e) => setNewRoomCode(e.target.value.toUpperCase())}
                    style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', textTransform: 'uppercase', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>Nama Bilik / Fasiliti:</label>
                  <input
                    type="text"
                    placeholder="Cth: Makmal Sains 1"
                    value={newRoomName || ''}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>Jenis Fasiliti:</label>
                  <select
                    value={newRoomType || 'CLASSROOM'}
                    onChange={(e) => setNewRoomType(e.target.value)}
                    style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', background: '#ffffff', boxSizing: 'border-box' }}
                  >
                    <option value="CLASSROOM">Bilik Darjah Biasa</option>
                    <option value="LAB">Makmal Sains / Komputer</option>
                    <option value="LIBRARY">Pusat Sumber Sekolah (PSS)</option>
                    <option value="SURAU">Surau / Bilik Agama</option>
                    <option value="WORKSHOP">Bengkel RBT</option>
                    <option value="FIELD">Padang / Gelanggang Sukan</option>
                  </select>
                </div>

                <div>
                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      background: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 6px rgba(37,99,235,0.25)'
                    }}
                  >
                    <Plus size={14} /> Tambah Bilik
                  </button>
                </div>
              </form>
            </div>

            {/* JADUAL SENARAI BILIK */}
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
                    <th style={{ padding: '0.55rem 0.4rem', textAlign: 'center', width: '35px' }}>
                      <span onClick={handleToggleSelectAllRooms} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                        {selectedRoomIds.length > 0 && selectedRoomIds.length === roomsList.length ? (
                          <CheckSquare size={15} color="#2563eb" />
                        ) : (
                          <Square size={15} color="#94a3b8" />
                        )}
                      </span>
                    </th>
                    <th style={{ padding: '0.55rem 0.6rem', textAlign: 'center', width: '45px', fontWeight: 700, color: '#334155' }}>Bil.</th>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'left', width: '110px', fontWeight: 700, color: '#334155' }}>Kod</th>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'left', fontWeight: 700, color: '#334155' }}>Nama Bilik</th>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'left', width: '220px', fontWeight: 700, color: '#334155' }}>Jenis Fasiliti</th>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center', width: '100px', fontWeight: 700, color: '#334155' }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {roomsList.map((r, idx) => {
                    const isChecked = selectedRoomIds.includes(r.id);
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0', background: isChecked ? '#eff6ff' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc') }}>
                        <td style={{ padding: '0.5rem 0.4rem', textAlign: 'center' }}>
                          <span onClick={() => handleToggleSelectRoom(r.id)} style={{ cursor: 'pointer', display: 'inline-flex' }}>
                            {isChecked ? <CheckSquare size={15} color="#2563eb" /> : <Square size={15} color="#cbd5e1" />}
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem 0.6rem', textAlign: 'center', color: '#64748b', fontWeight: 400 }}>
                          {idx + 1}.
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 400, color: '#1e293b' }}>
                          {r.code}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 400, color: '#1e293b' }}>
                          {r.name}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem' }}>
                          <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '4px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontWeight: 400 }}>
                            {r.roomType}
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              type="button"
                              onClick={() => setEditingRoom(r)}
                              title="Sunting bilik"
                              style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', padding: '3px 6px', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRoom(r.id, r.name)}
                              title="Padam bilik"
                              style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '3px 6px', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: KELAS PENGAJIAN (DENGAN SUNTIKAN BILIK ASAS KEKAL) */}
        {activeTab === 'CLASSES' && (
          <div>
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.75rem' }}>
                <Plus size={15} color="#2563eb" />
                <strong style={{ fontSize: '0.82rem', color: '#0f172a' }}>Cipta Kelas Pengajian Baharu</strong>
              </div>

              <form onSubmit={handleAddClass} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr 1.3fr 130px', gap: '0.65rem', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>
                    Nama Kelas: <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Cth: 1 Amanah / Tingkatan 1 Arif"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div> 
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}> 
                    Gred / Tingkatan: <span style={{ color: '#ef4444' }}>*</span> 
                  </label> 
                  <select 
                    value={newClassGrade} 
                    onChange={(e) => setNewClassGrade(e.target.value)} 
                    style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', background: '#ffffff', boxSizing: 'border-box', fontWeight: 400 }} 
                    required 
                  > 
                    <option value="">-- Pilih Gred / Tingkatan --</option> 
                    <option value="Tahun 1">Tahun 1</option> 
                    <option value="Tahun 2">Tahun 2</option> 
                    <option value="Tahun 3">Tahun 3</option> 
                    <option value="Tahun 4">Tahun 4</option> 
                    <option value="Tahun 5">Tahun 5</option> 
                    <option value="Tahun 6">Tahun 6</option> 
                    <option disabled style={{ color: '#94a3b8' }}>___________________________________</option> 
                    <option value="Tingkatan 1">Tingkatan 1</option> 
                    <option value="Tingkatan 2">Tingkatan 2</option> 
                    <option value="Tingkatan 3">Tingkatan 3</option> 
                    <option value="Tingkatan 4">Tingkatan 4</option> 
                    <option value="Tingkatan 5">Tingkatan 5</option> 
                    <option value="Tingkatan 6">Tingkatan 6</option> 
                    <option disabled style={{ color: '#94a3b8' }}>___________________________________</option> 
                    <option value="Peralihan">Peralihan</option> 
                    <option value="Kelas Khas">Kelas Khas</option> 
                  </select> 
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>
                    Bilik Asas (Homeroom):
                  </label>
                  <select
                    value={newClassHomeroomId}
                    onChange={(e) => setNewClassHomeroomId(e.target.value)}
                    style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', background: '#ffffff', boxSizing: 'border-box' }}
                  >
                    <option value="">-- Pilih Bilik (Pilihan) --</option>
                    {roomsList.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isSubmittingClass}
                    style={{
                      width: '100%',
                      background: isSubmittingClass ? '#94a3b8' : '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: isSubmittingClass ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 6px rgba(37,99,235,0.25)'
                    }}
                  >
                    {isSubmittingClass ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    {isSubmittingClass ? 'Menyimpan...' : 'Cipta Kelas'}
                  </button>
                </div>
              </form>
            </div>

            {/* JADUAL KELAS PENGAJIAN */}
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
                    <th style={{ padding: '0.55rem 0.4rem', textAlign: 'center', width: '35px' }}>
                      <span onClick={handleToggleSelectAllClasses} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                        {selectedClassIds.length > 0 && selectedClassIds.length === classesList.length ? (
                          <CheckSquare size={15} color="#2563eb" />
                        ) : (
                          <Square size={15} color="#94a3b8" />
                        )}
                      </span>
                    </th>
                    <th style={{ padding: '0.55rem 0.6rem', textAlign: 'center', width: '45px', fontWeight: 700, color: '#334155' }}>Bil.</th>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'left', fontWeight: 700, color: '#334155' }}>Nama Kelas</th>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center', width: '130px', fontWeight: 700, color: '#334155' }}>Gred / Tingkatan</th>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center', width: '160px', fontWeight: 700, color: '#334155' }}>Peringkat Akademik</th>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'left', width: '220px', fontWeight: 700, color: '#334155' }}>Bilik Asas (Homeroom)</th>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center', width: '100px', fontWeight: 700, color: '#334155' }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {classesList.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        Tiada kelas pengajian dicipta lagi. Sila gunakan borang di atas untuk mendaftar kelas.
                      </td>
                    </tr>
                  ) : (
                    classesList.map((c, idx) => {
                      // Padanan pintar bilik asas (sama ada id, kod atau nama bilik)
                      const homeroom = roomsList.find(r => r.id === c.homeroomId || r.code === c.homeroomId || r.name === c.homeroomId);
                      const displayGrade = (c.gradeLevel || c.yearLevel) 
                        ? ((c.gradeLevel || c.yearLevel)! > 6 ? `Tingkatan ${(c.gradeLevel || c.yearLevel)! - 6}` : `Tahun ${c.gradeLevel || c.yearLevel}`)
                        : 'Lain-lain';
                      const isChecked = selectedClassIds.includes(c.id || '');

                      return (
                        <tr key={c.id || idx} style={{ borderBottom: '1px solid #e2e8f0', background: isChecked ? '#eff6ff' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc') }}>
                          <td style={{ padding: '0.5rem 0.4rem', textAlign: 'center' }}>
                            <span onClick={() => handleToggleSelectClass(c.id || '')} style={{ cursor: 'pointer', display: 'inline-flex' }}>
                              {isChecked ? <CheckSquare size={15} color="#2563eb" /> : <Square size={15} color="#cbd5e1" />}
                            </span>
                          </td>
                          <td style={{ padding: '0.5rem 0.6rem', textAlign: 'center', color: '#64748b', fontWeight: 400 }}>
                            {idx + 1}.
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', fontWeight: 400, color: '#1e293b' }}>
                            {c.name}
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.70rem', fontWeight: 400, padding: '2px 8px', borderRadius: '4px', background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>
                              {displayGrade}
                            </span>
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', color: '#475569', fontSize: '0.74rem', fontWeight: 400 }}>
                            {c.academicStage === 'STAGE_1' ? 'Tahap 1 (Rendah)' : c.academicStage === 'STAGE_2' ? 'Tahap 2 (Rendah)' : 'Menengah'}
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', color: '#334155', fontWeight: 400 }}>
                            {homeroom ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#0f172a', fontWeight: 600 }}>
                                <DoorOpen size={13} color="#16a34a" />
                                {homeroom.name}
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>- Tiada Bilik Asas -</span>
                            )}
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <button
                                type="button"
                                onClick={() => setEditingClass(c)}
                                title="Sunting kelas"
                                style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', padding: '3px 6px', borderRadius: '4px', cursor: 'pointer' }}
                              >
                                <Edit3 size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteClass(c.id, c.name)}
                                title="Padam kelas"
                                style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '3px 6px', borderRadius: '4px', cursor: 'pointer' }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: BANK SUBJEK SEKOLAH (UNBOLD & SELECT ALL & EDIT) */}
        {activeTab === 'SUBJECTS' && (
          <div>
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.75rem' }}>
                <Plus size={15} color="#2563eb" />
                <strong style={{ fontSize: '0.82rem', color: '#0f172a' }}>
                  + Daftar Subjek Baharu ke Bank Subjek Sekolah:
                </strong>
              </div>

              <form onSubmit={handleAddSubjectToBank} style={{ display: 'grid', gridTemplateColumns: '1.5fr 110px 80px 1.2fr 1.2fr 1.3fr 130px', gap: '0.65rem', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>Nama Subjek:</label>
                  <input
                    type="text"
                    placeholder="Cth: Fiqh Syafi'i / Arab"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>Kod Subjek:</label>
                  <input
                    type="text"
                    placeholder="CTH: FEQ_S"
                    value={newSubCode}
                    onChange={(e) => setNewSubCode(e.target.value.toUpperCase())}
                    style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>Slot (W):</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={newSubSlots}
                    onChange={(e) => setNewSubSlots(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', fontWeight: 700, textAlign: 'center', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>Kategori:</label>
                  <select
                    value={newSubCategory}
                    onChange={(e) => setNewSubCategory(e.target.value as any)}
                    style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.76rem', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                  >
                    <option value="CORE_ACADEMIC">Teras Akademik</option>
                    <option value="DINIYAH_RELIGIOUS">Diniyah / Agama</option>
                    <option value="ELECTIVE">Elektif / Seni</option>
                    <option value="SPECIAL">Khas / Amali</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>Bilik Wajib:</label>
                  <select
                    value={newSubRoom}
                    onChange={(e) => setNewSubRoom(e.target.value)}
                    style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.76rem', backgroundColor: '#ffffff', boxSizing: 'border-box' }}
                  >
                    <option value="CLASSROOM">Bilik Darjah</option>
                    <option value="LAB">Makmal Sains</option>
                    <option value="SURAU">Surau</option>
                    <option value="FIELD">Padang</option>
                    <option value="HALL">Dewan</option>
                    <option value="LIBRARY">Perpustakaan</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>Kongsi Masa (Selari):</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="checkbox"
                      checked={newSubIsParallel}
                      onChange={(e) => setNewSubIsParallel(e.target.checked)}
                      style={{ accentColor: '#7c3aed', cursor: 'pointer' }}
                    />
                    {newSubIsParallel ? (
                      <input
                        type="text"
                        placeholder="Kunci (cth: FIQH)"
                        value={newSubParallelKey}
                        onChange={(e) => setNewSubParallelKey(e.target.value.toUpperCase())}
                        style={{ width: '100%', padding: '0.3rem 0.4rem', borderRadius: '4px', border: '1px solid #c4b5fd', fontSize: '0.70rem', backgroundColor: '#faf5ff', fontWeight: 700, color: '#6d28d9' }}
                      />
                    ) : (
                      <span style={{ fontSize: '0.70rem', color: '#64748b' }}>Tunggal</span>
                    )}
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isSubmittingSubject}
                    style={{
                      width: '100%',
                      background: isSubmittingSubject ? '#94a3b8' : '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.45rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: isSubmittingSubject ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 6px rgba(37,99,235,0.25)'
                    }}
                  >
                    {isSubmittingSubject ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Simpan Subjek
                  </button>
                </div>
              </form>
            </div>

            {/* JADUAL BANK SUBJEK SEKOLAH */}
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
                    <th style={{ padding: '0.55rem 0.4rem', textAlign: 'center', width: '35px' }}>
                      <span onClick={handleToggleSelectAllSubjects} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                        {selectedSubjectCodes.length > 0 && selectedSubjectCodes.length === subjectsList.length ? (
                          <CheckSquare size={15} color="#2563eb" />
                        ) : (
                          <Square size={15} color="#94a3b8" />
                        )}
                      </span>
                    </th>
                    <th style={{ padding: '0.55rem 0.6rem', textAlign: 'center', width: '45px', fontWeight: 700, color: '#334155' }}>Bil.</th>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center', width: '85px', fontWeight: 700, color: '#334155' }}>Kod</th>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'left', fontWeight: 700, color: '#334155' }}>Nama Mata Pelajaran</th>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center', width: '90px', fontWeight: 700, color: '#334155' }}>Slot (W)</th>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center', width: '150px', fontWeight: 700, color: '#334155' }}>Kategori</th>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center', width: '120px', fontWeight: 700, color: '#334155' }}>Bilik Wajib</th>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center', width: '130px', fontWeight: 700, color: '#334155' }}>Ketetapan Selari</th>
                    <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center', width: '100px', fontWeight: 700, color: '#334155' }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectsList.map((s, idx) => {
                    const isChecked = selectedSubjectCodes.includes(s.code);
                    return (
                      <tr key={s.code || idx} style={{ borderBottom: '1px solid #e2e8f0', background: isChecked ? '#eff6ff' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc') }}>
                        <td style={{ padding: '0.5rem 0.4rem', textAlign: 'center' }}>
                          <span onClick={() => handleToggleSelectSubject(s.code)} style={{ cursor: 'pointer', display: 'inline-flex' }}>
                            {isChecked ? <CheckSquare size={15} color="#2563eb" /> : <Square size={15} color="#cbd5e1" />}
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem 0.6rem', textAlign: 'center', color: '#64748b', fontWeight: 400 }}>
                          {idx + 1}.
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 400, color: '#1e40af' }}>
                          {s.code}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 400, color: '#0f172a' }}>
                          {s.name}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 400, color: '#0284c7' }}>
                          {s.defaultSlots} W
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.70rem', fontWeight: 400, padding: '2px 8px', borderRadius: '4px', background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0' }}>
                            {s.category}
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', color: '#475569', fontWeight: 400 }}>
                          {s.requiredRoomType}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                          {s.isParallel ? (
                            <span style={{ fontSize: '0.68rem', fontWeight: 400, padding: '2px 6px', borderRadius: '4px', background: '#ede9fe', color: '#6d28d9', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <Link2 size={10} /> {s.parallelSyncKey || 'SELARI'}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              type="button"
                              onClick={() => setEditingSubject(s)}
                              title="Sunting subjek"
                              style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', padding: '3px 6px', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSubjectFromBank(s.code, s.name)}
                              title="Padam subjek"
                              style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '3px 6px', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
            onClick={handleNextNavigation}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '0.55rem 1.4rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 6px rgba(37,99,235,0.3)',
              transition: 'background-color 0.15s ease'
            }}
          >
            <span>Seterusnya: Agihan Kurikulum & Kelas</span>
            <ArrowRight size={16} />
          </button>
        </div>

      </div>

      {/* MODAL SUNTING GURU */}
      {editingTeacher && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', maxWidth: '540px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={17} color="#2563eb" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Kemaskini Profil Guru: {editingTeacher.code || ''}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingTeacher(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={16} color="#94a3b8" />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.15rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>Kod Guru:</label>
                  <input
                    type="text"
                    value={editingTeacher.code || ''}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, code: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.80rem', textTransform: 'uppercase', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>Nama Penuh:</label>
                  <input
                    type="text"
                    value={editingTeacher.fullName || ''}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, fullName: e.target.value })}
                    style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.80rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>Status / Jawatan:</label>
                <select
                  value={editingTeacher.role || 'NORMAL'}
                  onChange={(e) => {
                    const newR = e.target.value as TeacherRole;
                    const opt = ROLE_OPTIONS.find(r => r.value === newR);
                    const isL = Boolean(opt?.isLeave);

                    setEditingTeacher({
                      ...editingTeacher,
                      role: newR,
                      isSpecialLeave: isL,
                      maxWeeklySlots: isL ? 0 : (opt?.defaultWeekly || 26),
                      maxDailySlots: isL ? 0 : (opt?.defaultDaily || 6),
                      fridayMaxSlots: isL ? 0 : (opt?.defaultFriday || 2),
                      fullName: formatNameWithCkTag(editingTeacher.fullName || '', isL)
                    });
                  }}
                  style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.80rem', background: '#ffffff', fontWeight: 600, boxSizing: 'border-box' }}
                >
                  {ROLE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>Opsyen Subjek (asingkan dengan koma):</label>
                <input
                  type="text"
                  value={editingTeacher.subjectCodes ? editingTeacher.subjectCodes.join(', ') : ''}
                  onChange={(e) => setEditingTeacher({
                    ...editingTeacher,
                    subjectCodes: e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
                  })}
                  style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.80rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>Had Mingguan:</label>
                  <input
                    type="number"
                    min={0}
                    max={36}
                    value={editingTeacher.maxWeeklySlots ?? 0}
                    disabled={isLeaveRole(editingTeacher.role as string)}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, maxWeeklySlots: Number(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>Had Sehari:</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={editingTeacher.maxDailySlots ?? 0}
                    disabled={isLeaveRole(editingTeacher.role as string)}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, maxDailySlots: Number(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>{lastDayLabel}:</label>
                  <input
                    type="number"
                    min={0}
                    max={6}
                    value={editingTeacher.fridayMaxSlots ?? 0}
                    disabled={isLeaveRole(editingTeacher.role as string)}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, fridayMaxSlots: Number(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* HARI BERTUGAS MENGIKUT KUMPULAN NEGERI */}
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, marginBottom: '3px', color: '#1e40af' }}>
                  🗓️ Hari Boleh Mengajar / Bertugas:
                </label>
                <p style={{ fontSize: '0.68rem', color: '#64748b', margin: '0 0 6px 0' }}>
                  Klik butang hari untuk benarkan (Biru) atau sekat guru daripada mengajar (Kelabu):
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {dayPills.map(p => {
                    const currentDays = editingTeacher.availableDays || [1, 2, 3, 4, 5];
                    const isAvail = currentDays.includes(p.day);

                    return (
                      <button
                        key={p.day}
                        type="button"
                        onClick={() => {
                          let nextDays: number[];
                          if (isAvail) {
                            if (currentDays.length === 1) {
                              alert('Guru mesti boleh mengajar sekurang-kurangnya satu hari seminggu.');
                              return;
                            }
                            nextDays = currentDays.filter(d => d !== p.day);
                          } else {
                            nextDays = [...currentDays, p.day].sort((a, b) => a - b);
                          }
                          setEditingTeacher({
                            ...editingTeacher,
                            availableDays: nextDays,
                            unavailableDays: [1, 2, 3, 4, 5].filter(d => !nextDays.includes(d)),
                          });
                        }}
                        style={{
                          flex: 1,
                          padding: '0.35rem 0',
                          fontSize: '0.72rem',
                          fontWeight: isAvail ? 700 : 400,
                          borderRadius: '6px',
                          border: isAvail ? '1.5px solid #2563eb' : '1px dashed #cbd5e1',
                          background: isAvail ? '#2563eb' : '#ffffff',
                          color: isAvail ? '#ffffff' : '#94a3b8',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {p.name} ({p.label})
                      </button>
                    );
                  })}
                </div>
              </div>

              {isLeaveRole(editingTeacher.role as string) && (
                <div style={{ background: '#fdf2f8', border: '1px solid #fbcfe8', padding: '0.5rem 0.75rem', borderRadius: '6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <AlertCircle size={15} color="#be185d" />
                  <div style={{ fontSize: '0.74rem', color: '#9d174d' }}>
                    <strong>Status Cuti Khas Aktif:</strong> Had waktu dikunci ke <strong>0 waktu</strong> dan tag <strong>(CK)</strong> ditambah secara automatik.
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setEditingTeacher(null)}
                style={{ padding: '0.4rem 0.9rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSaveEditTeacher}
                style={{ padding: '0.4rem 1.15rem', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#ffffff', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Check size={14} /> Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUNTING BILIK */}
      {editingRoom && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', maxWidth: '480px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={17} color="#2563eb" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Kemaskini Bilik / Fasiliti
                </h3>
              </div>
              <button type="button" onClick={() => setEditingRoom(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={16} color="#94a3b8" />
              </button>
            </div>
            <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.15rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>Kod Bilik:</label>
                <input
                  type="text"
                  value={editingRoom.code}
                  onChange={(e) => setEditingRoom({ ...editingRoom, code: e.target.value.toUpperCase() })}
                  style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.80rem', textTransform: 'uppercase', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>Nama Bilik:</label>
                <input
                  type="text"
                  value={editingRoom.name}
                  onChange={(e) => setEditingRoom({ ...editingRoom, name: e.target.value })}
                  style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.80rem', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>Jenis Fasiliti:</label>
                <select
                  value={editingRoom.roomType}
                  onChange={(e) => setEditingRoom({ ...editingRoom, roomType: e.target.value as any })}
                  style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.80rem', background: '#ffffff', boxSizing: 'border-box' }}
                >
                  <option value="CLASSROOM">Bilik Darjah Biasa</option>
                  <option value="LAB">Makmal Sains / Komputer</option>
                  <option value="LIBRARY">Pusat Sumber Sekolah (PSS)</option>
                  <option value="SURAU">Surau / Bilik Agama</option>
                  <option value="WORKSHOP">Bengkel RBT</option>
                  <option value="FIELD">Padang / Gelanggang Sukan</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
              <button type="button" onClick={() => setEditingRoom(null)} style={{ padding: '0.4rem 0.9rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                Batal
              </button>
              <button type="button" onClick={handleSaveEditRoom} style={{ padding: '0.4rem 1.15rem', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#ffffff', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUNTING KELAS: DILENGKAPKAN DENGAN PEMILIHAN BILIK & GRED */}
      {editingClass && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', maxWidth: '480px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={17} color="#2563eb" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Kemaskini Kelas Pengajian
                </h3>
              </div>
              <button type="button" onClick={() => setEditingClass(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={16} color="#94a3b8" />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.15rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>Nama Kelas:</label>
                <input
                  type="text"
                  value={editingClass.name}
                  onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                  style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.80rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>Gred / Tingkatan:</label>
                <select
                  value={
                    (editingClass.gradeLevel || editingClass.yearLevel)
                      ? ((editingClass.gradeLevel || editingClass.yearLevel)! > 6
                          ? `Tingkatan ${(editingClass.gradeLevel || editingClass.yearLevel)! - 6}`
                          : `Tahun ${editingClass.gradeLevel || editingClass.yearLevel}`)
                      : 'Tahun 1'
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    let gNum = 1;
                    let st: 'STAGE_1' | 'STAGE_2' = 'STAGE_1';
                    if (val.startsWith('Tahun ')) {
                      gNum = parseInt(val.replace('Tahun ', ''), 10) || 1;
                      st = gNum <= 3 ? 'STAGE_1' : 'STAGE_2';
                    } else if (val.startsWith('Tingkatan ')) {
                      gNum = (parseInt(val.replace('Tingkatan ', ''), 10) || 1) + 6;
                      st = 'STAGE_2';
                    }
                    setEditingClass({
                      ...editingClass,
                      gradeLevel: gNum,
                      yearLevel: gNum,
                      academicStage: st
                    });
                  }}
                  style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', background: '#ffffff', boxSizing: 'border-box' }}
                >
                  <option value="Tahun 1">Tahun 1</option>
                  <option value="Tahun 2">Tahun 2</option>
                  <option value="Tahun 3">Tahun 3</option>
                  <option value="Tahun 4">Tahun 4</option>
                  <option value="Tahun 5">Tahun 5</option>
                  <option value="Tahun 6">Tahun 6</option>
                  <option disabled style={{ color: '#94a3b8' }}>___________________________________</option>
                  <option value="Tingkatan 1">Tingkatan 1</option>
                  <option value="Tingkatan 2">Tingkatan 2</option>
                  <option value="Tingkatan 3">Tingkatan 3</option>
                  <option value="Tingkatan 4">Tingkatan 4</option>
                  <option value="Tingkatan 5">Tingkatan 5</option>
                  <option value="Tingkatan 6">Tingkatan 6</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>Bilik Asas (Homeroom):</label>
                <select
                  value={editingClass.homeroomId || ''}
                  onChange={(e) => setEditingClass({ ...editingClass, homeroomId: e.target.value || undefined })}
                  style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.80rem', background: '#ffffff', boxSizing: 'border-box' }}
                >
                  <option value="">-- Tiada Bilik Asas --</option>
                  {roomsList.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
              <button type="button" onClick={() => setEditingClass(null)} style={{ padding: '0.4rem 0.9rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                Batal
              </button>
              <button type="button" onClick={handleSaveEditClass} style={{ padding: '0.4rem 1.15rem', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#ffffff', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUNTING SUBJEK */}
      {editingSubject && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', maxWidth: '480px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={17} color="#2563eb" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Kemaskini Subjek Bank
                </h3>
              </div>
              <button type="button" onClick={() => setEditingSubject(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={16} color="#94a3b8" />
              </button>
            </div>
            <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.15rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>Kod Subjek:</label>
                  <input
                    type="text"
                    value={editingSubject.code}
                    disabled
                    style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.80rem', background: '#f1f5f9', color: '#64748b', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>Nama Subjek:</label>
                  <input
                    type="text"
                    value={editingSubject.name}
                    onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                    style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.80rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>Slot (W):</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={editingSubject.defaultSlots}
                    onChange={(e) => setEditingSubject({ ...editingSubject, defaultSlots: Number(e.target.value) || 1 })}
                    style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.80rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>Kategori:</label>
                  <select
                    value={editingSubject.category}
                    onChange={(e) => setEditingSubject({ ...editingSubject, category: e.target.value as any })}
                    style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.80rem', background: '#ffffff', boxSizing: 'border-box' }}
                  >
                    <option value="CORE_ACADEMIC">Teras Akademik</option>
                    <option value="DINIYAH_RELIGIOUS">Diniyah / Agama</option>
                    <option value="ELECTIVE">Elektif / Seni</option>
                    <option value="SPECIAL">Khas / Amali</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '3px', color: '#334155' }}>Bilik Wajib:</label>
                <select
                  value={editingSubject.requiredRoomType}
                  onChange={(e) => setEditingSubject({ ...editingSubject, requiredRoomType: e.target.value })}
                  style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.80rem', background: '#ffffff', boxSizing: 'border-box' }}
                >
                  <option value="CLASSROOM">Bilik Darjah</option>
                  <option value="LAB">Makmal Sains</option>
                  <option value="SURAU">Surau</option>
                  <option value="FIELD">Padang</option>
                  <option value="HALL">Dewan</option>
                  <option value="LIBRARY">Perpustakaan</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
              <button type="button" onClick={() => setEditingSubject(null)} style={{ padding: '0.4rem 0.9rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                Batal
              </button>
              <button type="button" onClick={handleSaveEditSubject} style={{ padding: '0.4rem 1.15rem', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#ffffff', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}