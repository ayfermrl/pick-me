import { templates } from "./templates";
import type { QuestionSuggestion } from "../types";

const extraQuestions: QuestionSuggestion[] = [
  { category: "Kaotik", text: "Kim en masum başlayıp olayı büyütür?", answerMode: "participants" },
  { category: "Kaotik", text: "Kim yanlış anlaşılmayı daha da yanlış açıklar?", answerMode: "participants" },
  { category: "Kaotik", text: "Kim bir gecede üç farklı plan yapar?", answerMode: "participants" },
  { category: "Kaotik", text: "Kim sakin kalacağım deyip ilk yükselir?", answerMode: "participants" },
  { category: "Kaotik", text: "Grubun kriz anında ilk tepkisi ne?", answerMode: "custom", customOptions: ["Gülmek", "Panik", "Plan yapmak", "Sessizleşmek"] },
  { category: "Kaotik", text: "Bugün en çok hangi enerji var?", answerMode: "custom", customOptions: ["Tatlı gerginlik", "Kontrollü kaos", "Aşırı neşe", "Dedikodu modu"] },
  { category: "Kızsal", text: "Kim bir kombinle bütün havayı değiştirir?", answerMode: "participants" },
  { category: "Kızsal", text: "Kim en iyi moral konuşmasını yapar?", answerMode: "participants" },
  { category: "Kızsal", text: "Kim hiçbir detayı kaçırmaz?", answerMode: "participants" },
  { category: "Kızsal", text: "Kim en güçlü sezgilere sahip?", answerMode: "participants" },
  { category: "Kızsal", text: "Bir buluşmada en önemli şey ne?", answerMode: "custom", customOptions: ["Rahat sohbet", "Güzel mekan", "İyi enerji", "Netlik"] },
  { category: "Kızsal", text: "Grubun hazırlık süreci nasıl geçer?", answerMode: "custom", customOptions: ["Çok hızlı", "Son dakika", "Bol yorumlu", "Tatlı telaşlı"] },
  { category: "Karışık", text: "Kim her ortama hemen uyum sağlar?", answerMode: "participants" },
  { category: "Karışık", text: "Kim en beklenmedik anda komikleşir?", answerMode: "participants" },
  { category: "Karışık", text: "Kim en iyi yol arkadaşı olur?", answerMode: "participants" },
  { category: "Karışık", text: "Kim ortamın sessiz lideridir?", answerMode: "participants" },
  { category: "Karışık", text: "Bugünkü sohbet hangi yöne gider?", answerMode: "custom", customOptions: ["Anılar", "Planlar", "İtiraflar", "Saçma muhabbet"] },
  { category: "Karışık", text: "Bu grubun temposu nasıl?", answerMode: "custom", customOptions: ["Hızlı", "Rahat", "Dalgalı", "Tahmin edilemez"] },
  { category: "Ofis", text: "Kim toplantıda en net özet çıkarır?", answerMode: "participants" },
  { category: "Ofis", text: "Kim son dakika işini sakinlikle çözer?", answerMode: "participants" },
  { category: "Ofis", text: "Kim ekip moralini en hızlı toparlar?", answerMode: "participants" },
  { category: "Ofis", text: "Kim en iyi geri bildirim verir?", answerMode: "participants" },
  { category: "Ofis", text: "Ekipte en çok ne iyileşmeli?", answerMode: "custom", customOptions: ["İletişim", "Planlama", "Odak", "Karar hızı"] },
  { category: "Ofis", text: "Bu hafta ekibin en büyük kazanımı ne?", answerMode: "custom", customOptions: ["Teslimat", "Uyum", "Öğrenme", "Hız"] },
  { category: "Arkadaş", text: "Kim en iyi sır saklar?", answerMode: "participants" },
  { category: "Arkadaş", text: "Kim buluşmayı en çok güzelleştirir?", answerMode: "participants" },
  { category: "Arkadaş", text: "Kim kaybolunca ilk aranır?", answerMode: "participants" },
  { category: "Arkadaş", text: "Kim eski anıları en iyi anlatır?", answerMode: "participants" },
  { category: "Arkadaş", text: "Bu arkadaşlığın en komik tarafı ne?", answerMode: "custom", customOptions: ["Anılar", "İç şakalar", "Plansızlık", "Farklı karakterler"] },
  { category: "Arkadaş", text: "Birlikte en iyi hangi plan gider?", answerMode: "custom", customOptions: ["Kahve", "Yolculuk", "Ev buluşması", "Gece dışarı"] },
  { category: "Parti", text: "Kim müziği ele geçirir?", answerMode: "participants" },
  { category: "Parti", text: "Kim gecenin en iyi fotoğrafını çeker?", answerMode: "participants" },
  { category: "Parti", text: "Kim herkesi oyuna dahil eder?", answerMode: "participants" },
  { category: "Parti", text: "Kim en erken yorulup yine de kalır?", answerMode: "participants" },
  { category: "Parti", text: "Gecenin ana aktivitesi ne olsun?", answerMode: "custom", customOptions: ["Karaoke", "Dans", "Oyun", "Sohbet"] },
  { category: "Parti", text: "Parti enerjisi hangi seviyede?", answerMode: "custom", customOptions: ["Isınıyor", "Tam gaz", "Rahat", "Efsane"] },
];

const templateQuestions: QuestionSuggestion[] = templates.flatMap((template) =>
  template.questions.map((question) => ({
    category: template.category,
    text: question.text,
    answerMode: question.answerMode,
    customOptions: question.customOptions,
  })),
);

const uniqueByText = new Map<string, QuestionSuggestion>();

[...templateQuestions, ...extraQuestions].forEach((question) => {
  const key = question.text.toLocaleLowerCase("tr-TR");
  if (!uniqueByText.has(key)) uniqueByText.set(key, question);
});

export const questionPool = Array.from(uniqueByText.values());
