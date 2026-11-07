// src/components/wizard/Step7Calendar.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ClassCohortConfig, TimetableEntry } from '@/types/timetable';
import { 
  Calendar, 
  Settings, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  FileText,
  ArrowLeft,
  CalendarDays,
  Calculator
} from 'lucide-react';

interface Props {
  schoolType?: any;
  stateGroup: string;
  classes: ClassCohortConfig[];
  masterEntries: TimetableEntry[]; // Jadual Induk dari Langkah 6
  onBack: () => void;
}

interface HolidayEvent {
  id: string;
  name: string;
  date: string;
  type: 'PUBLIC' | 'SCHOOL' | 'TERM';
}

interface AnnualAuditRecord {
  className: string;
  subjectCode: string;
  weeklySlots: number;
  targetAnnualHours: number;
  actualAnnualHours: number;
  deficitHours: number;
}

export default function Step7Calendar({ stateGroup, classes, masterEntries, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<'CALENDAR_SETUP' | 'AUDIT_REPORT'>('CALENDAR_SETUP');
  
  // 1. STATE TAKWIM ASAS
  const [sessionYear, setSessionYear] = useState('2026/2027');
  const [termStart, setTermStart] = useState('2026-03-01');
  const [termEnd, setTermEnd] = useState('2027-02-15');
  
  // 2. STATE CUTI & PERISTIWA
  const [holidays, setHolidays] = useState<HolidayEvent[]>([
    { id: 'h1', name: 'Hari Pekerja', date: '2026-05-01', type: 'PUBLIC' },
    { id: 'h2', name: 'Hari Kebangsaan', date: '2026-08-31', type: 'PUBLIC' },
  ]);

  const [newHolName, setNewHolName] = useState('');
  const [newHolDate, setNewHolDate] = useState('');
  const [newHolType, setNewHolType] = useState<'PUBLIC' | 'SCHOOL'>('PUBLIC');

  // Enjin Semakan Hari Persekolahan (Menyingkirkan Hujung Minggu Mengikut Negeri)
  const isWeekend = (dateObj: Date) => {
    const dayIndex = dateObj.getDay(); // 0 = Ahad, 1 = Isnin, 2 = Selasa, 3 = Rabu, 4 = Khamis, 5 = Jumaat, 6 = Sabtu
    if (stateGroup === 'GROUP_A') {
      return dayIndex === 5 || dayIndex === 6; // Jumaat & Sabtu (Johor, Kedah, Kelantan, Trg)
    } else {
      return dayIndex === 0 || dayIndex === 6; // Sabtu & Ahad (Negeri Lain)
    }
  };

  // 3. ENJIN PEMETAAN TAKWIM (CALENDAR MAPPING ENGINE)
  // Ia meratakan tarikh dari termStart hingga termEnd, kemudian menolak Cuti & Hujung Minggu
  const annualSchoolDays = useMemo(() => {
    const start = new Date(termStart);
    const end = new Date(termEnd);
    const validSchoolDays: { date: string; jsDayIndex: number; mappedSlotDayId: number }[] = [];

    const holidayDates = new Set(holidays.map(h => h.date));

    let currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const jsDayIndex = currentDate.getDay();

      if (!isWeekend(currentDate) && !holidayDates.has(dateStr)) {
        // Tentukan mappedSlotDayId (1 hingga 5) untuk padanan dengan `timeSlotId: d1_sX` di Langkah 6
        let mappedSlotDayId;
        if (stateGroup === 'GROUP_A') {
          // Ahad(0)->1, Isnin(1)->2, Selasa(2)->3, Rabu(3)->4, Khamis(4)->5
          mappedSlotDayId = jsDayIndex + 1;
        } else {
          // Isnin(1)->1, Selasa(2)->2, Rabu(3)->3, Khamis(4)->4, Jumaat(5)->5
          mappedSlotDayId = jsDayIndex;
        }

        validSchoolDays.push({
          date: dateStr,
          jsDayIndex,
          mappedSlotDayId
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return validSchoolDays;
  }, [termStart, termEnd, holidays, stateGroup]);

  // 4. ENJIN AUDIT JAM MINIMUM KPM (DEFISIT TRACKER)
  const auditReport = useMemo(() => {
    if (!masterEntries || masterEntries.length === 0) return [];

    const report: AnnualAuditRecord[] = [];

    classes.forEach(cls => {
      cls.demands?.forEach(d => {
        if (d.code === 'PERH') return;

        let totalActualSlotsPerYear = 0;

        // Kira berapa kali subjek ini berjalan sepanjang tahun dengan menyilang jadual harian
        annualSchoolDays.forEach(day => {
          // Semak jika dalam jadual induk (Master), kelas ini ada subjek ini pada hari `mappedSlotDayId`
          const slotsTaughtToday = masterEntries.filter(
            e => e.classId === cls.id && e.subjectId === d.code && e.timeSlotId.startsWith(`d${day.mappedSlotDayId}_`)
          ).length;
          
          totalActualSlotsPerYear += slotsTaughtToday;
        });

        // 1 Slot Fizikal = 30 Minit (0.5 Jam)
        const actualAnnualHours = totalActualSlotsPerYear * 0.5;
        const targetAnnualHours = d.annualHours || (d.weeklySlots * 32) || 96; // Anggaran jika null
        const deficitHours = targetAnnualHours - actualAnnualHours;

        report.push({
          className: cls.name,
          subjectCode: d.code,
          weeklySlots: d.weeklySlots,
          targetAnnualHours,
          actualAnnualHours,
          deficitHours: deficitHours > 0 ? deficitHours : 0
        });
      });
    });

    return report;
  }, [classes, masterEntries, annualSchoolDays]);

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolName || !newHolDate) return;
    
    setHolidays([...holidays, {
      id: `hol_${Date.now()}`,
      name: newHolName,
      date: newHolDate,
      type: newHolType
    }]);
    setNewHolName('');
    setNewHolDate('');
  };

  const handleRemoveHoliday = (id: string) => {
    setHolidays(holidays.filter(h => h.id !== id));
  };

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', padding: '1.25rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", "Inter", sans-serif' }}>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #cbd5e1', padding: '1.5rem 1.75rem', maxWidth: '1240px', margin: '0 auto', boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.03)' }}>
        
        {/* HEADER */}
        <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: '9999px', textTransform: 'uppercase' }}>
              Langkah 7
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Integrasi Takwim Tahunan & Audit e-RPH</span>
          </div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.3px' }}>
            Pemetaan Kalendar Akademik KPM & Audit Jam PdP
          </h1>
          <p style={{ fontSize: '0.80rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
            Semak bilangan hari persekolahan sah dan kesan lebihan atau defisit jam mengajar bagi setiap subjek sepanjang tahun akibat pertindihan cuti umum.
          </p>
        </div>

        {/* SUIS TAB */}
        <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '3px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('CALENDAR_SETUP')}
            style={{ padding: '0.45rem 1.1rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', border: 'none', backgroundColor: activeTab === 'CALENDAR_SETUP' ? '#2563eb' : 'transparent', color: activeTab === 'CALENDAR_SETUP' ? '#ffffff' : '#64748b' }}
          >
            <CalendarDays size={14} /> Penetapan Takwim & Cuti
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('AUDIT_REPORT')}
            style={{ padding: '0.45rem 1.1rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', border: 'none', backgroundColor: activeTab === 'AUDIT_REPORT' ? '#2563eb' : 'transparent', color: activeTab === 'AUDIT_REPORT' ? '#ffffff' : '#64748b' }}
          >
            <Calculator size={14} /> Laporan Audit Jam (SPI KPM)
          </button>
        </div>

        {/* TAB 1: TAKWIM & CUTI */}
        {activeTab === 'CALENDAR_SETUP' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
            
            {/* Konfigurasi Sesi */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
                <Settings size={16} color="#2563eb" />
                <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>Parameter Kalendar KPM</strong>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '4px' }}>Tahun Sesi Akademik:</label>
                <input type="text" value={sessionYear} onChange={e => setSessionYear(e.target.value)} style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.80rem' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '4px' }}>Tarikh Buka Sekolah:</label>
                  <input type="date" value={termStart} onChange={e => setTermStart(e.target.value)} style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.80rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, marginBottom: '4px' }}>Tarikh Akhir Sesi:</label>
                  <input type="date" value={termEnd} onChange={e => setTermEnd(e.target.value)} style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.80rem' }} />
                </div>
              </div>

              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.75rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.72rem', color: '#1d4ed8', fontWeight: 700, marginBottom: '4px' }}>Statistik Pengoperasian Penjana:</div>
                <div style={{ fontSize: '0.80rem', color: '#0f172a' }}>Kumpulan Sekolah: <strong>{stateGroup === 'GROUP_A' ? 'Kumpulan A (Ahad-Khamis)' : 'Kumpulan B (Isnin-Jumaat)'}</strong></div>
                <div style={{ fontSize: '0.80rem', color: '#16a34a', marginTop: '4px' }}>Jumlah Hari Belajar Efektif (Setahun): <strong>{annualSchoolDays.length} Hari</strong></div>
              </div>
            </div>

            {/* Pengurusan Cuti */}
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
                <Calendar size={16} color="#0f172a" />
                <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>Daftar Cuti Umum & Peristiwa</strong>
              </div>

              <form onSubmit={handleAddHoliday} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-end', marginBottom: '1.25rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.70rem', fontWeight: 700, marginBottom: '4px' }}>Nama Cuti / Acara:</label>
                  <input type="text" value={newHolName} onChange={e => setNewHolName(e.target.value)} required placeholder="Cth: Nuzul Al-Quran / Sukan Tahunan" style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }} />
                </div>
                <div style={{ width: '140px' }}>
                  <label style={{ display: 'block', fontSize: '0.70rem', fontWeight: 700, marginBottom: '4px' }}>Tarikh:</label>
                  <input type="date" value={newHolDate} onChange={e => setNewHolDate(e.target.value)} required style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }} />
                </div>
                <div style={{ width: '140px' }}>
                  <label style={{ display: 'block', fontSize: '0.70rem', fontWeight: 700, marginBottom: '4px' }}>Jenis:</label>
                  <select value={newHolType} onChange={e => setNewHolType(e.target.value as any)} style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', background: '#fff' }}>
                    <option value="PUBLIC">Cuti Umum Rasmi</option>
                    <option value="SCHOOL">Cuti Peristiwa / Acara</option>
                  </select>
                </div>
                <button type="submit" style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '0.45rem 1rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Plus size={14} /> Tambah
                </button>
              </form>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: 700 }}>Tarikh Cuti</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: 700 }}>Perkara / Acara</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 700 }}>Jenis</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 700 }}>Padam</th>
                  </tr>
                </thead>
                <tbody>
                  {holidays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((h) => (
                    <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.5rem', fontWeight: 600, color: '#0f172a' }}>{h.date}</td>
                      <td style={{ padding: '0.5rem', color: '#475569' }}>{h.name}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.66rem', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: h.type === 'PUBLIC' ? '#fee2e2' : '#e0f2fe', color: h.type === 'PUBLIC' ? '#b91c1c' : '#0369a1' }}>
                          {h.type === 'PUBLIC' ? 'Cuti Umum' : 'Acara Sekolah'}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        <button onClick={() => handleRemoveHoliday(h.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={13}/></button>
                      </td>
                    </tr>
                  ))}
                  {holidays.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8' }}>Tiada cuti didaftarkan.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: AUDIT JAM PdP (SPI KPM) */}
        {activeTab === 'AUDIT_REPORT' && (
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={16} color="#0f172a" />
                <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>Laporan Semakan Jam PdP Setahun (Selepas Ditolak Cuti Umum)</strong>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                *Sila jadualkan kelas ganti jika terdapat Subjek yang berstatus Merah (Defisit)
              </span>
            </div>

            {auditReport.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                Tiada rekod. Sila pastikan anda telah menjana jadual induk di Langkah 5 terlebih dahulu.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #cbd5e1' }}>
                      <th style={{ padding: '0.6rem 0.8rem', textAlign: 'left', fontWeight: 700, color: '#334155' }}>Kelas</th>
                      <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', fontWeight: 700, color: '#334155' }}>Kod Subjek</th>
                      <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', fontWeight: 700, color: '#334155' }}>Waktu Seminggu</th>
                      <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', fontWeight: 700, color: '#334155' }}>Sasaran Jam (KPM)</th>
                      <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', fontWeight: 700, color: '#334155' }}>Jam Tercapai</th>
                      <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', fontWeight: 700, color: '#334155' }}>Status Jam</th>
                      <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', fontWeight: 700, color: '#334155' }}>Tindakan Pengurusan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditReport.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: row.deficitHours > 0 ? '#fef2f2' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc') }}>
                        <td style={{ padding: '0.5rem 0.8rem', fontWeight: 600, color: '#0f172a' }}>{row.className}</td>
                        <td style={{ padding: '0.5rem 0.8rem', textAlign: 'center', fontWeight: 700, color: '#2563eb' }}>{row.subjectCode}</td>
                        <td style={{ padding: '0.5rem 0.8rem', textAlign: 'center', color: '#475569' }}>{row.weeklySlots}W</td>
                        <td style={{ padding: '0.5rem 0.8rem', textAlign: 'center', color: '#475569' }}>{row.targetAnnualHours} Jam</td>
                        <td style={{ padding: '0.5rem 0.8rem', textAlign: 'center', fontWeight: 700, color: row.deficitHours > 0 ? '#dc2626' : '#16a34a' }}>
                          {row.actualAnnualHours} Jam
                        </td>
                        <td style={{ padding: '0.5rem 0.8rem', textAlign: 'center' }}>
                          {row.deficitHours > 0 ? (
                            <span style={{ color: '#b91c1c', fontWeight: 700, fontSize: '0.70rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <AlertTriangle size={12} /> Kekurangan (-{row.deficitHours} Jam)
                            </span>
                          ) : (
                            <span style={{ color: '#166534', fontWeight: 600, fontSize: '0.70rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <CheckCircle size={12} /> Cukup Mesti
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.5rem 0.8rem', textAlign: 'center', color: '#64748b', fontSize: '0.70rem' }}>
                          {row.deficitHours > 0 ? 'Rancang Kelas Ganti' : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* BAR NAVIGASI BAWAH */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
          <button
            type="button"
            onClick={onBack}
            style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#475569', padding: '0.55rem 1.25rem', borderRadius: '8px', fontSize: '0.80rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={16} /> Kembali ke Jadual
          </button>
        </div>

      </div>
    </div>
  );
}