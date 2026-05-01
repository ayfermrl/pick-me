import { ChevronLeft, ChevronRight, Copy, ListChecks, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAuth } from "../context/AuthContext";
import { roomApi } from "../lib/api";
import type { Question, QuizRoom } from "../types";

type ResultItem = {
  name: string;
  oy: number;
  percent: number;
  voters: string[];
};

function voterKeyOf(vote: { voterKey?: string; voterName: string }) {
  return vote.voterKey || vote.voterName.trim().toLocaleLowerCase("tr-TR");
}

function questionVotes(room: QuizRoom, question: Question) {
  const byVoter = new Map<string, QuizRoom["votes"][number]>();
  room.votes
    .filter((vote) => vote.questionId === question.id)
    .forEach((vote) => {
      byVoter.set(voterKeyOf(vote), vote);
    });
  return [...byVoter.values()];
}

function resultData(room: QuizRoom, question: Question): ResultItem[] {
  const votesForQuestion = questionVotes(room, question);
  const legacyOptions = (question as unknown as { options?: string[] }).options || [];
  const optionSource =
    question.answerMode === "participants"
      ? [...new Set([...(room.participants || []), ...votesForQuestion.map((vote) => vote.answer)])]
      : question.answerMode === "custom"
        ? question.customOptions
        : legacyOptions;

  return optionSource
    .map((option) => {
      const voters = votesForQuestion.filter((vote) => vote.answer === option).map((vote) => vote.voterName);
      return {
        name: option,
        oy: voters.length,
        percent: votesForQuestion.length ? Math.round((voters.length / votesForQuestion.length) * 100) : 0,
        voters,
      };
    })
    .sort((a, b) => b.oy - a.oy);
}

function voteCount(room: QuizRoom, question: Question) {
  return questionVotes(room, question).length;
}

function uniqueVoterCount(room: QuizRoom) {
  return new Set(room.votes.map(voterKeyOf)).size;
}

function totalAnswerCount(room: QuizRoom) {
  return room.questions.reduce((total, question) => total + voteCount(room, question), 0);
}

function participantKey(name: string) {
  return name.trim().toLocaleLowerCase("tr-TR");
}

function participantProgress(room: QuizRoom) {
  return room.participants.map((participant) => {
    const key = participantKey(participant);
    const answeredQuestions = new Set(
      room.votes
        .filter((vote) => (vote.voterKey || participantKey(vote.voterName)) === key)
        .map((vote) => vote.questionId),
    );
    return {
      name: participant,
      answered: answeredQuestions.size,
      isDone: answeredQuestions.size >= room.questions.length,
    };
  });
}

function isEveryoneDone(room: QuizRoom) {
  const progress = participantProgress(room);
  return progress.length > 0 && progress.every((item) => item.isDone);
}

function SummaryGrid({ room, onSelect }: { room: QuizRoom; onSelect?: (index: number) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {room.questions.map((question, index) => {
        const data = resultData(room, question);
        const top = data[0];
        return (
          <button
            className="rounded-2xl border border-slate-200 bg-white/75 p-4 text-left transition hover:-translate-y-0.5"
            key={question.id}
            onClick={() => onSelect?.(index)}
            type="button"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm font-black text-slate-500">Soru {index + 1}</span>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-black text-slate-500">{voteCount(room, question)} oy</span>
            </div>
            <p className="line-clamp-2 font-extrabold leading-6">{question.text}</p>
            <p className="mt-2 text-sm font-bold text-grape">
              {top?.oy ? `${top.name} · %${top.percent}` : "Henüz seçim yok"}
            </p>
          </button>
        );
      })}
    </div>
  );
}

