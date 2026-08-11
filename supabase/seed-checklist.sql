-- =====================================================================
-- Seed kurikulum Capaian Belajar: checklist_groups / checklist_items /
-- checklist_item_subtests.
-- Sumber: Salinan Tracker SNBT 2026 by TTL Indonesia.xlsx
--         (sheet PU, PBMPPU, PKPM, LBEng, LBInd)
--
-- Jalankan SETELAH supabase/apply-now.sql (DDL 4 tabel checklist).
-- Aman kalau kepencet dua kali: guard di bawah membatalkan seluruh
-- transaksi kalau tabel sudah terisi, jadi tidak pernah dobel.
-- =====================================================================
BEGIN;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM checklist_groups) THEN
    RAISE EXCEPTION 'checklist_groups sudah terisi — seed dibatalkan (hapus dulu kalau mau re-seed)';
  END IF;
END $$;

WITH g AS (INSERT INTO checklist_groups (name, sort_order) VALUES ('Logika Dasar', 1) RETURNING id)
, items AS (INSERT INTO checklist_items (group_id, name, sort_order) VALUES ((SELECT id FROM g), 'Logika Matematika (Dasar)', 1), ((SELECT id FROM g), 'Proposisi, Kalimat Terbuka/Tertutup', 2), ((SELECT id FROM g), 'Logika Kuantor, Operasi Logika', 3) RETURNING id, name, sort_order)
INSERT INTO checklist_item_subtests (item_id, subtest_code)
SELECT id, 'PU' FROM items WHERE name = 'Logika Matematika (Dasar)' AND sort_order = 1 UNION ALL SELECT id, 'PU' FROM items WHERE name = 'Proposisi, Kalimat Terbuka/Tertutup' AND sort_order = 2 UNION ALL SELECT id, 'PU' FROM items WHERE name = 'Logika Kuantor, Operasi Logika' AND sort_order = 3;

WITH g AS (INSERT INTO checklist_groups (name, sort_order) VALUES ('Penalaran Deduktif', 2) RETURNING id)
, items AS (INSERT INTO checklist_items (group_id, name, sort_order) VALUES ((SELECT id FROM g), 'Silogisme', 1), ((SELECT id FROM g), 'Modus Ponens', 2), ((SELECT id FROM g), 'Modus Tollens', 3), ((SELECT id FROM g), 'Memperkuat/Memperlemah Argumen', 4), ((SELECT id FROM g), 'Evaluasi Bukti', 5), ((SELECT id FROM g), 'Simpulan', 6) RETURNING id, name, sort_order)
INSERT INTO checklist_item_subtests (item_id, subtest_code)
SELECT id, 'PU' FROM items WHERE name = 'Silogisme' AND sort_order = 1 UNION ALL SELECT id, 'PU' FROM items WHERE name = 'Modus Ponens' AND sort_order = 2 UNION ALL SELECT id, 'PU' FROM items WHERE name = 'Modus Tollens' AND sort_order = 3 UNION ALL SELECT id, 'PU' FROM items WHERE name = 'Memperkuat/Memperlemah Argumen' AND sort_order = 4 UNION ALL SELECT id, 'PU' FROM items WHERE name = 'Evaluasi Bukti' AND sort_order = 5 UNION ALL SELECT id, 'PU' FROM items WHERE name = 'Simpulan' AND sort_order = 6;

WITH g AS (INSERT INTO checklist_groups (name, sort_order) VALUES ('Penalaran Induktif', 3) RETURNING id)
, items AS (INSERT INTO checklist_items (group_id, name, sort_order) VALUES ((SELECT id FROM g), 'Generalisasi', 1), ((SELECT id FROM g), 'Analogi', 2), ((SELECT id FROM g), 'Hubungan Kausalitas', 3) RETURNING id, name, sort_order)
INSERT INTO checklist_item_subtests (item_id, subtest_code)
SELECT id, 'PU' FROM items WHERE name = 'Generalisasi' AND sort_order = 1 UNION ALL SELECT id, 'PU' FROM items WHERE name = 'Analogi' AND sort_order = 2 UNION ALL SELECT id, 'PU' FROM items WHERE name = 'Hubungan Kausalitas' AND sort_order = 3;

