import { Plus, Shuffle, Trash2, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { questionPool } from "../data/questionPool";
import { templates } from "../data/templates";
import { roomApi, uid } from "../lib/api";
import type { QuizRoom } from "../types";

type FormValues = {
  title: string;
  isAnonymous: boolean;
  requireName: boolean;
};

type DraftQuestion = {
  id: string;
  text: string;
  answerMode: "participants" | "custom";
  customOptions: string[];
};

const defaultCustomOptions = ["Evet", "Hayır", "Kararsızım"];

export function CreateQuizPage() {
  const { templateId } = useParams();
  const template = templates.find((item) => item.id === templateId) || templates[0];
  const [questions, setQuestions] = useState<DraftQuestion[]>(() =>
    template.questions.map((question) => ({
      id: uid("draft"),
      text: question.text,
      answerMode: question.answerMode || "participants",
      customOptions: question.customOptions || defaultCustomOptions,
    })),
  );
  const { user } = useAuth();
  const navigate = useNavigate();

  const defaults = useMemo(
    () => ({
      title: templateId ? template.title : "Bizim Grup Testi",
      isAnonymous: true,
      requireName: true,
    }),
    [template, templateId],
  );

  const { register, handleSubmit, watch } = useForm<FormValues>({ defaultValues: defaults });

  if (!user) return <Navigate to="/auth" replace />;

  const updateQuestion = (id: string, patch: Partial<DraftQuestion>) => {
    setQuestions((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const updateCustomOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions((items) =>
      items.map((item) =>
        item.id === questionId
          ? {
              ...item,
              customOptions: item.customOptions.map((option, index) => (index === optionIndex ? value : option)),
            }
          : item,
      ),
    );
  };

  const suggestQuestion = (questionId: string) => {
    const currentTexts = new Set(questions.map((item) => item.text.trim().toLocaleLowerCase("tr-TR")).filter(Boolean));
    const availableQuestions = questionPool.filter((item) => !currentTexts.has(item.text.toLocaleLowerCase("tr-TR")));
    const pool = availableQuestions.length ? availableQuestions : questionPool;
    const suggestion = pool[Math.floor(Math.random() * pool.length)];

    updateQuestion(questionId, {
      text: suggestion.text,
      answerMode: suggestion.answerMode || "participants",
      customOptions: suggestion.customOptions || defaultCustomOptions,
    });
  };

  const submit = async (values: FormValues) => {
    const cleanQuestions = questions
      .map((question) => {
        const customOptions = [...new Set(question.customOptions.map((item) => item.trim()).filter(Boolean))];

        return {
          id: uid("q"),
          text: question.text.trim(),
          answerMode: question.answerMode,
          customOptions,
        };
      })
      .filter((question) => question.text && (question.answerMode === "participants" || question.customOptions.length >= 2));

    if (cleanQuestions.length < 1) return;

    const room: QuizRoom = {
      id: uid("room"),
      ownerId: user.id,
      title: values.title,
      participants: [user.name],
      questions: cleanQuestions,
      isAnonymous: values.isAnonymous,
      requireName: values.requireName,
      isStarted: false,
      resultsReleased: false,
      activeQuestionIndex: 0,
      showSummary: false,
      votes: [],
      createdAt: new Date().toISOString(),
    };

    await roomApi.create(room);
    sessionStorage.setItem(`pick-me-voter-${room.id}`, user.name);
    navigate(`/join/${room.id}`);
  };

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Quiz oluştur</h1>
          <p>Soruları yaz, cevap tipini seç, odayı kur. Katılımcılar linkle girip oy versin.</p>
        </div>
      </div>

      <form className="grid gap-5 lg:grid-cols-[0.78fr_1.22fr]" onSubmit={handleSubmit(submit)}>
        <div className="panel-card space-y-4">
          <label className="field">
            <span>Oda adı</span>
            <input className="plain-input" {...register("title", { required: true })} />
          </label>

          <label className="switch-row">
            <span>
              <b>Anonim sonuç</b>
              <small>Kimin neye oy verdiği sonuçlarda görünmez.</small>
            </span>
            <input type="checkbox" {...register("isAnonymous")} />
          </label>
          <label className="switch-row">
            <span>
              <b>Katılımda ad zorunlu</b>
              <small>İsimler, “Katılımcılar” cevap tipinde seçenek olur.</small>
            </span>
            <input type="checkbox" {...register("requireName")} />
          </label>

          <div className="success-box">
            <UsersRound className="mb-2" size={22} />
            Katılımcılar seçeneği, odaya giren isimleri otomatik cevap şıkkına dönüştürür.
          </div>
        </div>

        <div className="panel-card">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black">Sorular</h2>
              <p className="text-slate-600">Her kart bir soru. İstersen havuzdan fikir al.</p>
            </div>
            <button
              className="secondary-button"
              type="button"
              onClick={() =>
                setQuestions((items) => [
                  ...items,
                  { id: uid("draft"), text: "", answerMode: "participants", customOptions: defaultCustomOptions },
                ])
              }
            >
              <Plus size={18} />
              Soru ekle
            </button>
          </div>

          <div className="space-y-4">
            {questions.map((question, index) => (
              <div className="rounded-xl border border-slate-200 bg-white/70 p-4" key={question.id}>
                <label className="field">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span>Soru {index + 1}</span>
                    <button
                      className="secondary-button min-h-9 px-3 text-sm"
                      type="button"
                      onClick={() => suggestQuestion(question.id)}
                    >
                      <Shuffle size={15} />
                      Fikir ver
                    </button>
                  </span>
                  <input
                    className="plain-input"
                    value={question.text}
                    onChange={(event) => updateQuestion(question.id, { text: event.target.value })}
                    placeholder="Kim en çok geç cevap verir?"
                  />
                </label>

                <div className="mt-4 grid gap-2 rounded-xl bg-slate-100 p-1 sm:grid-cols-2">
                  <button
                    className={`tab-button ${question.answerMode === "participants" ? "active" : ""}`}
                    type="button"
                    onClick={() => updateQuestion(question.id, { answerMode: "participants" })}
                  >
                    Katılımcılar
                  </button>
                  <button
                    className={`tab-button ${question.answerMode === "custom" ? "active" : ""}`}
                    type="button"
                    onClick={() => updateQuestion(question.id, { answerMode: "custom" })}
                  >
                    Özel cevaplar
                  </button>
                </div>

                {question.answerMode === "custom" ? (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-white/80 p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="font-extrabold text-slate-700">Özel cevap seçenekleri</span>
                      <button
                        className="secondary-button min-h-10 px-4 text-sm"
                        type="button"
                        onClick={() => updateQuestion(question.id, { customOptions: [...question.customOptions, ""] })}
                      >
                        <Plus size={16} />
                        Seçenek ekle
                      </button>
                    </div>
                    <div className="grid gap-2">
                      {question.customOptions.map((option, optionIndex) => (
                        <div className="grid grid-cols-[42px_1fr_auto] items-center gap-2" key={`${question.id}-${optionIndex}`}>
                          <span className="grid h-10 w-10 place-items-center rounded-xl bg-grape/10 font-black text-grape">
                            {String.fromCharCode(65 + optionIndex)}
                          </span>
                          <input
                            className="plain-input min-h-10"
                            value={option}
                            onChange={(event) => updateCustomOption(question.id, optionIndex, event.target.value)}
                            placeholder="Cevap seçeneği"
                          />
                          <button
                            className="danger-button min-h-10 px-3"
                            type="button"
                            onClick={() =>
                              question.customOptions.length > 2 &&
                              updateQuestion(question.id, {
                                customOptions: question.customOptions.filter((_, index) => index !== optionIndex),
                              })
                            }
                            aria-label="Cevabı sil"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="hint-box mt-4">
                    Bu soruda cevap seçenekleri, odaya katılan kişilerin adları olacak.
                  </div>
                )}

                <button
                  className="danger-button mt-4"
                  type="button"
                  onClick={() => questions.length > 1 && setQuestions((items) => items.filter((item) => item.id !== question.id))}
                >
                  <Trash2 size={16} />
                  Sil
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl bg-grape/10 p-4 text-sm font-bold text-grape">
            Kurulum özeti: {watch("isAnonymous") ? "Anonim sonuç" : "İsimli sonuç"} · {questions.length} soru
          </div>

          <button className="primary-button mt-5 w-full justify-center" type="submit">
            Odayı kur ve linki al
          </button>
        </div>
      </form>
    </section>
  );
}
