import { ChevronLeft, ChevronRight, Copy, Download, ListChecks, Share2, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
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

function buildSummaryShareText(room: QuizRoom) {
  const homeUrl = window.location.origin;
  const lines = room.questions.map((question, index) => {
    const top = resultData(room, question)[0];
    const result = top?.oy ? `${top.name} (%${top.percent}, ${top.oy} oy)` : "Henüz seçim yok";
    return `${index + 1}. ${question.text}\n   Kazanan: ${result}`;
  });

  return [
    `Pick Me sonuçları: ${room.title}`,
    `${room.participants.length} katılımcı · ${totalAnswerCount(room)} cevap`,
    "",
    ...lines,
    "",
    `Sen de Pick Me ile grup quizini oluştur: ${homeUrl}`,
  ].join("\n");
}

function wrapCanvasText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";

  words.forEach((word) => {
    const nextLine = line ? `${line} ${word}` : word;
    if (context.measureText(nextLine).width <= maxWidth) {
      line = nextLine;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  });

  if (line) lines.push(line);
  return lines;
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function createSummaryImage(room: QuizRoom): Promise<Blob> {
  const scale = 2;
  const width = 1080;
  const padding = 72;
  const rowGap = 22;
  const summaryItems = room.questions.map((question, index) => {
    const top = resultData(room, question)[0];
    return {
      index,
      question: question.text,
      result: top?.oy ? `${top.name} · %${top.percent} · ${top.oy} oy` : "Henüz seçim yok",
    };
  });

  const measureCanvas = document.createElement("canvas");
  const measureContext = measureCanvas.getContext("2d");
  if (!measureContext) throw new Error("Görsel hazırlanamadı.");

  const contentWidth = width - padding * 2;
  measureContext.font = "800 34px Inter, Arial, sans-serif";
  const itemHeights = summaryItems.map((item) => {
    const questionLines = wrapCanvasText(measureContext, item.question, contentWidth - 128);
    return Math.max(132, 74 + questionLines.length * 42);
  });
  const height = Math.max(1080, 370 + itemHeights.reduce((total, item) => total + item, 0) + rowGap * summaryItems.length + padding);

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Görsel hazırlanamadı.");
  context.scale(scale, scale);

  const background = context.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, "#f8fafc");
  background.addColorStop(0.5, "#f5f3ff");
  background.addColorStop(1, "#fff7ed");
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#8b5cf6";
  roundedRect(context, padding, padding, 72, 72, 24);
  context.fill();
  context.fillStyle = "#ffffff";
  context.font = "900 38px Inter, Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("P", padding + 36, padding + 37);

  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.fillStyle = "#111827";
  context.font = "900 54px Inter, Arial, sans-serif";
  context.fillText("Pick Me Özeti", padding + 92, padding + 50);
  context.fillStyle = "#64748b";
  context.font = "800 26px Inter, Arial, sans-serif";
  context.fillText(`${room.title} · ${room.participants.length} katılımcı · ${totalAnswerCount(room)} cevap`, padding, padding + 132);

  context.fillStyle = "#111827";
  context.font = "900 42px Inter, Arial, sans-serif";
  wrapCanvasText(context, room.title, contentWidth).slice(0, 2).forEach((line, index) => {
    context.fillText(line, padding, padding + 210 + index * 52);
  });

  let y = padding + 310;
  summaryItems.forEach((item, itemIndex) => {
    const rowHeight = itemHeights[itemIndex];
    roundedRect(context, padding, y, contentWidth, rowHeight, 30);
    context.fillStyle = "rgba(255,255,255,0.82)";
    context.fill();
    context.strokeStyle = "rgba(148,163,184,0.34)";
    context.lineWidth = 2;
    context.stroke();

    context.fillStyle = "#ede9fe";
    roundedRect(context, padding + 26, y + 28, 58, 58, 18);
    context.fill();
    context.fillStyle = "#7c3aed";
    context.font = "900 25px Inter, Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(String(item.index + 1), padding + 55, y + 58);

    context.textAlign = "left";
    context.textBaseline = "alphabetic";
    context.fillStyle = "#111827";
    context.font = "900 34px Inter, Arial, sans-serif";
    const questionLines = wrapCanvasText(context, item.question, contentWidth - 128).slice(0, 3);
    questionLines.forEach((line, lineIndex) => {
      context.fillText(line, padding + 108, y + 56 + lineIndex * 42);
    });

    context.fillStyle = "#7c3aed";
    context.font = "900 27px Inter, Arial, sans-serif";
    context.fillText(item.result, padding + 108, y + rowHeight - 30);

    y += rowHeight + rowGap;
  });

  context.fillStyle = "#64748b";
  context.font = "800 24px Inter, Arial, sans-serif";
  context.fillText("Pick Me ile hazırlandı", padding, height - 54);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("PNG oluşturulamadı."));
    }, "image/png");
  });
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