WITH g AS (INSERT INTO checklist_groups (name, sort_order) VALUES ('Penalaran Kuantitatif', 4) RETURNING id)
, items AS (INSERT INTO checklist_items (group_id, name, sort_order) VALUES ((SELECT id FROM g), 'Teori dan Jenis Bilangan', 1), ((SELECT id FROM g), 'Sifat-sifat Bilangan', 2), ((SELECT id FROM g), 'Statistik Dasar', 3), ((SELECT id FROM g), 'Grafik/Tabel', 4), ((SELECT id FROM g), 'Soal Cerita', 5), ((SELECT id FROM g), 'Peluang Dasar dan Pencacahan', 6), ((SELECT id FROM g), 'Barisan dan Deret', 7), ((SELECT id FROM g), 'Persentase', 8), ((SELECT id FROM g), 'Diskon dan Bunga Bank', 9) RETURNING id, name, sort_order)
INSERT INTO checklist_item_subtests (item_id, subtest_code)
SELECT id, 'PU' FROM items WHERE name = 'Teori dan Jenis Bilangan' AND sort_order = 1 UNION ALL SELECT id, 'PU' FROM items WHERE name = 'Sifat-sifat Bilangan' AND sort_order = 2 UNION ALL SELECT id, 'PU' FROM items WHERE name = 'Statistik Dasar' AND sort_order = 3 UNION ALL SELECT id, 'PU' FROM items WHERE name = 'Grafik/Tabel' AND sort_order = 4 UNION ALL SELECT id, 'PU' FROM items WHERE name = 'Soal Cerita' AND sort_order = 5 UNION ALL SELECT id, 'PU' FROM items WHERE name = 'Peluang Dasar dan Pencacahan' AND sort_order = 6 UNION ALL SELECT id, 'PU' FROM items WHERE name = 'Barisan dan Deret' AND sort_order = 7 UNION ALL SELECT id, 'PU' FROM items WHERE name = 'Persentase' AND sort_order = 8 UNION ALL SELECT id, 'PU' FROM items WHERE name = 'Diskon dan Bunga Bank' AND sort_order = 9;

WITH g AS (INSERT INTO checklist_groups (name, sort_order) VALUES ('Ejaan', 5) RETURNING id)
, items AS (INSERT INTO checklist_items (group_id, name, sort_order) VALUES ((SELECT id FROM g), 'Huruf Kapital dan Ejaan (EYD V)', 1), ((SELECT id FROM g), 'Tanda Baca', 2), ((SELECT id FROM g), 'Makna Imbuhan', 3) RETURNING id, name, sort_order)
INSERT INTO checklist_item_subtests (item_id, subtest_code)
SELECT id, 'PBM' FROM items WHERE name = 'Huruf Kapital dan Ejaan (EYD V)' AND sort_order = 1 UNION ALL SELECT id, 'PBM' FROM items WHERE name = 'Tanda Baca' AND sort_order = 2 UNION ALL SELECT id, 'PBM' FROM items WHERE name = 'Makna Imbuhan' AND sort_order = 3;

WITH g AS (INSERT INTO checklist_groups (name, sort_order) VALUES ('Konjungsi dan Partikel', 6) RETURNING id)
, items AS (INSERT INTO checklist_items (group_id, name, sort_order) VALUES ((SELECT id FROM g), 'Preposisi', 1), ((SELECT id FROM g), 'Kata hubung/Konjungsi', 2), ((SELECT id FROM g), 'Partikel dan Bentuk Terikat', 3) RETURNING id, name, sort_order)
INSERT INTO checklist_item_subtests (item_id, subtest_code)
SELECT id, 'PBM' FROM items WHERE name = 'Preposisi' AND sort_order = 1 UNION ALL SELECT id, 'PBM' FROM items WHERE name = 'Kata hubung/Konjungsi' AND sort_order = 2 UNION ALL SELECT id, 'PBM' FROM items WHERE name = 'Partikel dan Bentuk Terikat' AND sort_order = 3;

WITH g AS (INSERT INTO checklist_groups (name, sort_order) VALUES ('Pembentukan Kata', 7) RETURNING id)
, items AS (INSERT INTO checklist_items (group_id, name, sort_order) VALUES ((SELECT id FROM g), 'Bentuk/Jenis Kata', 1), ((SELECT id FROM g), 'Kata Baku dan Tidak Baku', 2) RETURNING id, name, sort_order)
INSERT INTO checklist_item_subtests (item_id, subtest_code)
SELECT id, 'PBM' FROM items WHERE name = 'Bentuk/Jenis Kata' AND sort_order = 1 UNION ALL SELECT id, 'PBM' FROM items WHERE name = 'Kata Baku dan Tidak Baku' AND sort_order = 2;

