import type { PostIssue, PostSimulationResult } from '../post';

export interface DiagnosisFeedback {
  correct: boolean;
  selectedCode: string;
  actualCode: string | null;
  explanation: string;
  whyWrong: string;
  hint: string;
}

const HYPOTHESIS_DESCRIPTIONS: Record<string, string> = {
  PSU_WATTAGE_INSUFFICIENT:
    'Daya PSU kurang biasanya menyebabkan komputer mati mendadak saat beban berat atau gagal menyala sama sekali tanpa pola bip memori.',
  MISSING_ATX_24PIN:
    'Kabel ATX 24-pin yang lepas membuat seluruh motherboard mati total tanpa kipas berputar dan tanpa suara bip.',
  MISSING_CPU_8PIN:
    'Kabel CPU 8-pin yang lepas membuat prosesor tidak mendapat daya sehingga POST tidak dapat dimulai.',
  MISSING_GPU_PCIE_POWER:
    'Kabel daya PCIe GPU yang lepas berkaitan dengan inisialisasi kartu grafis (kode bip video atau pesan daya GPU di layar).',
  MISSING_RAM:
    'RAM yang belum terpasang atau tidak terbaca memicu kode bip AMI berulang karena BIOS gagal menginisialisasi memori utama.',
  FAULTY_RAM:
    'Modul RAM yang rusak menyebabkan kegagalan pemeriksaan memori 64K awal dan memicu bunyi bip AMI berulang.',
  MONITOR_WRONG_PORT_MOTHERBOARD:
    'Salah mencolok kabel monitor ke motherboard terjadi ketika mesin sebenarnya menyala normal (1 bip pendek), tetapi sinyal video keluar dari port GPU.',
  NO_BOOTABLE_DEVICE:
    'Masalah perangkat boot muncul setelah POST selesai dan layar menampilkan pesan teks "No bootable device".',
};

/**
 * Mengambil satu masalah aktif tertinggi yang sedang dilaporkan oleh hasil simulasi POST (KU-54, KU-57).
 */
export function getActiveDiagnosisIssue(postResult: PostSimulationResult): PostIssue | null {
  return postResult.primaryIssue;
}

/**
 * Mengevaluasi jawaban diagnosis siswa.
 * Jika salah, wajib menjelaskan MENGAPA pilihan siswa keliru dan memberikan petunjuk menuju penyebab sebenarnya (KU-56).
 */
export function evaluateDiagnosisAnswer(
  postResult: PostSimulationResult,
  selectedIssueCode: string,
): DiagnosisFeedback {
  const actual = postResult.primaryIssue;

  if (!actual) {
    return {
      correct: selectedIssueCode === 'NORMAL_BOOT',
      selectedCode: selectedIssueCode,
      actualCode: null,
      explanation:
        'Komputer menyala dan melewati POST secara normal (1 bip pendek) tanpa kegagalan perangkat keras.',
      whyWrong: '',
      hint: 'Tidak ada komponen yang perlu diperbaiki.',
    };
  }

  if (selectedIssueCode === actual.code) {
    return {
      correct: true,
      selectedCode: selectedIssueCode,
      actualCode: actual.code,
      explanation: `Tepat! ${actual.reason} Langkah perbaikan: ${actual.remediation}`,
      whyWrong: '',
      hint: actual.remediation,
    };
  }

  const selectedSymptomExplanation =
    HYPOTHESIS_DESCRIPTIONS[selectedIssueCode] ??
    `Pilihan "${selectedIssueCode}" memiliki gejala yang berbeda dari kondisi rakitan saat ini.`;

  const beepClue = postResult.beep
    ? `Perhatikan petunjuk bunyi BIOS AMI (${postResult.beep.pattern}): ${postResult.beep.meaning}`
    : 'Perhatikan bahwa motherboard belum mengeluarkan bunyi bip POST normal.';

  const whyWrong = `Pilihan Anda belum tepat karena: ${selectedSymptomExplanation}`;
  const hint = `${beepClue} Fokuskan pemeriksaan pada bagian ${actual.relatedComponent}: ${actual.remediation}`;

  return {
    correct: false,
    selectedCode: selectedIssueCode,
    actualCode: actual.code,
    explanation: `${whyWrong} ${hint}`,
    whyWrong,
    hint,
  };
}
