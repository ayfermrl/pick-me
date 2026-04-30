import type { QuizTemplate } from "../types";

export const templates: QuizTemplate[] = [
  {
    id: "friends",
    title: "Arkadaş Grubu",
    description: "Sohbeti hemen açan, hafif rekabetli grup soruları.",
    tags: ["eğlenceli", "grup", "klasik"],
    participants: [],
    questions: [
      { text: "Kim en çok geç cevap verir?", answerMode: "participants" },
      { text: "Kim plansız tatil organize eder?", answerMode: "participants" },
      { text: "Kim toplantıda en komik yorumu yapar?", answerMode: "participants" },
      { text: "Kim en iyi playlist hazırlar?", answerMode: "participants" },
    ],
  },
  {
    id: "team",
    title: "Ekip Enerjisi",
    description: "Ofis, okul veya proje ekibi için kısa buz kırıcı.",
    tags: ["ekip", "istatistik", "hızlı"],
    participants: [],
    questions: [
      { text: "Kim en iyi kriz çözer?", answerMode: "participants" },
      { text: "Kim en yaratıcı fikirleri getirir?", answerMode: "participants" },
      { text: "Bu ekipte en baskın çalışma modu hangisi?", answerMode: "custom", customOptions: ["Hızlı karar", "Derin analiz", "Yaratıcı kaos", "Sessiz üretim"] },
      { text: "Toplantı ritmi nasıl olmalı?", answerMode: "custom", customOptions: ["Kısa ve sık", "Uzun ve seyrek", "Tamamen asenkron", "Duruma göre"] },
    ],
  },
  {
    id: "party",
    title: "Parti Gecesi",
    description: "Daha renkli, daha hızlı, bol kahkahalı oylama.",
    tags: ["parti", "anonim", "komik"],
    participants: [],
    questions: [
      { text: "Kim dans pistini ilk açar?", answerMode: "participants" },
      { text: "Kim gecenin fotoğrafçısı olur?", answerMode: "participants" },
      { text: "Gecenin modu ne olsun?", answerMode: "custom", customOptions: ["Dans", "Sohbet", "Oyun", "Karaoke"] },
      { text: "Kim en iyi hikayeyi anlatır?", answerMode: "participants" },
    ],
  },
];