WITH g AS (INSERT INTO checklist_groups (name, sort_order) VALUES ('Makna Kata', 8) RETURNING id)
, items AS (INSERT INTO checklist_items (group_id, name, sort_order) VALUES ((SELECT id FROM g), 'Penggunaan Istillah/Kata', 1), ((SELECT id FROM g), 'Perubahan Makna Kata', 2), ((SELECT id FROM g), 'Makna Bertingkat/Hierarkis', 3) RETURNING id, name, sort_order)
INSERT INTO checklist_item_subtests (item_id, subtest_code)
SELECT id, 'PPU' FROM items WHERE name = 'Penggunaan Istillah/Kata' AND sort_order = 1 UNION ALL SELECT id, 'PPU' FROM items WHERE name = 'Perubahan Makna Kata' AND sort_order = 2 UNION ALL SELECT id, 'PPU' FROM items WHERE name = 'Makna Bertingkat/Hierarkis' AND sort_order = 3;

WITH g AS (INSERT INTO checklist_groups (name, sort_order) VALUES ('Frasa dan Klausa', 9) RETURNING id)
, items AS (INSERT INTO checklist_items (group_id, name, sort_order) VALUES ((SELECT id FROM g), 'Kata Berpasangan', 1), ((SELECT id FROM g), 'Frasa/Kelompok Kata', 2), ((SELECT id FROM g), 'Klausa', 3) RETURNING id, name, sort_order)
INSERT INTO checklist_item_subtests (item_id, subtest_code)
SELECT id, 'PPU' FROM items WHERE name = 'Kata Berpasangan' AND sort_order = 1 UNION ALL SELECT id, 'PBM' FROM items WHERE name = 'Frasa/Kelompok Kata' AND sort_order = 2 UNION ALL SELECT id, 'PBM' FROM items WHERE name = 'Klausa' AND sort_order = 3;

WITH g AS (INSERT INTO checklist_groups (name, sort_order) VALUES ('Struktur Kalimat', 10) RETURNING id)
, items AS (INSERT INTO checklist_items (group_id, name, sort_order) VALUES ((SELECT id FROM g), 'Struktur Kalimat/Tata Kalimat', 1), ((SELECT id FROM g), 'Jenis Kalimat', 2), ((SELECT id FROM g), 'Hubungan Antar Kalimat', 3) RETURNING id, name, sort_order)
INSERT INTO checklist_item_subtests (item_id, subtest_code)
SELECT id, 'PBM' FROM items WHERE name = 'Struktur Kalimat/Tata Kalimat' AND sort_order = 1 UNION ALL SELECT id, 'PBM' FROM items WHERE name = 'Jenis Kalimat' AND sort_order = 2 UNION ALL SELECT id, 'PBM' FROM items WHERE name = 'Hubungan Antar Kalimat' AND sort_order = 3;

WITH g AS (INSERT INTO checklist_groups (name, sort_order) VALUES ('Aplikasi Kalimat', 11) RETURNING id)
, items AS (INSERT INTO checklist_items (group_id, name, sort_order) VALUES ((SELECT id FROM g), 'Semantik/Tata Makna', 1), ((SELECT id FROM g), 'Kalimat Majemuk', 2), ((SELECT id FROM g), 'Transformasi Kalimat', 3), ((SELECT id FROM g), 'Inti Kalimat', 4), ((SELECT id FROM g), 'Kalimat Efektif/Tidak Efektif', 5), ((SELECT id FROM g), 'Kalimat Sumbang', 6), ((SELECT id FROM g), 'Kelogisan Kalimat', 7) RETURNING id, name, sort_order)
INSERT INTO checklist_item_subtests (item_id, subtest_code)
SELECT id, 'PPU' FROM items WHERE name = 'Semantik/Tata Makna' AND sort_order = 1 UNION ALL SELECT id, 'PPU' FROM items WHERE name = 'Kalimat Majemuk' AND sort_order = 2 UNION ALL SELECT id, 'PPU' FROM items WHERE name = 'Transformasi Kalimat' AND sort_order = 3 UNION ALL SELECT id, 'PPU' FROM items WHERE name = 'Inti Kalimat' AND sort_order = 4 UNION ALL SELECT id, 'PBM' FROM items WHERE name = 'Kalimat Efektif/Tidak Efektif' AND sort_order = 5 UNION ALL SELECT id, 'PBM' FROM items WHERE name = 'Kalimat Sumbang' AND sort_order = 6 UNION ALL SELECT id, 'PPU' FROM items WHERE name = 'Kelogisan Kalimat' AND sort_order = 7;

WITH g AS (INSERT INTO checklist_groups (name, sort_order) VALUES ('Paragraf', 12) RETURNING id)
, items AS (INSERT INTO checklist_items (group_id, name, sort_order) VALUES ((SELECT id FROM g), 'Hubungan Antar Kalimat', 1), ((SELECT id FROM g), 'Kepaduan paragraf', 2), ((SELECT id FROM g), 'Kalimat Utama dalam Teks', 3) RETURNING id, name, sort_order)
INSERT INTO checklist_item_subtests (item_id, subtest_code)
SELECT id, 'PPU' FROM items WHERE name = 'Hubungan Antar Kalimat' AND sort_order = 1 UNION ALL SELECT id, 'PPU' FROM items WHERE name = 'Kepaduan paragraf' AND sort_order = 2 UNION ALL SELECT id, 'PPU' FROM items WHERE name = 'Kalimat Utama dalam Teks' AND sort_order = 3;

