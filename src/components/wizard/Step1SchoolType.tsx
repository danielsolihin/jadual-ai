// src/components/wizard/Step1SchoolType.tsx
'use client';

import React from 'react';
import { SchoolProfileState, SchoolType, SchoolSession, StateGroup } from '@/types/timetable';
import styles from './Step1SchoolType.module.css';
import { 
  School, 
  GraduationCap, 
  ArrowRight, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Check, 
  Building2 
} from 'lucide-react';

interface Props {
  data: SchoolProfileState;
  onChange: (updated: Partial<SchoolProfileState>) => void;
  onNext: () => void;
}

export default function Step1SchoolType({ data, onChange, onNext }: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.name.trim() || !data.code.trim()) {
      alert('Sila lengkapkan Nama Sekolah dan Kod Sekolah.');
      return;
    }
    onNext();
  };

  const isPrimary = data.schoolType === 'PRIMARY_KSSR';
  const isSecondary = data.schoolType === 'SECONDARY_KSSM';
  const isGroupB = data.stateGroup === 'GROUP_B';
  const isSingleSession = data.sessionStructure === 'SINGLE_SESSION';

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
        {/* HEADER LANGKAH (KEMAS DENGAN LENCANA PIL BIRU)            */}
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
              Langkah 1 daripada 6
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Profil & Templat Sekolah</span>
          </div>

          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.3px' }}>
            Konfigurasi Profil & Templat Pintar
          </h1>
          <p style={{ fontSize: '0.80rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
            Pilih jenis institusi bagi memuatkan peruntukan jam kredit minimum dan silibus SPI KPM secara automatik.
          </p>
        </div>

        {/* ======================================================== */}
        {/* SEKSYEN 1: PILIHAN TEMPLAT SEKOLAH (KAD INTERAKTIF)      */}
        {/* ======================================================== */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
            Pilih Jenis Sekolah (Templat Pekeliling Ikhtisas KPM):
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {/* Opsyen Sekolah Rendah (KSSR) */}
            <div
              onClick={() => onChange({ schoolType: 'PRIMARY_KSSR' })}
              style={{
                borderRadius: '12px',
                border: isPrimary ? '2px solid #2563eb' : '1px solid #e2e8f0',
                backgroundColor: isPrimary ? '#f8faff' : '#ffffff',
                padding: '1rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative',
                boxShadow: isPrimary ? '0 4px 12px rgba(37,99,235,0.08)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    backgroundColor: isPrimary ? '#dbeafe' : '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <School size={18} color={isPrimary ? '#1d4ed8' : '#64748b'} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: isPrimary ? '#1d4ed8' : '#0f172a' }}>
                      Sekolah Rendah (KSSR)
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Tahun 1 hingga Tahun 6</div>
                  </div>
                </div>

                {isPrimary && (
                  <span style={{ backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '9999px', padding: '2px 8px', fontSize: '0.62rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <Check size={10} /> Dipilih
                  </span>
                )}
              </div>

              <p style={{ fontSize: '0.72rem', color: '#475569', margin: '6px 0 8px 0', lineHeight: 1.4 }}>
                Dioptimumkan untuk struktur kelas tetap, slot asas 30 minit, dan subjek selari Pendidikan Islam / Moral.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', color: '#334155' }}>
                  <CheckCircle2 size={12} color="#16a34a" />
                  <span>Tahap 1: <strong>704 Jam</strong> (44 Waktu Seminggu)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', color: '#334155' }}>
                  <CheckCircle2 size={12} color="#16a34a" />
                  <span>Tahap 2: <strong>752 Jam</strong> (47 Waktu Seminggu)</span>
                </div>
              </div>
            </div>

            {/* Opsyen Sekolah Menengah (KSSM) */}
            <div
              onClick={() => onChange({ schoolType: 'SECONDARY_KSSM' })}
              style={{
                borderRadius: '12px',
                border: isSecondary ? '2px solid #2563eb' : '1px solid #e2e8f0',
                backgroundColor: isSecondary ? '#f8faff' : '#ffffff',
                padding: '1rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative',
                boxShadow: isSecondary ? '0 4px 12px rgba(37,99,235,0.08)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    backgroundColor: isSecondary ? '#dbeafe' : '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <GraduationCap size={18} color={isSecondary ? '#1d4ed8' : '#64748b'} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: isSecondary ? '#1d4ed8' : '#0f172a' }}>
                      Sekolah Menengah (KSSM)
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Tingkatan 1 hingga Tingkatan 5</div>
                  </div>
                </div>

                {isSecondary && (
                  <span style={{ backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '9999px', padding: '2px 8px', fontSize: '0.62rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <Check size={10} /> Dipilih
                  </span>
                )}
              </div>

              <p style={{ fontSize: '0.72rem', color: '#475569', margin: '6px 0 8px 0', lineHeight: 1.4 }}>
                Menyokong modul pakej elektif terapung (STEM & Kemanusiaan) serta pergerakan bilik makmal khas.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', color: '#334155' }}>
                  <CheckCircle2 size={12} color="#16a34a" />
                  <span>Men. Rendah: <strong>856 Jam</strong> (54 Waktu)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', color: '#334155' }}>
                  <CheckCircle2 size={12} color="#16a34a" />
                  <span>Men. Atas: <strong>60 - 64 Waktu</strong> (Teras + Elektif)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SEKSYEN 2: KOD & NAMA SEKOLAH (INPUT SEJAJAR)             */}
        {/* ======================================================== */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2.5fr',
          gap: '0.75rem',
          marginBottom: '1.25rem',
          backgroundColor: '#f8fafc',
          padding: '0.9rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
              Kod Sekolah:
            </label>
            <input
              type="text"
              placeholder="Cth: BEA4601"
              value={data.code}
              onChange={(e) => onChange({ code: e.target.value.toUpperCase() })}
              style={{
                width: '100%',
                padding: '0.45rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.80rem',
                fontWeight: 700,
                color: '#0f172a',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
              Nama Sekolah:
            </label>
            <input
              type="text"
              placeholder="Cth: SK Dato' Mohd Said"
              value={data.name}
              onChange={(e) => onChange({ name: e.target.value })}
              style={{
                width: '100%',
                padding: '0.45rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.80rem',
                fontWeight: 600,
                color: '#0f172a',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>
        </div>

        {/* ======================================================== */}
        {/* SEKSYEN 3: KUMPULAN NEGERI & STRUKTUR SESI (KAD PINTAR)  */}
        {/* ======================================================== */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          
          {/* Kumpulan Hari Persekolahan Negeri */}
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
              Kumpulan Takwim Persekolahan:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div
                onClick={() => onChange({ stateGroup: 'GROUP_B' })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '8px',
                  border: isGroupB ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                  backgroundColor: isGroupB ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <input
                  type="radio"
                  name="stateGroup"
                  checked={isGroupB}
                  onChange={() => onChange({ stateGroup: 'GROUP_B' })}
                  style={{ accentColor: '#2563eb', cursor: 'pointer' }}
                />
                <div style={{ fontSize: '0.74rem', color: isGroupB ? '#1e40af' : '#334155', fontWeight: isGroupB ? 700 : 500 }}>
                  <strong>Kumpulan B:</strong> Isnin – Jumaat (Majoriti Negeri)
                </div>
              </div>

              <div
                onClick={() => onChange({ stateGroup: 'GROUP_A' })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '8px',
                  border: !isGroupB ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                  backgroundColor: !isGroupB ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <input
                  type="radio"
                  name="stateGroup"
                  checked={!isGroupB}
                  onChange={() => onChange({ stateGroup: 'GROUP_A' })}
                  style={{ accentColor: '#2563eb', cursor: 'pointer' }}
                />
                <div style={{ fontSize: '0.74rem', color: !isGroupB ? '#1e40af' : '#334155', fontWeight: !isGroupB ? 700 : 500 }}>
                  <strong>Kumpulan A:</strong> Ahad – Khamis (JHR, KDH, KTN, TRG)
                </div>
              </div>
            </div>
          </div>

          {/* Struktur Sesi Persekolahan */}
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
              Struktur Sesi Persekolahan:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div
                onClick={() => onChange({ sessionStructure: 'SINGLE_SESSION' })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '8px',
                  border: isSingleSession ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                  backgroundColor: isSingleSession ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <input
                  type="radio"
                  name="sessionStructure"
                  checked={isSingleSession}
                  onChange={() => onChange({ sessionStructure: 'SINGLE_SESSION' })}
                  style={{ accentColor: '#2563eb', cursor: 'pointer' }}
                />
                <div style={{ fontSize: '0.74rem', color: isSingleSession ? '#1e40af' : '#334155', fontWeight: isSingleSession ? 700 : 500 }}>
                  <strong>Satu Sesi:</strong> Sesi Pagi Sahaja
                </div>
              </div>

              <div
                onClick={() => onChange({ sessionStructure: 'DOUBLE_SESSION' })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '8px',
                  border: !isSingleSession ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                  backgroundColor: !isSingleSession ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <input
                  type="radio"
                  name="sessionStructure"
                  checked={!isSingleSession}
                  onChange={() => onChange({ sessionStructure: 'DOUBLE_SESSION' })}
                  style={{ accentColor: '#2563eb', cursor: 'pointer' }}
                />
                <div style={{ fontSize: '0.74rem', color: !isSingleSession ? '#1e40af' : '#334155', fontWeight: !isSingleSession ? 700 : 500 }}>
                  <strong>Dua Sesi:</strong> Sesi Pagi & Petang
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* FOOTER TINDAKAN: BUTANG SETERUSNYA                       */}
        {/* ======================================================== */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          borderTop: '1px solid #f1f5f9',
          paddingTop: '1rem'
        }}>
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
            <span>Seterusnya: Tetapan Masa & Rehat</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}