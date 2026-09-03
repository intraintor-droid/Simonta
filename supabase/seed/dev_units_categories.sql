-- ============================================================
-- SIMONTA — SEED DATA (DEVELOPMENT ONLY)
-- Jangan jalankan file ini di project Supabase PRODUCTION.
-- Data di bawah adalah CONTOH/PLACEHOLDER, bukan struktur organisasi resmi.
-- ============================================================

insert into units (code, name, description) values
  ('SEK', 'Subbagian Tata Usaha', 'Administrasi umum dan kepegawaian (contoh/development)'),
  ('SPP', 'Seksi Survei dan Pemetaan', 'Pengukuran dan pemetaan kadastral (contoh/development)'),
  ('SHP', 'Seksi Hubungan Hukum Pertanahan', 'Pengelolaan hak atas tanah (contoh/development)'),
  ('SPT', 'Seksi Penataan dan Pemberdayaan Pertanahan', 'Penataan pertanahan (contoh/development)'),
  ('SPS', 'Seksi Pengadaan Tanah', 'Pengadaan tanah untuk kepentingan umum (contoh/development)')
on conflict (code) do nothing;

insert into work_categories (code, name, description) values
  ('UKUR', 'Pengukuran Bidang Tanah', 'Kegiatan pengukuran dan pemetaan bidang tanah'),
  ('SERT', 'Penerbitan Sertifikat', 'Proses penerbitan sertifikat hak atas tanah'),
  ('PTSL', 'Pendaftaran Tanah Sistematis Lengkap', 'Program PTSL'),
  ('PENG', 'Pengaduan Masyarakat', 'Penanganan pengaduan terkait pertanahan'),
  ('ADM', 'Administrasi Umum', 'Pekerjaan administratif kantor')
on conflict (code) do nothing;