WITH g AS (INSERT INTO checklist_groups (name, sort_order) VALUES ('Bacaan', 13) RETURNING id)
, items AS (INSERT INTO checklist_items (group_id, name, sort_order) VALUES ((SELECT id FROM g), 'Tema dan Topik', 1), ((SELECT id FROM g), 'Gagasan/Ide Pokok', 2), ((SELECT id FROM g), 'Ungkapan', 3) RETURNING id, name, sort_order)
INSERT INTO checklist_item_subtests (item_id, subtest_code)
SELECT id, 'PPU' FROM items WHERE name = 'Tema dan Topik' AND sort_order = 1 UNION ALL SELECT id, 'PPU' FROM items WHERE name = 'Gagasan/Ide Pokok' AND sort_order = 2 UNION ALL SELECT id, 'PPU' FROM items WHERE name = 'Ungkapan' AND sort_order = 3;

WITH g AS (INSERT INTO checklist_groups (name, sort_order) VALUES ('Bahasa Panda', 14) RETURNING id)
, items AS (INSERT INTO checklist_items (group_id, name, sort_order) VALUES ((SELECT id FROM g), 'Bahasa Hipotesis', 1) RETURNING id, name, sort_order)
INSERT INTO checklist_item_subtests (item_id, subtest_code)
SELECT id, 'PPU' FROM items WHERE name = 'Bahasa Hipotesis' AND sort_order = 1;

WITH g AS (INSERT INTO checklist_groups (name, sort_order) VALUES ('Operasi Matematika Dasar', 15) RETURNING id)
, items AS (INSERT INTO checklist_items (group_id, name, sort_order) VALUES ((SELECT id FROM g), 'Operasi MTK Dasar (PEMDAS)', 1), ((SELECT id FROM g), 'Operasi Pecahan, Desimal, Persentase', 2), ((SELECT id FROM g), 'Sistem Koordinat', 3) RETURNING id, name, sort_order)
INSERT INTO checklist_item_subtests (item_id, subtest_code)
SELECT id, 'PK' FROM items WHERE name = 'Operasi MTK Dasar (PEMDAS)' AND sort_order = 1 UNION ALL SELECT id, 'PM' FROM items WHERE name = 'Operasi MTK Dasar (PEMDAS)' AND sort_order = 1 UNION ALL SELECT id, 'PK' FROM items WHERE name = 'Operasi Pecahan, Desimal, Persentase' AND sort_order = 2 UNION ALL SELECT id, 'PM' FROM items WHERE name = 'Operasi Pecahan, Desimal, Persentase' AND sort_order = 2 UNION ALL SELECT id, 'PK' FROM items WHERE name = 'Sistem Koordinat' AND sort_order = 3 UNION ALL SELECT id, 'PM' FROM items WHERE name = 'Sistem Koordinat' AND sort_order = 3;

WITH g AS (INSERT INTO checklist_groups (name, sort_order) VALUES ('Bilangan', 16) RETURNING id)
, items AS (INSERT INTO checklist_items (group_id, name, sort_order) VALUES ((SELECT id FROM g), 'Teori dan Jenis Bilangan', 1), ((SELECT id FROM g), 'Sifat-sifat Bilangan', 2), ((SELECT id FROM g), 'KPK, FPB dan Aplikasinya', 3) RETURNING id, name, sort_order)
INSERT INTO checklist_item_subtests (item_id, subtest_code)
SELECT id, 'PM' FROM items WHERE name = 'Teori dan Jenis Bilangan' AND sort_order = 1 UNION ALL SELECT id, 'PM' FROM items WHERE name = 'Sifat-sifat Bilangan' AND sort_order = 2 UNION ALL SELECT id, 'PM' FROM items WHERE name = 'KPK, FPB dan Aplikasinya' AND sort_order = 3;

