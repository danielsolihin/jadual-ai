// src/app/wizard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  syncSchoolProfileToDb, 
  syncTeachersToDb, 
  syncRoomsToDb, 
  syncClassesAndDemandsToDb 
} from '@/lib/dbService';
import { 
  TimeGridConfigState, 
  TeacherFormState, 
  RoomFormState, 
  ClassCohortConfig, 
  TimetableEntry 
} from '@/types/timetable';

// Import komponen wizard mengikut nama fail sebenar
import Step1SchoolType from '@/components/wizard/Step1SchoolType';
import Step2TimeGrid from '@/components/wizard/Step2TimeGrid';
import Step3Resources from '@/components/wizard/Step3Resources';
import Step4Curriculum from '@/components/wizard/Step4Curriculum';
import Step5Solver from '@/components/wizard/Step5Solver';
import Step6MasterGrid from '@/components/wizard/Step6MasterGrid';
import Step7Calendar from '@/components/wizard/Step7Calendar';

import { Loader2 } from 'lucide-react';

export default function WizardPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingStep, setIsSavingStep] = useState(false);

  // 1. STATE BERSIH DENGAN NILAI LALAI PROFIL (Menyokong 'code' & 'schoolCode')
  const [schoolProfile, setSchoolProfile] = useState<any>({
    schoolName: '',
    schoolCode: '',
    name: '',
    code: '',
    schoolType: 'PRIMARY_KSSR',
    stateGroup: 'GROUP_B',
    sessionYear: '2026/2027',
    sessionStructure: 'SINGLE_SESSION',
  });

  const [timeGridConfig, setTimeGridConfig] = useState<TimeGridConfigState>({
    totalDailySlots: 10,
    slotDurationMinutes: 30,
    morningStartTime: '07:30',
    recessMode: 'SINGLE',
    recessGroup1Slot: 5,
    recessGroup2Slot: 6,
    lunchPrayerSlot: 11,
    maxConsecutiveSlots: 3,
    fridayMaxSlots: 2,
    cocurricularConfig: { enabled: true, day: 3, startSlot: 8, slotCount: 2 },
  });

  const [teachers, setTeachers] = useState<TeacherFormState[]>([]);
  const [rooms, setRooms] = useState<RoomFormState[]>([]);
  const [classes, setClasses] = useState<ClassCohortConfig[]>([]);
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);

  // 2. MUAT TURUN DATA SEBENAR DARI SUPABASE
  useEffect(() => {
    async function loadDatabaseData() {
      setIsLoading(true);
      try {
        // A. Ambil Profil Sekolah & Tetapan Grid
        const { data: profileData, error: profileErr } = await supabase
          .from('school_profiles')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (profileData && !profileErr) {
          const sName = profileData.school_name || '';
          const sCode = profileData.school_code || '';

          setSchoolProfile({
            id: profileData.id,
            schoolName: sName,
            schoolCode: sCode,
            name: sName,
            code: sCode,
            schoolType: profileData.school_type || 'PRIMARY_KSSR',
            stateGroup: profileData.state_group || 'GROUP_B',
            sessionYear: profileData.session_year || '2026/2027',
            sessionStructure: profileData.session_structure || 'SINGLE_SESSION',
          });

          setTimeGridConfig({
            totalDailySlots: profileData.total_daily_slots ?? 10,
            slotDurationMinutes: profileData.slot_duration_minutes ?? 30,
            morningStartTime: profileData.morning_start_time || '07:30',
            recessMode: profileData.recess_mode || 'SINGLE',
            recessGroup1Slot: profileData.recess_group1_slot ?? 5,
            recessGroup2Slot: profileData.recess_group2_slot ?? 6,
            lunchPrayerSlot: profileData.lunch_prayer_slot ?? 11,
            maxConsecutiveSlots: profileData.max_consecutive_slots ?? 3,
            fridayMaxSlots: profileData.friday_max_slots ?? 2,
            cocurricularConfig: profileData.cocurricular_config || { enabled: true, day: 3, startSlot: 8, slotCount: 2 },
          });
        }

        // B. Ambil Senarai Guru
        const { data: teachersData, error: teacherErr } = await supabase
          .from('teachers')
          .select('*')
          .order('code', { ascending: true });

        if (teachersData && !teacherErr) {
          setTeachers(teachersData.map((t: any) => ({
            id: t.id,
            code: t.code,
            fullName: t.full_name,
            role: t.role || 'NORMAL',
            maxWeeklySlots: t.max_weekly_slots ?? 26,
            maxDailySlots: t.max_daily_slots ?? 6,
            availableDays: t.available_days || [1, 2, 3, 4, 5],
            unavailableDays: t.unavailable_days || [],
            isSpecialLeave: Boolean(t.is_special_leave),
          })));
        }

        // C. Ambil Senarai Bilik
        const { data: roomsData, error: roomErr } = await supabase
          .from('rooms')
          .select('*')
          .order('code', { ascending: true });

        if (roomsData && !roomErr) {
          setRooms(roomsData.map((r: any) => ({
            id: r.id,
            code: r.code,
            name: r.name,
            roomType: r.room_type || 'CLASSROOM',
            capacity: r.capacity ?? 40,
          })));
        }

        // D. Ambil Senarai Kelas Bersama Demands Subjek
        const { data: classesData, error: classErr } = await supabase
          .from('classes')
          .select(`
            id, 
            name, 
            year_level, 
            academic_stage, 
            homeroom_id,
            class_subject_demands (*)
          `)
          .order('year_level', { ascending: true });

        if (classesData && !classErr) {
          setClasses(classesData.map((c: any) => ({
            id: c.id,
            name: c.name,
            yearLevel: c.year_level,
            academicStage: c.academic_stage,
            homeroomId: c.homeroom_id,
            demands: (c.class_subject_demands || []).map((d: any) => ({
              id: d.id,
              code: d.subject_code,
              name: d.subject_name,
              weeklySlots: d.weekly_slots,
              assignedTeacherId: d.assigned_teacher_id,
              requiredRoomType: d.requiredRoomType || d.required_room_type || 'CLASSROOM',
              isPrimeTimePriority: Boolean(d.is_prime_time_priority),
              isParallel: Boolean(d.is_parallel),
              parallelSyncKey: d.parallel_sync_key,
              teacherAllocations: d.teacher_allocations || [],
              allowedDays: d.allowed_days || [1, 2, 3, 4, 5],
            })),
          })));
        }
      } catch (err) {
        console.error('Ralat semasa membaca data daripada Supabase:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDatabaseData();
  }, []);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", "Inter", sans-serif'
      }}>
        <Loader2 size={36} color="#2563eb" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '14px', fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>
          Menyambung ke pangkalan data Supabase...
        </p>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.74rem', color: '#94a3b8' }}>
          Memuat turun parameter profil, grid waktu, sumber & kurikulum
        </p>
      </div>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f1f5f9', position: 'relative' }}>
      
      {/* OVERLAY INDIKATOR PENYIMPANAN SUPABASE */}
      {isSavingStep && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: '#ffffff',
            padding: '1.25rem 2rem',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Loader2 size={22} color="#2563eb" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
              Menyimpan data ke Supabase...
            </span>
          </div>
        </div>
      )}

      {/* LANGKAH 1: PROFIL & JENIS SEKOLAH (DENGAN PROP ONCHANGE LENGKAP) */}
      {currentStep === 1 && (
        <Step1SchoolType
          data={schoolProfile}
          schoolProfile={schoolProfile}
          setSchoolProfile={setSchoolProfile}
          schoolType={schoolProfile}
          setSchoolType={setSchoolProfile}
          initialProfile={schoolProfile}
          onChange={(updated: any) => {
            setSchoolProfile((prev: any) => ({
              ...prev,
              ...updated,
              schoolName: updated.name !== undefined ? updated.name : (updated.schoolName ?? prev.schoolName),
              schoolCode: updated.code !== undefined ? updated.code : (updated.schoolCode ?? prev.schoolCode),
              name: updated.schoolName !== undefined ? updated.schoolName : (updated.name ?? prev.name),
              code: updated.schoolCode !== undefined ? updated.schoolCode : (updated.code ?? prev.code),
            }));
          }}
          onNext={async (data?: any) => {
            setIsSavingStep(true);
            try {
              const merged = { ...schoolProfile, ...(data || {}) };
              setSchoolProfile(merged);
              await syncSchoolProfileToDb(merged, timeGridConfig);
            } catch (err) {
              console.error('Ralat simpan Step 1:', err);
            } finally {
              setIsSavingStep(false);
              setCurrentStep(2);
            }
          }}
        />
      )}

      {/* LANGKAH 2: STRUKTUR MASA & GRID WAKTU */}
      {currentStep === 2 && (
        <Step2TimeGrid
          data={timeGridConfig}
          gridConfig={timeGridConfig}
          setGridConfig={setTimeGridConfig}
          timeGridConfig={timeGridConfig}
          setTimeGridConfig={setTimeGridConfig}
          schoolType={schoolProfile}
          stateGroup={schoolProfile.stateGroup}
          onChange={(updated: any) => {
            setTimeGridConfig((prev: any) => ({ ...prev, ...updated }));
          }}
          onNext={async (data?: any) => {
            setIsSavingStep(true);
            try {
              const mergedGrid = { ...timeGridConfig, ...(data || {}) };
              setTimeGridConfig(mergedGrid);
              await syncSchoolProfileToDb(schoolProfile, mergedGrid);
            } catch (err) {
              console.error('Ralat simpan Step 2:', err);
            } finally {
              setIsSavingStep(false);
              setCurrentStep(3);
            }
          }}
          onBack={() => setCurrentStep(1)}
        />
      )}

      {/* LANGKAH 3: SUMBER (GURU & BILIK) */}
      {currentStep === 3 && (
        <Step3Resources
          teachers={teachers}
          setTeachers={setTeachers}
          rooms={rooms}
          setRooms={setRooms}
          onChangeTeachers={(updated: any) => setTeachers(updated)}
          onChangeRooms={(updated: any) => setRooms(updated)}
          onNext={async () => {
            setIsSavingStep(true);
            try {
              await Promise.all([
                syncTeachersToDb(teachers),
                syncRoomsToDb(rooms)
              ]);
            } catch (err) {
              console.error('Ralat simpan Step 3:', err);
            } finally {
              setIsSavingStep(false);
              setCurrentStep(4);
            }
          }}
          onBack={() => setCurrentStep(2)}
        />
      )}

      {/* LANGKAH 4: KURIKULUM & DEMANDS KELAS */}
      {currentStep === 4 && (
        <Step4Curriculum
          classes={classes}
          setClasses={setClasses}
          onUpdateClasses={(updatedClasses: any) => setClasses(updatedClasses)}
          teachers={teachers}
          rooms={rooms}
          schoolType={schoolProfile?.schoolType || 'PRIMARY_KSSR'}
          timeGridConfig={timeGridConfig}
          stateGroup={schoolProfile?.stateGroup || 'GROUP_B'}
          lockedSlots={[]}
          onUpdateLockedSlots={() => {}}
          onNext={async () => {
            setIsSavingStep(true);
            try {
              await syncClassesAndDemandsToDb(classes);
            } catch (err) {
              console.error('Ralat simpan Step 4:', err);
            } finally {
              setIsSavingStep(false);
              setCurrentStep(5);
            }
          }}
          onBack={() => setCurrentStep(3)}
        />
      )}

      {/* LANGKAH 5: ENJIN PENJANA AI-CSP */}
      {currentStep === 5 && (
        <Step5Solver
          teachers={teachers}
          rooms={rooms}
          classes={classes}
          setClasses={setClasses}
          gridConfig={timeGridConfig}
          stateGroup={schoolProfile.stateGroup}
          onGenerated={(generatedEntries) => {
            setTimetableEntries(generatedEntries);
            setCurrentStep(6);
          }}
          onBack={() => setCurrentStep(4)}
        />
      )}

      {/* LANGKAH 6: MASTER GRID JADUAL WAKTU */}
      {currentStep === 6 && (
        <Step6MasterGrid
          entries={timetableEntries}
          gridConfig={timeGridConfig}
          stateGroup={schoolProfile.stateGroup}
          classes={classes}
          teachers={teachers}
          rooms={rooms}
          onBack={() => setCurrentStep(5)}
          onNext={() => setCurrentStep(7)}
        />
      )}

      {/* (PILIHAN) LANGKAH 7: KALENDAR / TAKWIM */}
      {currentStep === 7 && (
        <Step7Calendar
          entries={timetableEntries}
          gridConfig={timeGridConfig}
          schoolProfile={schoolProfile}
          onBack={() => setCurrentStep(6)}
        />
      )}
    </main>
  );
}