function ResultRows({ data, isAnonymous }: { data: ResultItem[]; isAnonymous: boolean }) {
  const topFive = data.slice(0, 5);
  const remaining = data.slice(5);
  const [showAll, setShowAll] = useState(false);
  const visibleRows = showAll ? data : topFive;

  return (
    <div className="mt-6">
      <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h3 className="text-2xl font-black">Top 5</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">En çok oy alan cevaplar yatay sırada.</p>
        </div>
        {remaining.length ? (
          <button className="secondary-button min-h-10 px-4 text-sm" onClick={() => setShowAll((value) => !value)}>
            {showAll ? "Top 5'e dön" : `Tümünü göster (${data.length})`}
          </button>
        ) : null}
      </div>

      <div className="grid gap-3">
        {visibleRows.map((item, index) => (
          <div className="rounded-2xl bg-white/75 p-4" key={item.name}>
            <div className="mb-2 grid grid-cols-[36px_1fr_auto] items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-grape/10 text-sm font-black text-grape">
                {index + 1}
              </span>
              <span className="min-w-0 truncate font-black">{item.name}</span>
              <span className="shrink-0 font-black">
                {item.oy} · %{item.percent}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-gradient-to-r from-grape via-berry to-honey" style={{ width: `${item.percent}%` }} />
            </div>
            {!isAnonymous && item.voters.length ? (
              <p className="mt-2 text-xs font-semibold text-slate-600">Seçenler: {item.voters.join(", ")}</p>
            ) : null}
          </div>
        ))}
      </div>

      {remaining.length && !showAll ? (
        <p className="mt-3 text-sm font-bold text-slate-500">
          +{remaining.length} cevap daha var. Tümünü görmek için listeyi aç.
        </p>
      ) : null}
    </div>
  );
}

export function ResultsPage() {
  const { roomId = "" } = useParams();
  const { user } = useAuth();
  const [room, setRoom] = useState<QuizRoom | undefined>();
  const [loaded, setLoaded] = useState(false);
  const [shareStatus, setShareStatus] = useState("");

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

  const shareSummary = async () => {
    const text = buildSummaryShareText(room);
    const url = window.location.origin;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Pick Me: ${room.title}`,
          text,
          url,
        });
        setShareStatus("Paylaşıma hazırlandı");
      } else {
        await navigator.clipboard.writeText(text);
        setShareStatus("Özet kopyalandı");
      }
      window.setTimeout(() => setShareStatus(""), 2200);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      await navigator.clipboard.writeText(text);
      setShareStatus("Özet kopyalandı");
      window.setTimeout(() => setShareStatus(""), 2200);
    }
  };

  const shareSummaryImage = async () => {
    try {
      const blob = await createSummaryImage(room);
      const file = new File([blob], `pick-me-${room.id}.png`, { type: "image/png" });
      const canShareFile = Boolean(navigator.canShare?.({ files: [file] }));

      if (navigator.share && canShareFile) {
        await navigator.share({
          title: `Pick Me: ${room.title}`,
          text: `Pick Me sonuç özetimiz\n${window.location.origin}`,
          url: window.location.origin,
          files: [file],
        });
        setShareStatus("Görsel paylaşıma hazırlandı");
      } else {
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = `pick-me-${room.id}.png`;
        anchor.click();
        URL.revokeObjectURL(objectUrl);
        await navigator.clipboard.writeText(`Pick Me sonuç özetimiz\n${window.location.origin}`);
        setShareStatus("PNG indirildi, ana sayfa linki kopyalandı");
      }
      window.setTimeout(() => setShareStatus(""), 2200);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareStatus(error instanceof Error ? error.message : "Görsel oluşturulamadı");
      window.setTimeout(() => setShareStatus(""), 2600);
    }
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
            <div className="flex flex-wrap gap-2">
              <button className="primary-button" onClick={shareSummaryImage}>
                <Download size={18} />
                PNG paylaş
              </button>
              <button className="primary-button" onClick={shareSummary}>
                <Share2 size={18} />
                Metin paylaş
              </button>
              {isOwner ? (
                <button className="secondary-button" onClick={() => goToQuestion(room.questions.length - 1)}>
                  Son soruya dön
                </button>
              ) : null}
            </div>
          </div>
          {shareStatus ? (
            <div className="mb-4 rounded-2xl bg-mint/15 p-3 text-sm font-black text-emerald-800">{shareStatus}</div>
          ) : null}
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
              <div className="mb-6 flex items-center gap-3 rounded-2xl bg-honey/20 p-4 font-black text-amber-900">
                <Trophy size={22} />
                En çok seçilen: {winner.name} · {winner.oy} oy
              </div>
            ) : null}

            <ResultRows data={activeData} isAnonymous={room.isAnonymous} />
        </article>
      )}
    </section>
  );
}