export function ResultsPage() {
  const { roomId = "" } = useParams();
  const { user } = useAuth();
  const [room, setRoom] = useState<QuizRoom | undefined>();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const tick = () =>
      roomApi
        .get(roomId)
        .then(setRoom)
        .finally(() => setLoaded(true));
    tick();
    const timer = window.setInterval(tick, 900);
    return () => window.clearInterval(timer);
  }, [roomId]);

  if (!loaded) {
    return (
      <section className="mx-auto max-w-2xl panel-card text-center">
        <h1 className="text-4xl font-black">Sonuçlar yükleniyor</h1>
        <p className="mt-3 leading-7 text-slate-600">Backend’den güncel oda verisi alınıyor.</p>
      </section>
    );
  }

  if (!room) {
    return (
      <section className="mx-auto max-w-2xl panel-card text-center">
        <h1 className="text-4xl font-black">Sonuç bulunamadı</h1>
        <Link className="primary-button mt-6 justify-center" to="/">
          Ana sayfa
        </Link>
      </section>
    );
  }

  const activeIndex = room.activeQuestionIndex ?? 0;
  const activeQuestion = room.questions[Math.min(activeIndex, room.questions.length - 1)];
  const activeData = activeQuestion ? resultData(room, activeQuestion) : [];
  const winner = activeData[0];
  const link = `${window.location.origin}/join/${room.id}`;
  const isOwner = user?.id === room.ownerId;
  const isLastQuestion = activeIndex >= room.questions.length - 1;
  const everyoneDone = isEveryoneDone(room);
  const progress = participantProgress(room);

  const goToQuestion = (index: number) => {
    roomApi.setActiveQuestion(room.id, index).then(setRoom);
  };

  const showSummary = () => {
    roomApi.showSummary(room.id).then(setRoom);
  };

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>{room.showSummary ? "Özet" : "Sonuçlar"}</h1>
          <p>
            {room.title} · {uniqueVoterCount(room)} oyuncu · {totalAnswerCount(room)} cevap · {room.isAnonymous ? "Oy verenler gizli" : "Oy verenler görünür"}
          </p>
        </div>
        <button className="secondary-button" onClick={() => navigator.clipboard.writeText(link)}>
          <Copy size={18} />
          Link kopyala
        </button>
      </div>

      {!room.resultsReleased ? (
        <div className="panel-card">
          <h2 className="text-3xl font-black">Sonuçlar henüz kilitli</h2>
          <p className="mt-2 text-slate-600">
            {everyoneDone ? "Herkes bitirdi. Host sonuçları açınca bu ekran güncellenecek." : "Herkes tüm soruları bitirince host sonuçları açabilecek."}
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {progress.map((item) => (
              <div className="rounded-2xl bg-white/75 p-4" key={item.name}>
                <div className="mb-2 flex justify-between gap-3 font-black">
                  <span>{item.name}</span>
                  <span>
                    {item.answered} / {room.questions.length}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-grape to-berry"
                    style={{ width: `${Math.round((item.answered / room.questions.length) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <Link className="secondary-button mt-6 justify-center" to={`/join/${room.id}`}>
            Bekleme odasına dön
          </Link>
        </div>
      ) : room.votes.length === 0 ? (
        <div className="panel-card text-center">
          <h2 className="text-3xl font-black">Henüz oy yok</h2>
          <p className="mt-2 text-slate-600">Linki paylaşınca istatistikler burada dolacak.</p>
        </div>
      ) : room.showSummary ? (
        <article className="panel-card">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-3xl font-black">Özet</h2>
              <p className="mt-2 text-slate-600">Bütün soruların kazananı ve oy sayısı tek ekranda.</p>
            </div>
            {isOwner ? (
              <button className="secondary-button" onClick={() => goToQuestion(room.questions.length - 1)}>
                Son soruya dön
              </button>
            ) : null}
          </div>
          <SummaryGrid room={room} onSelect={isOwner ? goToQuestion : undefined} />
        </article>
      ) : (
        <article className="panel-card">
            <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <div className="mb-2 text-sm font-extrabold text-slate-500">
                  Soru {activeIndex + 1} / {room.questions.length}
                </div>
                <h2 className="text-3xl font-black leading-tight">{activeQuestion.text}</h2>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  {voteCount(room, activeQuestion)} oy · {activeQuestion.answerMode === "participants" ? "Katılımcılar seçenek" : "Özel cevaplar"}
                </p>
              </div>
              {isOwner ? (
                <div className="flex flex-wrap gap-2">
                  <button className="secondary-button min-h-11 px-4" disabled={activeIndex === 0} onClick={() => goToQuestion(activeIndex - 1)}>
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    className="primary-button min-h-11 px-4"
                    onClick={() => (isLastQuestion ? showSummary() : goToQuestion(activeIndex + 1))}
                  >
                    {isLastQuestion ? (
                      <>
                        <ListChecks size={18} />
                        Özete geç
                      </>
                    ) : (
                      <>
                        Sonraki soru
                        <ChevronRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              ) : null}
            </div>

            {isOwner ? (
              <div className="mb-4 rounded-2xl bg-grape/10 p-3 text-sm font-bold text-grape">
                Sonuç ekranında soru geçişini oyun sahibi yönetir; herkes aynı istatistiği birlikte takip eder.
              </div>
            ) : null}

            {winner?.oy ? (
              <div className="mb-4 flex items-center gap-3 rounded-2xl bg-honey/20 p-4 font-black text-amber-900">
                <Trophy size={22} />
                En çok seçilen: {winner.name} · {winner.oy} oy
              </div>
            ) : null}

            <div className="h-56 w-full md:h-72">
              <ResponsiveContainer>
                <BarChart data={activeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="oy" fill="#8b70dd" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {activeData.map((item) => (
                <div className="rounded-2xl bg-white/75 p-4" key={item.name}>
                  <div className="mb-2 flex justify-between gap-3 font-black">
                    <span>{item.name}</span>
                    <span>
                      {item.oy} · %{item.percent}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-gradient-to-r from-grape via-berry to-honey" style={{ width: `${item.percent}%` }} />
                  </div>
                  {!room.isAnonymous && item.voters.length ? (
                    <p className="mt-2 text-xs font-semibold text-slate-600">Seçenler: {item.voters.join(", ")}</p>
                  ) : null}
                </div>
              ))}
            </div>
        </article>
      )}
    </section>
  );
}