WITH g AS (INSERT INTO checklist_groups (name, sort_order) VALUES ('Aljabar Dasar', 17) RETURNING id)
, items AS (INSERT INTO checklist_items (group_id, name, sort_order) VALUES ((SELECT id FROM g), 'Operasi Aljabar Sederhana', 1), ((SELECT id FROM g), 'Penyederhanaan, Faktorisasi, Distribusi Aljabar', 2), ((SELECT id FROM g), 'Persamaan Aljabar', 3), ((SELECT id FROM g), 'Pertidaksamaan Aljabar', 4) RETURNING id, name, sort_order)
INSERT INTO checklist_item_subtests (item_id, subtest_code)
SELECT id, 'PK' FROM items WHERE name = 'Operasi Aljabar Sederhana' AND sort_order = 1 UNION ALL SELECT id, 'PK' FROM items WHERE name = 'Penyederhanaan, Faktorisasi, Distribusi Aljabar' AND sort_order = 2 UNION ALL SELECT id, 'PM' FROM items WHERE name = 'Persamaan Aljabar' AND sort_order = 3 UNION ALL SELECT id, 'PM' FROM items WHERE name = 'Pertidaksamaan Aljabar' AND sort_order = 4;

WITH g AS (INSERT INTO checklist_groups (name, sort_order) VALUES ('Perbandingan', 18) RETURNING id)
, items AS (INSERT INTO checklist_items (group_id, name, sort_order) VALUES ((SELECT id FROM g), 'Konsep Perbandingan', 1) RETURNING id, name, sort_order)
INSERT INTO checklist_item_subtests (item_id, subtest_code)
SELECT id, 'PM' FROM items WHERE name = 'Konsep Perbandingan' AND sort_order = 1;

WITH g AS (INSERT INTO checklist_groups (name, sort_order) VALUES ('Akar, Pangkat, Logaritma', 19) RETURNING id)
, items AS (INSERT INTO checklist_items (group_id, name, sort_order) VALUES ((SELECT id FROM g), 'Akar dan Eksponen', 1), ((SELECT id FROM g), 'Logaritma*', 2) RETURNING id, name, sort_order)
INSERT INTO checklist_item_subtests (item_id, subtest_code)
SELECT id, 'PK' FROM items WHERE name = 'Akar dan Eksponen' AND sort_order = 1 UNION ALL SELECT id, 'PK' FROM items WHERE name = 'Logaritma*' AND sort_order = 2;

WITH g AS (INSERT INTO checklist_groups (name, sort_order) VALUES ('Himpunan, Fungsi dan Persamaan Garis', 20) RETURNING id)
, items AS (INSERT INTO checklist_items (group_id, name, sort_order) VALUES ((SELECT id FROM g), 'Himpunan', 1), ((SELECT id FROM g), 'Persamaan Garis Lurus', 2), ((SELECT id FROM g), 'Fungsi, Relasi, Komposisi, Invers', 3), ((SELECT id FROM g), 'Persamaan dan Fungsi Kuadrat', 4) RETURNING id, name, sort_order)
INSERT INTO checklist_item_subtests (item_id, subtest_code)
SELECT id, 'PK' FROM items WHERE name = 'Himpunan' AND sort_order = 1 UNION ALL SELECT id, 'PK' FROM items WHERE name = 'Persamaan Garis Lurus' AND sort_order = 2 UNION ALL SELECT id, 'PK' FROM items WHERE name = 'Fungsi, Relasi, Komposisi, Invers' AND sort_order = 3 UNION ALL SELECT id, 'PK' FROM items WHERE name = 'Persamaan dan Fungsi Kuadrat' AND sort_order = 4;

WITH g AS (INSERT INTO checklist_groups (name, sort_order) VALUES ('Sistem Persamaan', 21) RETURNING id)
, items AS (INSERT INTO checklist_items (group_id, name, sort_order) VALUES ((SELECT id FROM g), 'SPLDV/SPLTV', 1), ((SELECT id FROM g), 'Persamaan Berbentuk Flowchart', 2) RETURNING id, name, sort_order)
INSERT INTO checklist_item_subtests (item_id, subtest_code)
SELECT id, 'PM' FROM items WHERE name = 'SPLDV/SPLTV' AND sort_order = 1 UNION ALL SELECT id, 'PM' FROM items WHERE name = 'Persamaan Berbentuk Flowchart' AND sort_order = 2;

