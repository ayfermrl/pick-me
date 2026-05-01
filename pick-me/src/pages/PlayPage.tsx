import { ArrowRight, Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { normalizeVoterKey, roomApi, uid } from "../lib/api";
import type { QuizRoom } from "../types";

const optionLetter = (index: number) => String.fromCharCode(65 + index);

function answeredCountFor(room: QuizRoom, voterKey: string) {
  return new Set(
    room.votes
      .filter((vote) => (vote.voterKey || normalizeVoterKey(vote.voterName)) === voterKey)
      .map((vote) => vote.questionId),
  ).size;
}

function everyoneFinished(room: QuizRoom) {
  return (
    room.participants.length > 0 &&
    room.participants.every((participant) => answeredCountFor(room, normalizeVoterKey(participant)) >= room.questions.length)
  );
}

export function PlayPage() {
  const { roomId = "", questionIndex = "0" } = useParams();
  const [room, setRoom] = useState<QuizRoom | undefined>();
  const [loaded, setLoaded] = useState(false);
  const index = Number(questionIndex);
  const navigate = useNavigate();
  const { user } = useAuth();
  const voterName = sessionStorage.getItem(`pick-me-voter-${roomId}`) || "Anonim";
  const voterKey = normalizeVoterKey(voterName);
  const question = room?.questions[index];
  const existingVote = room?.votes.find(
    (vote) => vote.questionId === question?.id && (vote.voterKey || normalizeVoterKey(vote.voterName)) === voterKey,
  );
  const [answer, setAnswer] = useState(existingVote?.answer || "");

  useEffect(() => {
    setLoaded(false);
    roomApi
      .get(roomId)
      .then(setRoom)
      .finally(() => setLoaded(true));
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    return roomApi.subscribe(roomId, (nextRoom) => {
      setRoom(nextRoom);
      if (nextRoom.resultsReleased) navigate(`/results/${nextRoom.id}`);
    });
  }, [navigate, roomId]);

  useEffect(() => {
    if (!roomId) return;
    const timer = window.setInterval(async () => {
      const nextRoom = await roomApi.get(roomId);
      if (!nextRoom) return;
      setRoom(nextRoom);
      if (nextRoom.resultsReleased) navigate(`/results/${nextRoom.id}`);
    }, 1200);
    return () => window.clearInterval(timer);
  }, [navigate, roomId]);

  const options = useMemo(() => {
    if (!room || !question) return [];
    const legacyOptions = (question as unknown as { options?: string[] }).options || [];
    if (question.answerMode === "participants") {
      return [...new Set([...(room.participants || []), voterName].filter(Boolean))];
    }
    if (question.answerMode === "custom") return question.customOptions;
    return legacyOptions;
  }, [question, room, voterName]);

  if (!loaded) {
    return (
      <section className="mx-auto max-w-2xl panel-card text-center">
        <h1 className="text-4xl font-black">Quiz yükleniyor</h1>
        <p className="mt-3 leading-7 text-slate-600">Backend’den soru bilgisi alınıyor.</p>
      </section>
    );
  }

  if (!room) {
    return (
      <section className="mx-auto max-w-2xl panel-card text-center">
        <h1 className="text-4xl font-black">Soru bulunamadı</h1>
        <Link className="primary-button mt-6 justify-center" to="/">
          Ana sayfa
        </Link>
      </section>
    );
  }

  if (!room.isStarted) {
    return (
      <section className="mx-auto max-w-2xl panel-card text-center">
        <h1 className="text-4xl font-black">Oyun henüz başlamadı</h1>
        <p className="mt-3 leading-7 text-slate-600">Host oyunu başlatınca quiz ekranı açılacak.</p>
        <Link className="primary-button mt-6 justify-center" to={`/join/${room.id}`}>
          Bekleme odasına dön
        </Link>
      </section>
    );
  }

  const isOwner = user?.id === room.ownerId;
  const answeredCount = answeredCountFor(room, voterKey);
  const isFinished = answeredCount >= room.questions.length;
  const allFinished = everyoneFinished(room);

  if (isFinished) {
    return (
      <section className="mx-auto max-w-3xl panel-card text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-mint/15 text-emerald-700">
          <Check size={28} />
        </div>
        <h1 className="text-4xl font-black">Quiz tamamlandı</h1>
        <p className="mt-3 leading-7 text-slate-600">
          {isOwner
            ? "Herkes bitirdiğinde sonuçları açabilirsin."
            : "Oda sahibi herkes bitirince sonuç ekranını açacaktır."}
        </p>
        <div className="mt-6 rounded-2xl bg-white/75 p-4 text-sm font-black text-slate-600">
          Tamamlayanlar: {room.participants.filter((participant) => answeredCountFor(room, normalizeVoterKey(participant)) >= room.questions.length).length} /{" "}
          {room.participants.length}
        </div>

        {isOwner ? (
          <>
            <button
              className="primary-button mt-6 w-full justify-center"
              disabled={!allFinished}
              onClick={async () => {
                const updatedRoom = await roomApi.releaseResults(room.id);
                if (updatedRoom) setRoom(updatedRoom);
                navigate(`/results/${room.id}`);
              }}
            >
              Sonuçları gör
            </button>
            {!allFinished ? (
              <p className="mt-3 text-sm font-bold text-slate-500">Herkes bitirince buton aktif olacak.</p>
            ) : null}
          </>
        ) : (
          <div className="mt-6 rounded-2xl bg-honey/20 p-4 text-sm font-bold leading-6 text-amber-900">
            Sonuçlar host tarafından açılınca otomatik geçeceksin.
          </div>
        )}
      </section>
    );
  }

  if (!question) {
    return (
      <section className="mx-auto max-w-2xl panel-card text-center">
        <h1 className="text-4xl font-black">Soru bulunamadı</h1>
        <Link className="primary-button mt-6 justify-center" to={`/join/${room.id}`}>
          Odaya dön
        </Link>
      </section>
    );
  }

  const progress = Math.round(((index + 1) / room.questions.length) * 100);

  return (
    <section className="mx-auto max-w-3xl panel-card">
      <div className="mb-5 flex items-center justify-between gap-4 text-sm font-extrabold text-slate-500">
        <span>Adım {index + 1} / {room.questions.length}</span>
        <span>{voterName}</span>
      </div>
      <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-gradient-to-r from-grape to-berry" style={{ width: `${progress}%` }} />
      </div>

      <h1 className="mb-6 text-4xl font-black leading-tight">{question.text}</h1>

      {options.length === 0 ? (
        <div className="rounded-2xl bg-honey/20 p-4 font-bold leading-6 text-amber-900">
          Bu soru katılımcı adlarını cevap olarak kullanıyor. Odaya katılan ilk isimler göründükçe seçenekler oluşur.
        </div>
      ) : (
        <div className="grid gap-3">
          {options.map((option, optionIndex) => (
            <button
              className={`answer-card ${answer === option ? "active" : ""}`}
              key={option}
              onClick={() => setAnswer(option)}
            >
              <span className={`avatar avatar-${optionIndex % 3}`}>{optionLetter(optionIndex)}</span>
              <b>{option}</b>
              {answer === option ? <Check /> : null}
            </button>
          ))}
        </div>
      )}

      <button
        className="primary-button mt-6 w-full justify-center"
        disabled={!answer}
        onClick={async () => {
          const updatedRoom = await roomApi.vote(room.id, {
            id: uid("vote"),
            questionId: question.id,
            answer,
            voterName,
            voterKey,
            createdAt: new Date().toISOString(),
          });
          if (updatedRoom) setRoom(updatedRoom);
          if (index + 1 >= room.questions.length) return;
          else navigate(`/play/${room.id}/${index + 1}`);
        }}
      >
        {index + 1 >= room.questions.length ? "Bitir ve bekle" : "Sonraki soru"}
        <ArrowRight size={18} />
      </button>
    </section>
  );
}
