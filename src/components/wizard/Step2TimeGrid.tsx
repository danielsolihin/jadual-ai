// src/components/wizard/Step2TimeGrid.tsx
'use client';

import React, { useState } from 'react';
import { 
  TimeGridConfigState, 
  SchoolType, 
  SchoolSession, 
  AcademicStage,
  StateGroup,
  SchoolProfileState
} from '@/types/timetable';
import styles from './Step2TimeGrid.module.css';
import { 
  Clock, 
  Coffee, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  UserCheck, 
  Award, 
  Calendar, 
  CheckCircle2, 
  Sliders, 
  MapPin,
  Check
} from 'lucide-react';

interface Props {
  data: TimeGridConfigState;
  schoolType: SchoolType;
  sessionStructure: SchoolSession;
  stateGroup?: StateGroup;
  onUpdateProfile?: (updated: Partial<SchoolProfileState>) => void;
  onChange: (updated: Partial<TimeGridConfigState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2TimeGrid({
  data,
  schoolType,
  sessionStructure,
  stateGroup = 'GROUP_B',
  onUpdateProfile,
  onChange,
  onNext,
  onBack,
}: Props) {
  const isPrimary = schoolType === 'PRIMARY_KSSR';
  const stage1Label = isPrimary ? 'Tahap 1 (Tahun 1, 2, 3)' : 'Menengah Rendah (Ting. 1, 2, 3)';
  const stage2Label = isPrimary ? 'Tahap 2 (Tahun 4, 5, 6)' : 'Menengah Atas (Ting. 4, 5)';
  const stage1Key: AcademicStage = isPrimary ? 'STAGE_1' : 'LOWER_SEC';
  const stage2Key: AcademicStage = isPrimary ? 'STAGE_2' : 'UPPER_SEC';

  const [activeStateGroup, setActiveStateGroup] = useState<StateGroup>(
    data.stateGroup || stateGroup || 'GROUP_B'
  );
  const [activeSession, setActiveSession] = useState<SchoolSession>(
    data.sessionStructure || sessionStructure || 'SINGLE_SESSION'
  );
  const [isCustomSlotMode, setIsCustomSlotMode] = useState<boolean>(
    data.totalDailySlots !== 10 && data.totalDailySlots !== 13
  );

  const isGroupA = activeStateGroup === 'GROUP_A';
  const dayNames = isGroupA
    ? ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis']
    : ['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat'];
  const lastDayName = isGroupA ? 'Khamis' : 'Jumaat';

  const handleSelectStateGroup = (group: StateGroup) => {
    setActiveStateGroup(group);
    onChange({ stateGroup: group });
    onUpdateProfile?.({ stateGroup: group });
  };

  const handleSelectSession = (sess: SchoolSession) => {
    setActiveSession(sess);
    onChange({ sessionStructure: sess });
    onUpdateProfile?.({ sessionStructure: sess });
  };

  const kokuConfig = {
    enabled: false,
    day: 3,
    startSlot: 8,
    slotCount: 2,
    label: 'Kokurikulum',
    targetStages: ['STAGE_2'],
    ...(data.cocurricularConfig || {}),
  };

  const handleStageToggle = (group: 'recessGroup1' | 'recessGroup2', stage: AcademicStage) => {
    const currentStages = data[group]?.targetStages || [];
    const exists = currentStages.includes(stage);
    const updatedStages = exists
      ? currentStages.filter((s) => s !== stage)
      : [...currentStages, stage];

    onChange({
      [group]: {
        ...data[group],
        targetStages: updatedStages,
      },
    });
  };

  const handleKokuToggle = (enabled: boolean) => {
    onChange({
      cocurricularConfig: {
        ...kokuConfig,
        enabled,
        day: kokuConfig.day ?? 3,
        startSlot: kokuConfig.startSlot ?? 8,
        slotCount: kokuConfig.slotCount ?? 2,
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.recessMode === 'STAGGERED') {
      if (
        (data.recessGroup1?.targetStages?.length || 0) === 0 ||
        (data.recessGroup2?.targetStages?.length || 0) === 0
      ) {
        alert('Sila pilih sekurang-kurangnya satu tahap untuk setiap kumpulan rehat bertingkat.');
        return;
      }
    }
    onNext();
  };

  const currentConsecutive = data.maxConsecutiveSlots ?? 3;

  return (
    <div style={{
      background: '#f1f5f9',
      minHeight: '100vh',
      padding: '1.25rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", "Inter", sans-serif'
    }}>
      <form 
        onSubmit={handleSubmit}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #cbd5e1',
          padding: '1.5rem 1.75rem',
          maxWidth: '980px',
          margin: '0 auto',
          boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.03), 0 2px 4px -2px rgba(15, 23, 42, 0.02)'
        }}
      >
        {/* ======================================================== */}
        {/* HEADER LANGKAH 2                                         */}
        {/* ======================================================== */}
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
              Langkah 2 daripada 6
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Struktur Grid & Polisi Waktu</span>
          </div>

          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.3px' }}>
            Struktur Masa, Sesi Persekolahan & Kokurikulum
          </h1>
          <p style={{ fontSize: '0.80rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
            Tetapkan grid waktu harian, had keletihan guru, had hari {lastDayName}, slot Rehat, serta jadual mandatori Kokurikulum.
          </p>
        </div>

        {/* ======================================================== */}
        {/* SEKSYEN 1: TAKWIM NEGERI & SESI PERSEKOLAHAN (2 LAJUR)    */}
        {/* ======================================================== */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem', marginBottom: '1.15rem' }}>
          
          {/* Kumpulan Negeri */}
          <div style={{ background: '#f8fafc', padding: '0.9rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={15} color="#2563eb" />
              Kumpulan Takwim Persekolahan:
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div
                onClick={() => handleSelectStateGroup('GROUP_B')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: !isGroupA ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                  backgroundColor: !isGroupA ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <input
                  type="radio"
                  name="stateGroupOption"
                  checked={!isGroupA}
                  onChange={() => handleSelectStateGroup('GROUP_B')}
                  style={{ accentColor: '#2563eb', cursor: 'pointer' }}
                />
                <div style={{ fontSize: '0.74rem', color: !isGroupA ? '#1e40af' : '#334155', fontWeight: !isGroupA ? 700 : 500 }}>
                  <strong>Kumpulan B:</strong> Isnin – Jumaat
                </div>
              </div>

              <div
                onClick={() => handleSelectStateGroup('GROUP_A')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: isGroupA ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                  backgroundColor: isGroupA ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <input
                  type="radio"
                  name="stateGroupOption"
                  checked={isGroupA}
                  onChange={() => handleSelectStateGroup('GROUP_A')}
                  style={{ accentColor: '#2563eb', cursor: 'pointer' }}
                />
                <div style={{ fontSize: '0.74rem', color: isGroupA ? '#1e40af' : '#334155', fontWeight: isGroupA ? 700 : 500 }}>
                  <strong>Kumpulan A:</strong> Ahad – Khamis (JHR, KDH, KTN, TRG)
                </div>
              </div>
            </div>
          </div>

          {/* Sesi Persekolahan */}
          <div style={{ background: '#f8fafc', padding: '0.9rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={15} color="#2563eb" />
              Jumlah Sesi Persekolahan:
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div
                onClick={() => handleSelectSession('SINGLE_SESSION')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: activeSession === 'SINGLE_SESSION' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                  backgroundColor: activeSession === 'SINGLE_SESSION' ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <input
                  type="radio"
                  name="sessionOption"
                  checked={activeSession === 'SINGLE_SESSION'}
                  onChange={() => handleSelectSession('SINGLE_SESSION')}
                  style={{ accentColor: '#2563eb', cursor: 'pointer' }}
                />
                <div style={{ fontSize: '0.74rem', color: activeSession === 'SINGLE_SESSION' ? '#1e40af' : '#334155', fontWeight: activeSession === 'SINGLE_SESSION' ? 700 : 500 }}>
                  <strong>1 Sesi:</strong> Sesi Pagi Sahaja
                </div>
              </div>

              <div
                onClick={() => handleSelectSession('DOUBLE_SESSION')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: activeSession === 'DOUBLE_SESSION' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                  backgroundColor: activeSession === 'DOUBLE_SESSION' ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <input
                  type="radio"
                  name="sessionOption"
                  checked={activeSession === 'DOUBLE_SESSION'}
                  onChange={() => handleSelectSession('DOUBLE_SESSION')}
                  style={{ accentColor: '#2563eb', cursor: 'pointer' }}
                />
                <div style={{ fontSize: '0.74rem', color: activeSession === 'DOUBLE_SESSION' ? '#1e40af' : '#334155', fontWeight: activeSession === 'DOUBLE_SESSION' ? 700 : 500 }}>
                  <strong>2 Sesi:</strong> Pagi (Tahap 2) & Petang (Tahap 1)
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* SEKSYEN 2: STRUKTUR BILANGAN WAKTU SEHARI (KAD PIL)       */}
        {/* ======================================================== */}
        <div style={{ background: '#f8fafc', padding: '0.9rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.15rem' }}>
          <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sliders size={15} color="#2563eb" />
            Struktur Bilangan Waktu Persekolahan Sehari:
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem' }}>
            {/* 10 Waktu */}
            <div
              onClick={() => {
                setIsCustomSlotMode(false);
                onChange({ totalDailySlots: 10 });
              }}
              style={{
                background: data.totalDailySlots === 10 && !isCustomSlotMode ? '#eff6ff' : '#ffffff',
                border: data.totalDailySlots === 10 && !isCustomSlotMode ? '2px solid #2563eb' : '1px solid #cbd5e1',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              <input
                type="radio"
                name="slotModeOption"
                checked={data.totalDailySlots === 10 && !isCustomSlotMode}
                onChange={() => {
                  setIsCustomSlotMode(false);
                  onChange({ totalDailySlots: 10 });
                }}
                style={{ accentColor: '#2563eb', cursor: 'pointer' }}
              />
              <div>
                <strong style={{ fontSize: '0.78rem', color: data.totalDailySlots === 10 && !isCustomSlotMode ? '#1e40af' : '#0f172a' }}>
                  10 Waktu (Standard)
                </strong>
                <div style={{ fontSize: '0.66rem', color: '#64748b' }}>07:30 pg – 01:00 tgh</div>
              </div>
            </div>

            {/* 13 Waktu */}
            <div
              onClick={() => {
                setIsCustomSlotMode(false);
                onChange({ totalDailySlots: 13, lunchPrayerSlot: 11 });
              }}
              style={{
                background: data.totalDailySlots === 13 && !isCustomSlotMode ? '#eff6ff' : '#ffffff',
                border: data.totalDailySlots === 13 && !isCustomSlotMode ? '2px solid #2563eb' : '1px solid #cbd5e1',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              <input
                type="radio"
                name="slotModeOption"
                checked={data.totalDailySlots === 13 && !isCustomSlotMode}
                onChange={() => {
                  setIsCustomSlotMode(false);
                  onChange({ totalDailySlots: 13, lunchPrayerSlot: 11 });
                }}
                style={{ accentColor: '#2563eb', cursor: 'pointer' }}
              />
              <div>
                <strong style={{ fontSize: '0.78rem', color: data.totalDailySlots === 13 && !isCustomSlotMode ? '#1e40af' : '#0f172a' }}>
                  13 Waktu (Integrasi/SRAI)
                </strong>
                <div style={{ fontSize: '0.66rem', color: '#64748b' }}>07:30 pg – 03:00 ptg</div>
              </div>
            </div>

            {/* Tetapkan Sendiri */}
            <div
              onClick={() => setIsCustomSlotMode(true)}
              style={{
                background: isCustomSlotMode ? '#eff6ff' : '#ffffff',
                border: isCustomSlotMode ? '2px solid #2563eb' : '1px solid #cbd5e1',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              <input
                type="radio"
                name="slotModeOption"
                checked={isCustomSlotMode}
                onChange={() => setIsCustomSlotMode(true)}
                style={{ accentColor: '#2563eb', cursor: 'pointer' }}
              />
              <div>
                <strong style={{ fontSize: '0.78rem', color: isCustomSlotMode ? '#1e40af' : '#0f172a' }}>
                  Tetapkan Sendiri
                </strong>
                <div style={{ fontSize: '0.66rem', color: '#64748b' }}>Kustom pilihan admin</div>
              </div>
            </div>
          </div>

          {/* Input Kustom Tambahan */}
          {isCustomSlotMode && (
            <div style={{ marginTop: '0.75rem', background: '#ffffff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155' }}>Jumlah Waktu Sehari:</span>
                <input
                  type="number"
                  min={6}
                  max={16}
                  value={data.totalDailySlots || 10}
                  onChange={(e) => {
                    const val = Math.max(6, Math.min(16, Number(e.target.value)));
                    onChange({ totalDailySlots: val });
                  }}
                  style={{ width: '80px', fontWeight: 800, fontSize: '0.95rem', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center' }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Waktu Sehari</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 500, flex: 1 }}>
                Grid jadual akan menjana tepat <strong>{data.totalDailySlots} waktu</strong> setiap hari persekolahan.
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* SEKSYEN 3: WAKTU MULA & HAD HARI TERAKHIR (2 LAJUR)       */}
        {/* ======================================================== */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem', marginBottom: '1.15rem' }}>
          
          <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
              <Clock size={14} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'text-bottom' }} />
              Waktu Mula Sesi Pagi:
            </label>
            <input
              type="time"
              value={data.morningStartTime || '07:30'}
              onChange={(e) => onChange({ morningStartTime: e.target.value })}
              style={{ width: '100%', padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.80rem', fontWeight: 700, backgroundColor: '#ffffff', boxSizing: 'border-box' }}
              required
            />
          </div>

          <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
              <ShieldCheck size={14} color="#16a34a" style={{ display: 'inline', marginRight: '5px', verticalAlign: 'text-bottom' }} />
              Maksimum Waktu Mengajar Hari {lastDayName}:
            </label>
            <select
              value={data.fridayMaxSlots ?? 2}
              onChange={(e) => onChange({ fridayMaxSlots: Number(e.target.value) })}
              style={{ width: '100%', padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.80rem', fontWeight: 700, backgroundColor: '#ffffff', boxSizing: 'border-box' }}
            >
              <option value={2}>Maksimum 2 Waktu (Khas Hari {lastDayName} - Disyorkan)</option>
              <option value={3}>Maksimum 3 Waktu (Kelonggaran Sederhana)</option>
              <option value={4}>Maksimum 4 Waktu (Standard Amalan KPM)</option>
              <option value={5}>Maksimum 5 Waktu</option>
              <option value={0}>Tiada Had Khas Hari {lastDayName}</option>
            </select>
          </div>

        </div>

        {/* ======================================================== */}
        {/* SEKSYEN 4: POLISI KELETIHAN GURU (4 PIL INTERAKTIF)      */}
        {/* ======================================================== */}
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '12px',
          padding: '0.9rem',
          marginBottom: '1.15rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <UserCheck size={16} color="#16a34a" />
            <strong style={{ color: '#166534', fontSize: '0.82rem' }}>
              Polisi Keletihan Guru: Had Mengajar Berturut-turut
            </strong>
          </div>
          <p style={{ fontSize: '0.72rem', color: '#15803d', margin: '0 0 8px 0', lineHeight: 1.4 }}>
            Sistem mewajibkan slot rehat atau luang (*cooling-off gap*) sebaik sahaja guru mencapai had berturut-turut ini.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.6rem' }}>
            {/* 2 Waktu */}
            <div
              onClick={() => onChange({ maxConsecutiveSlots: 2 })}
              style={{
                backgroundColor: currentConsecutive === 2 ? '#dcfce7' : '#ffffff',
                border: currentConsecutive === 2 ? '2px solid #16a34a' : '1px solid #bbf7d0',
                padding: '0.55rem 0.8rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              <input
                type="radio"
                name="maxConsecutiveSlots"
                checked={currentConsecutive === 2}
                onChange={() => onChange({ maxConsecutiveSlots: 2 })}
                style={{ accentColor: '#16a34a', cursor: 'pointer' }}
              />
              <div>
                <strong style={{ fontSize: '0.78rem', color: currentConsecutive === 2 ? '#166534' : '#1e293b' }}>
                  2 Waktu (60m)
                </strong>
                <span style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 700, marginLeft: '4px' }}>– Ketat</span>
              </div>
            </div>

            {/* 3 Waktu */}
            <div
              onClick={() => onChange({ maxConsecutiveSlots: 3 })}
              style={{
                backgroundColor: currentConsecutive === 3 ? '#dcfce7' : '#ffffff',
                border: currentConsecutive === 3 ? '2px solid #16a34a' : '1px solid #bbf7d0',
                padding: '0.55rem 0.8rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              <input
                type="radio"
                name="maxConsecutiveSlots"
                checked={currentConsecutive === 3}
                onChange={() => onChange({ maxConsecutiveSlots: 3 })}
                style={{ accentColor: '#16a34a', cursor: 'pointer' }}
              />
              <div>
                <strong style={{ fontSize: '0.78rem', color: currentConsecutive === 3 ? '#166534' : '#1e293b' }}>
                  3 Waktu (90m)
                </strong>
                <span style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 700, marginLeft: '4px' }}>– Seimbang</span>
              </div>
            </div>

            {/* 4 Waktu */}
            <div
              onClick={() => onChange({ maxConsecutiveSlots: 4 })}
              style={{
                backgroundColor: currentConsecutive === 4 ? '#dcfce7' : '#ffffff',
                border: currentConsecutive === 4 ? '2px solid #16a34a' : '1px solid #bbf7d0',
                padding: '0.55rem 0.8rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              <input
                type="radio"
                name="maxConsecutiveSlots"
                checked={currentConsecutive === 4}
                onChange={() => onChange({ maxConsecutiveSlots: 4 })}
                style={{ accentColor: '#16a34a', cursor: 'pointer' }}
              />
              <div>
                <strong style={{ fontSize: '0.78rem', color: currentConsecutive === 4 ? '#166534' : '#1e293b' }}>
                  4 Waktu (120m)
                </strong>
                <span style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 700, marginLeft: '4px' }}>– Fleksibel</span>
              </div>
            </div>

            {/* Tiada Had */}
            <div
              onClick={() => onChange({ maxConsecutiveSlots: 0 })}
              style={{
                backgroundColor: currentConsecutive === 0 ? '#dcfce7' : '#ffffff',
                border: currentConsecutive === 0 ? '2px solid #16a34a' : '1px solid #bbf7d0',
                padding: '0.55rem 0.8rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              <input
                type="radio"
                name="maxConsecutiveSlots"
                checked={currentConsecutive === 0}
                onChange={() => onChange({ maxConsecutiveSlots: 0 })}
                style={{ accentColor: '#16a34a', cursor: 'pointer' }}
              />
              <div>
                <strong style={{ fontSize: '0.78rem', color: currentConsecutive === 0 ? '#166534' : '#1e293b' }}>
                  Tiada Had
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SEKSYEN 5: TETAPAN KOKURIKULUM MANUAL                    */}
        {/* ======================================================== */}
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '12px',
          padding: '0.9rem',
          marginBottom: '1.15rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={16} color="#2563eb" />
              <strong style={{ color: '#1e40af', fontSize: '0.82rem' }}>
                Tetapan Waktu Kokurikulum Manual (Autonomi Admin)
              </strong>
            </div>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 700, color: '#1d4ed8' }}>
              <input
                type="checkbox"
                checked={kokuConfig.enabled}
                onChange={(e) => handleKokuToggle(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#2563eb' }}
              />
              <span>Aktifkan Kunci Slot Kokurikulum</span>
            </label>
          </div>

          <p style={{ fontSize: '0.72rem', color: '#1d4ed8', margin: '0 0 8px 0', lineHeight: 1.4 }}>
            Tandakan pilihan di atas untuk mengunci slot Kokurikulum tetap tanpa diganggu oleh subjek akademik lain.
          </p>

          {kokuConfig.enabled && (
            <div style={{ background: '#ffffff', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #dbeafe', marginTop: '0.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
                    <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} />
                    Pilih Hari:
                  </label>
                  <select
                    value={kokuConfig.day}
                    onChange={(e) => onChange({
                      cocurricularConfig: { ...kokuConfig, day: Number(e.target.value) }
                    })}
                    style={{ width: '100%', padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.76rem', fontWeight: 700, backgroundColor: '#ffffff' }}
                  >
                    {dayNames.map((name, index) => (
                      <option key={index + 1} value={index + 1}>
                        {name} {index + 1 === 3 && '(Standard KPM)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
                    <Clock size={13} style={{ display: 'inline', marginRight: '4px' }} />
                    Mula Pada Waktu:
                  </label>
                  <select
                    value={kokuConfig.startSlot}
                    onChange={(e) => onChange({
                      cocurricularConfig: { ...kokuConfig, startSlot: Number(e.target.value) }
                    })}
                    style={{ width: '100%', padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.76rem', fontWeight: 700, backgroundColor: '#ffffff' }}
                  >
                    <optgroup label="Sesi Pagi">
                      <option value={1}>Waktu 1 (07:30 - 08:00)</option>
                      <option value={2}>Waktu 2 (08:00 - 08:30)</option>
                      <option value={3}>Waktu 3 (08:30 - 09:00)</option>
                      <option value={4}>Waktu 4 (09:00 - 09:30)</option>
                    </optgroup>
                    <optgroup label="Sesi Tengah Hari / Petang">
                      <option value={7}>Waktu 7 (10:30 - 11:00)</option>
                      <option value={8}>Waktu 8 (11:00 - 11:30) [Disyorkan]</option>
                      <option value={9}>Waktu 9 (11:30 - 12:00)</option>
                      <option value={10}>Waktu 10 (12:00 - 12:30)</option>
                      <option value={11}>Waktu 11 (01:30 - 02:00)</option>
                      <option value={12}>Waktu 12 (02:00 - 02:30)</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '3px' }}>
                    Tempoh Masa:
                  </label>
                  <select
                    value={kokuConfig.slotCount}
                    onChange={(e) => onChange({
                      cocurricularConfig: { ...kokuConfig, slotCount: Number(e.target.value) }
                    })}
                    style={{ width: '100%', padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.76rem', fontWeight: 700, backgroundColor: '#ffffff' }}
                  >
                    <option value={2}>2 Waktu (60 Minit / 1 Jam)</option>
                    <option value={3}>3 Waktu (90 Minit / 1.5 Jam)</option>
                    <option value={4}>4 Waktu (120 Minit / 2 Jam)</option>
                  </select>
                </div>
              </div>

              <div style={{ background: '#f0fdf4', padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#166534' }}>
                <CheckCircle2 size={14} color="#16a34a" />
                <span>
                  <strong>Slot Terkunci:</strong> Hari <strong>{dayNames[kokuConfig.day - 1]}</strong>, bermula <strong>Waktu {kokuConfig.startSlot}</strong> selama <strong>{kokuConfig.slotCount} waktu</strong>.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* SEKSYEN 6: POLISI REHAT KANTIN PELAJAR                   */}
        {/* ======================================================== */}
        <div style={{ background: '#f8fafc', padding: '0.9rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Coffee size={15} color="#2563eb" />
            Polisi Rehat Kantin Murid:
          </label>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600 }}>
              <input
                type="radio"
                name="recessMode"
                checked={data.recessMode === 'STAGGERED'}
                onChange={() => onChange({ recessMode: 'STAGGERED' })}
                style={{ accentColor: '#2563eb' }}
              />
              <span>Rehat Bertingkat (Staggered - Disyorkan KPM)</span>
            </label>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600 }}>
              <input
                type="radio"
                name="recessMode"
                checked={data.recessMode === 'SINGLE'}
                onChange={() => onChange({ recessMode: 'SINGLE' })}
                style={{ accentColor: '#2563eb' }}
              />
              <span>Rehat Seragam</span>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {/* Kumpulan Rehat 1 */}
            <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <strong style={{ fontSize: '0.76rem', color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                🥪 Kumpulan Rehat 1 (Rehat Awal - Slot W5)
              </strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '6px' }}>
                <div>
                  <label style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>Masa Mula:</label>
                  <input
                    type="time"
                    value={data.recessGroup1?.startTime || '09:30'}
                    onChange={(e) => onChange({ recessGroup1: { ...data.recessGroup1, startTime: e.target.value } })}
                    style={{ width: '100%', padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.74rem', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>Masa Tamat:</label>
                  <input
                    type="time"
                    value={data.recessGroup1?.endTime || '10:00'}
                    onChange={(e) => onChange({ recessGroup1: { ...data.recessGroup1, endTime: e.target.value } })}
                    style={{ width: '100%', padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.74rem', boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>

              {data.recessMode === 'STAGGERED' && (
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                  <label style={{ fontSize: '0.68rem', color: '#475569', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Tahap Terlibat:</label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={data.recessGroup1?.targetStages?.includes(stage1Key)}
                        onChange={() => handleStageToggle('recessGroup1', stage1Key)}
                        style={{ accentColor: '#2563eb' }}
                      />
                      <span>{stage1Label}</span>
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={data.recessGroup1?.targetStages?.includes(stage2Key)}
                        onChange={() => handleStageToggle('recessGroup1', stage2Key)}
                        style={{ accentColor: '#2563eb' }}
                      />
                      <span>{stage2Label}</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Kumpulan Rehat 2 */}
            {data.recessMode === 'STAGGERED' && (
              <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <strong style={{ fontSize: '0.76rem', color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                  🥪 Kumpulan Rehat 2 (Rehat Lewat - Slot W6)
                </strong>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '6px' }}>
                  <div>
                    <label style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>Masa Mula:</label>
                    <input
                      type="time"
                      value={data.recessGroup2?.startTime || '10:00'}
                      onChange={(e) => onChange({ recessGroup2: { ...data.recessGroup2, startTime: e.target.value } })}
                      style={{ width: '100%', padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.74rem', boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>Masa Tamat:</label>
                    <input
                      type="time"
                      value={data.recessGroup2?.endTime || '10:30'}
                      onChange={(e) => onChange({ recessGroup2: { ...data.recessGroup2, endTime: e.target.value } })}
                      style={{ width: '100%', padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.74rem', boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                  <label style={{ fontSize: '0.68rem', color: '#475569', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Tahap Terlibat:</label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={data.recessGroup2?.targetStages?.includes(stage1Key)}
                        onChange={() => handleStageToggle('recessGroup2', stage1Key)}
                        style={{ accentColor: '#2563eb' }}
                      />
                      <span>{stage1Label}</span>
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={data.recessGroup2?.targetStages?.includes(stage2Key)}
                        onChange={() => handleStageToggle('recessGroup2', stage2Key)}
                        style={{ accentColor: '#2563eb' }}
                      />
                      <span>{stage2Label}</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* FOOTER TINDAKAN: KEMBALI & SETERUSNYA                    */}
        {/* ======================================================== */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid #f1f5f9',
          paddingTop: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <button
            type="button"
            onClick={onBack}
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
            type="submit"
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
            <span>Seterusnya: Pangkalan Guru & Fasiliti</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}