WITH g AS (INSERT INTO checklist_groups (name, sort_order) VALUES ('Geometri', 22) RETURNING id)
, items AS (INSERT INTO checklist_items (group_id, name, sort_order) VALUES ((SELECT id FROM g), 'Kesebangunan dan Bangun Datar Kompleks', 1), ((SELECT id FROM g), 'Sudut dan Operasi Sudut', 2), ((SELECT id FROM g), 'Sifat Bangun Datar dan Ruang', 3), ((SELECT id FROM g), 'Trigonometri Dasar', 4), ((SELECT id FROM g), 'Dimensi Tiga', 5), ((SELECT id FROM g), 'Jarak Titik, Garis dan Bidang', 6), ((SELECT id FROM g), 'Bangun Datar, Luas dan Keliling', 7), ((SELECT id FROM g), 'Bangun Ruang, Luas dan Volume', 8) RETURNING id, name, sort_order)
INSERT INTO checklist_item_subtests (item_id, subtest_code)
SELECT id, 'PM' FROM items WHERE name = 'Kesebangunan dan Bangun Datar Kompleks' AND sort_order = 1 UNION ALL SELECT id, 'PK' FROM items WHERE name = 'Sudut dan Operasi Sudut' AND sort_order = 2 UNION ALL SELECT id, 'PK' FROM items WHERE name = 'Sifat Bangun Datar dan Ruang' AND sort_order = 3 UNION ALL SELECT id, 'PK' FROM items WHERE name = 'Trigonometri Dasar' AND sort_order = 4 UNION ALL SELECT id, 'PK' FROM items WHERE name = 'Dimensi Tiga' AND sort_order = 5 UNION ALL SELECT id, 'PM' FROM items WHERE name = 'Jarak Titik, Garis dan Bidang' AND sort_order = 6 UNION ALL SELECT id, 'PM' FROM items WHERE name = 'Bangun Datar, Luas dan Keliling' AND sort_order = 7 UNION ALL SELECT id, 'PM' FROM items WHERE name = 'Bangun Ruang, Luas dan Volume' AND sort_order = 8;

WITH g AS (INSERT INTO checklist_groups (name, sort_order) VALUES ('Statistika dan Peluang', 23) RETURNING id)
, items AS (INSERT INTO checklist_items (group_id, name, sort_order) VALUES ((SELECT id FROM g), 'Statistik Dasar dan Penyajian Data', 1), ((SELECT id FROM g), 'Penyebaran Data/Tendensi Sentral', 2), ((SELECT id FROM g), 'Peluang Dasar dan Pencacahan', 3), ((SELECT id FROM g), 'Peluang Kejadian, Kombinasi, Permutasi', 4) RETURNING id, name, sort_order)
INSERT INTO checklist_item_subtests (item_id, subtest_code)
SELECT id, 'PK' FROM items WHERE name = 'Statistik Dasar dan Penyajian Data' AND sort_order = 1 UNION ALL SELECT id, 'PM' FROM items WHERE name = 'Statistik Dasar dan Penyajian Data' AND sort_order = 1 UNION ALL SELECT id, 'PK' FROM items WHERE name = 'Penyebaran Data/Tendensi Sentral' AND sort_order = 2 UNION ALL SELECT id, 'PM' FROM items WHERE name = 'Penyebaran Data/Tendensi Sentral' AND sort_order = 2 UNION ALL SELECT id, 'PK' FROM items WHERE name = 'Peluang Dasar dan Pencacahan' AND sort_order = 3 UNION ALL SELECT id, 'PM' FROM items WHERE name = 'Peluang Dasar dan Pencacahan' AND sort_order = 3 UNION ALL SELECT id, 'PK' FROM items WHERE name = 'Peluang Kejadian, Kombinasi, Permutasi' AND sort_order = 4 UNION ALL SELECT id, 'PM' FROM items WHERE name = 'Peluang Kejadian, Kombinasi, Permutasi' AND sort_order = 4;

WITH g AS (INSERT INTO checklist_groups (name, sort_order) VALUES ('Barisan dan Deret', 24) RETURNING id)
, items AS (INSERT INTO checklist_items (group_id, name, sort_order) VALUES ((SELECT id FROM g), 'Barisan-Deret Aritmatika', 1), ((SELECT id FROM g), 'Barisan-Deret Geometri', 2), ((SELECT id FROM g), 'Deret Tak Hingga', 3) RETURNING id, name, sort_order)
INSERT INTO checklist_item_subtests (item_id, subtest_code)
SELECT id, 'PK' FROM items WHERE name = 'Barisan-Deret Aritmatika' AND sort_order = 1 UNION ALL SELECT id, 'PM' FROM items WHERE name = 'Barisan-Deret Aritmatika' AND sort_order = 1 UNION ALL SELECT id, 'PK' FROM items WHERE name = 'Barisan-Deret Geometri' AND sort_order = 2 UNION ALL SELECT id, 'PM' FROM items WHERE name = 'Barisan-Deret Geometri' AND sort_order = 2 UNION ALL SELECT id, 'PK' FROM items WHERE name = 'Deret Tak Hingga' AND sort_order = 3 UNION ALL SELECT id, 'PM' FROM items WHERE name = 'Deret Tak Hingga' AND sort_order = 3;

WITH g AS (INSERT INTO checklist_groups (name, sort_order) VALUES ('Aritmatika Sosial', 25) RETURNING id)
, items AS (INSERT INTO checklist_items (group_id, name, sort_order) VALUES ((SELECT id FROM g), 'Aritmatika Sosial', 1), ((SELECT id FROM g), 'Bunga dan Diskon', 2) RETURNING id, name, sort_order)
INSERT INTO checklist_item_subtests (item_id, subtest_code)
SELECT id, 'PK' FROM items WHERE name = 'Aritmatika Sosial' AND sort_order = 1 UNION ALL SELECT id, 'PM' FROM items WHERE name = 'Aritmatika Sosial' AND sort_order = 1 UNION ALL SELECT id, 'PK' FROM items WHERE name = 'Bunga dan Diskon' AND sort_order = 2 UNION ALL SELECT id, 'PM' FROM items WHERE name = 'Bunga dan Diskon' AND sort_order = 2;

WITH g AS (INSERT INTO checklist_groups (name, sort_order) VALUES ('Matriks dan Transformasi', 26) RETURNING id)
, items AS (INSERT INTO checklist_items (group_id, name, sort_order) VALUES ((SELECT id FROM g), 'Matriks*', 1), ((SELECT id FROM g), 'Transformasi Geometri*', 2) RETURNING id, name, sort_order)
INSERT INTO checklist_item_subtests (item_id, subtest_code)
SELECT id, 'PK' FROM items WHERE name = 'Matriks*' AND sort_order = 1 UNION ALL SELECT id, 'PK' FROM items WHERE name = 'Transformasi Geometri*' AND sort_order = 2;

WITH g AS (INSERT INTO checklist_groups (name, sort_order) VALUES ('Kalkulus', 27) RETURNING id)
, items AS (INSERT INTO checklist_items (group_id, name, sort_order) VALUES ((SELECT id FROM g), 'Limit/Turunan Dasar*', 1) RETURNING id, name, sort_order)
INSERT INTO checklist_item_subtests (item_id, subtest_code)
SELECT id, 'PK' FROM items WHERE name = 'Limit/Turunan Dasar*' AND sort_order = 1;

WITH g AS (INSERT INTO checklist_groups (name, sort_order) VALUES ('Pemahaman Bacaan Bahasa Inggris', 28) RETURNING id)
, items AS (INSERT INTO checklist_items (group_id, name, sort_order) VALUES ((SELECT id FROM g), 'Topic and Main Idea', 1), ((SELECT id FROM g), 'Conclusion', 2), ((SELECT id FROM g), 'Summary of Passage', 3), ((SELECT id FROM g), 'Specific Information', 4), ((SELECT id FROM g), 'Finding Detail Info', 5), ((SELECT id FROM g), 'Purpose of the Text', 6), ((SELECT id FROM g), 'Author''s Tone/Attitude', 7), ((SELECT id FROM g), 'Writer''s motive', 8), ((SELECT id FROM g), 'Synonym and Antonym', 9), ((SELECT id FROM g), 'Word''s meaning', 10), ((SELECT id FROM g), 'Contextual Meaning', 11), ((SELECT id FROM g), 'Reference and Inference', 12), ((SELECT id FROM g), 'Restating sentences/phrases', 13), ((SELECT id FROM g), 'True/false statement', 14), ((SELECT id FROM g), 'Detailing Facts', 15), ((SELECT id FROM g), 'Comparing two texts', 16), ((SELECT id FROM g), 'Text structure', 17) RETURNING id, name, sort_order)
INSERT INTO checklist_item_subtests (item_id, subtest_code)
SELECT id, 'LBE' FROM items WHERE name = 'Topic and Main Idea' AND sort_order = 1 UNION ALL SELECT id, 'LBE' FROM items WHERE name = 'Conclusion' AND sort_order = 2 UNION ALL SELECT id, 'LBE' FROM items WHERE name = 'Summary of Passage' AND sort_order = 3 UNION ALL SELECT id, 'LBE' FROM items WHERE name = 'Specific Information' AND sort_order = 4 UNION ALL SELECT id, 'LBE' FROM items WHERE name = 'Finding Detail Info' AND sort_order = 5 UNION ALL SELECT id, 'LBE' FROM items WHERE name = 'Purpose of the Text' AND sort_order = 6 UNION ALL SELECT id, 'LBE' FROM items WHERE name = 'Author''s Tone/Attitude' AND sort_order = 7 UNION ALL SELECT id, 'LBE' FROM items WHERE name = 'Writer''s motive' AND sort_order = 8 UNION ALL SELECT id, 'LBE' FROM items WHERE name = 'Synonym and Antonym' AND sort_order = 9 UNION ALL SELECT id, 'LBE' FROM items WHERE name = 'Word''s meaning' AND sort_order = 10 UNION ALL SELECT id, 'LBE' FROM items WHERE name = 'Contextual Meaning' AND sort_order = 11 UNION ALL SELECT id, 'LBE' FROM items WHERE name = 'Reference and Inference' AND sort_order = 12 UNION ALL SELECT id, 'LBE' FROM items WHERE name = 'Restating sentences/phrases' AND sort_order = 13 UNION ALL SELECT id, 'LBE' FROM items WHERE name = 'True/false statement' AND sort_order = 14 UNION ALL SELECT id, 'LBE' FROM items WHERE name = 'Detailing Facts' AND sort_order = 15 UNION ALL SELECT id, 'LBE' FROM items WHERE name = 'Comparing two texts' AND sort_order = 16 UNION ALL SELECT id, 'LBE' FROM items WHERE name = 'Text structure' AND sort_order = 17;

WITH g AS (INSERT INTO checklist_groups (name, sort_order) VALUES ('Pemahaman Bacaan Bahasa Indonesia', 29) RETURNING id)
, items AS (INSERT INTO checklist_items (group_id, name, sort_order) VALUES ((SELECT id FROM g), 'Menentukan tema dan unsur teks', 1), ((SELECT id FROM g), 'Struktur Teks', 2), ((SELECT id FROM g), 'Makna Implisit dan Eksplisit', 3), ((SELECT id FROM g), 'Mencari Info Relevan', 4), ((SELECT id FROM g), 'Menyimpulkan Isi bacaan', 5), ((SELECT id FROM g), 'Unsur Teks Eksplanatif', 6), ((SELECT id FROM g), 'Tema dan Nilai Teks Sastra', 7), ((SELECT id FROM g), 'Menilai dan Menghubungkan Informasi', 8) RETURNING id, name, sort_order)
INSERT INTO checklist_item_subtests (item_id, subtest_code)
SELECT id, 'LBI' FROM items WHERE name = 'Menentukan tema dan unsur teks' AND sort_order = 1 UNION ALL SELECT id, 'LBI' FROM items WHERE name = 'Struktur Teks' AND sort_order = 2 UNION ALL SELECT id, 'LBI' FROM items WHERE name = 'Makna Implisit dan Eksplisit' AND sort_order = 3 UNION ALL SELECT id, 'LBI' FROM items WHERE name = 'Mencari Info Relevan' AND sort_order = 4 UNION ALL SELECT id, 'LBI' FROM items WHERE name = 'Menyimpulkan Isi bacaan' AND sort_order = 5 UNION ALL SELECT id, 'LBI' FROM items WHERE name = 'Unsur Teks Eksplanatif' AND sort_order = 6 UNION ALL SELECT id, 'LBI' FROM items WHERE name = 'Tema dan Nilai Teks Sastra' AND sort_order = 7 UNION ALL SELECT id, 'LBI' FROM items WHERE name = 'Menilai dan Menghubungkan Informasi' AND sort_order = 8;

COMMIT;

-- ---------------------------------------------------------------------
-- Verifikasi
-- ---------------------------------------------------------------------

-- Total + sanity check. item_tanpa_subtes HARUS 0; kalau > 0 berarti ada
-- name/sort_order di blok mapping yang tidak match dengan blok insert item.
SELECT (SELECT COUNT(*) FROM checklist_groups)        AS total_groups,
       (SELECT COUNT(*) FROM checklist_items)         AS total_items,
       (SELECT COUNT(*) FROM checklist_item_subtests) AS total_mapping,
       (SELECT COUNT(*) FROM checklist_items i
          WHERE (SELECT COUNT(*) FROM checklist_item_subtests c WHERE c.item_id = i.id) = 2)
         AS item_lintas_subtes,
       (SELECT COUNT(*) FROM checklist_items i
          WHERE NOT EXISTS (SELECT 1 FROM checklist_item_subtests c WHERE c.item_id = i.id))
         AS item_tanpa_subtes;

-- Per subtes (item lintas-subtes ikut terhitung di kedua subtes)
SELECT s.code,
       COUNT(DISTINCT i.group_id) AS n_groups,
       COUNT(DISTINCT i.id)       AS n_items
FROM subtests s
LEFT JOIN checklist_item_subtests cis ON cis.subtest_code = s.code
LEFT JOIN checklist_items i          ON i.id = cis.item_id
GROUP BY s.code, s.sort_order
ORDER BY s.sort_order;

-- Per grup materi, untuk dicocokkan baris-per-baris dengan Excel
SELECT g.sort_order,
       g.name AS materi,
       COUNT(DISTINCT i.id) AS n_submateri,
       string_agg(DISTINCT cis.subtest_code, '/') AS subtes
FROM checklist_groups g
LEFT JOIN checklist_items i          ON i.group_id = g.id
LEFT JOIN checklist_item_subtests cis ON cis.item_id = i.id
GROUP BY g.id, g.sort_order, g.name
ORDER BY g.sort_order;
