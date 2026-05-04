import { Copy, Play, UserMinus, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { roomApi } from "../lib/api";
import { friendlyError } from "../lib/errors";
import type { QuizRoom } from "../types";

function voterKeyOf(name: string) {
  return name.trim().toLocaleLowerCase("tr-TR");
}

function finishedCount(room: QuizRoom) {
  return room.participants.filter((participant) => {
    const key = voterKeyOf(participant);
    const answeredQuestions = new Set(
      room.votes
        .filter((vote) => (vote.voterKey || voterKeyOf(vote.voterName)) === key)
        .map((vote) => vote.questionId),
    );
    return answeredQuestions.size >= room.questions.length;
  }).length;
}

function answeredCountFor(room: QuizRoom, name: string) {
  const key = voterKeyOf(name);
  return new Set(
    room.votes
      .filter((vote) => (vote.voterKey || voterKeyOf(vote.voterName)) === key)
      .map((vote) => vote.questionId),
  ).size;
}

function routeAfterSync(room: QuizRoom, savedName: string | null, navigate: ReturnType<typeof useNavigate>) {
  if (!savedName) return;
  if (room.resultsReleased) {
    navigate(`/results/${room.id}`);
    return;
  }
  if (!room.isStarted) return;
  const answeredCount = answeredCountFor(room, savedName);
  if (answeredCount < room.questions.length) {
    navigate(`/play/${room.id}/${answeredCount}`);
  }
}

export function JoinPage() {
  const { roomId } = useParams();
  const [room, setRoom] = useState<QuizRoom | undefined>();
  const [loaded, setLoaded] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);
  const [roomError, setRoomError] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!roomId) return;
    setLoaded(false);
    roomApi
      .get(roomId)
      .then(setRoom)
      .catch(() => setRoom(undefined))
      .finally(() => setLoaded(true));
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    return roomApi.subscribe(roomId, (nextRoom) => {
      setRoom(nextRoom);
      const savedName = sessionStorage.getItem(`pick-me-voter-${nextRoom.id}`);
      routeAfterSync(nextRoom, savedName, navigate);
    });
  }, [navigate, roomId]);

  useEffect(() => {
    if (!roomId) return;
    const syncRoom = async () => {
      const nextRoom = await roomApi.get(roomId);
      if (!nextRoom) return;
      setRoom(nextRoom);
      const savedName = sessionStorage.getItem(`pick-me-voter-${nextRoom.id}`);
      routeAfterSync(nextRoom, savedName, navigate);
    };
    const timer = window.setInterval(syncRoom, 1200);
    return () => window.clearInterval(timer);
  }, [navigate, roomId]);

  useEffect(() => {
    if (!room || !user || user.id !== room.ownerId) return;
    const ownerName = user.name.trim();
    if (!ownerName) return;
    sessionStorage.setItem(`pick-me-voter-${room.id}`, ownerName);
    const isOwnerListed = room.participants.some((participant) => participant.toLocaleLowerCase("tr-TR") === ownerName.toLocaleLowerCase("tr-TR"));
    if (isOwnerListed) return;
    roomApi.addParticipant(room.id, ownerName).then((updatedRoom) => {
      if (updatedRoom) setRoom(updatedRoom);
    });
  }, [room, user]);

  if (!roomId) {
    return (
      <section className="mx-auto max-w-2xl panel-card">
        <h1 className="text-4xl font-black">Odaya katıl</h1>
        <p className="mt-3 leading-7 text-slate-600">Sana gelen oda kodunu yaz veya davet linkini aç.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input className="plain-input" value={manualCode} onChange={(event) => setManualCode(event.target.value)} placeholder="room-..." />
          <button className="primary-button justify-center" onClick={() => manualCode && navigate(`/join/${manualCode}`)}>
            Odayı aç
          </button>
        </div>
      </section>
    );
  }

  if (!loaded) {
    return (
      <section className="mx-auto max-w-2xl panel-card text-center">
        <h1 className="text-4xl font-black">Oda hazırlanıyor</h1>
        <p className="mt-3 leading-7 text-slate-600">Davet bilgileri alınıyor.</p>
      </section>
    );
  }

  if (!room) {
    return (
      <section className="mx-auto max-w-2xl panel-card text-center">
        <h1 className="text-4xl font-black">Oda bulunamadı</h1>
        <p className="mt-3 leading-7 text-slate-600">Oda kodu hatalı olabilir veya bu oda artık kullanılamıyor olabilir.</p>
        <Link className="primary-button mt-6 justify-center" to="/">
          Ana sayfa
        </Link>
      </section>
    );
  }

  const link = `${window.location.origin}/join/${room.id}`;
  const loggedInName = user?.name.trim() || "";
  const voterName = loggedInName || name.trim() || "Anonim";
  const isOwner = user?.id === room.ownerId;
  const hasJoined = Boolean(sessionStorage.getItem(`pick-me-voter-${room.id}`));
  const allFinished = room.participants.length > 0 && finishedCount(room) >= room.participants.length;
  const answeredCount = answeredCountFor(room, voterName);
  const currentPlayerFinished = answeredCount >= room.questions.length;

  return (
    <section className="mx-auto max-w-3xl panel-card">
      <div className="mb-6">
        <h1 className="text-4xl font-black">{room.title}</h1>
        <p className="mt-3 leading-7 text-slate-600">
          {room.questions.length} soru · {room.participants.length} katılımcı · {room.isAnonymous ? "Anonim sonuç" : "İsimli sonuç"}
        </p>
      </div>

      <div className="grid gap-2 rounded-xl bg-slate-100 p-2 sm:grid-cols-[1fr_auto]">
        <input className="plain-input bg-white" readOnly value={link} />
        <button
          className="secondary-button justify-center"
          onClick={async () => {
            await navigator.clipboard.writeText(link);
            setCopied(true);
          }}
        >
          <Copy size={18} />
          {copied ? "Kopyalandı" : "Kopyala"}
        </button>
      </div>

      {loggedInName ? (
        <div className="success-box mt-6">
          {loggedInName} olarak katılıyorsun.
        </div>
      ) : (
        <label className="field mt-6">
          <span>{room.requireName ? "Katılımcı adı" : "Takma ad"}</span>
          <input className="plain-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Adını yaz" />
        </label>
      )}

      <div className="mt-6 rounded-xl border border-slate-200 bg-white/70 p-4">
        <div className="mb-3 flex items-center gap-2 font-black">
          <UsersRound size={20} />
          Bekleme odası
        </div>
        {room.participants.length ? (
          <div className="flex flex-wrap gap-2">
            {room.participants.map((participant) => (
              <span className="inline-flex items-center gap-2 rounded-full bg-grape/10 px-3 py-2 text-sm font-bold text-grape" key={participant}>
                {participant}
                {isOwner && participant.toLocaleLowerCase("tr-TR") !== user?.name.trim().toLocaleLowerCase("tr-TR") ? (
                  <button
                    className="rounded-full p-1 text-grape transition hover:bg-white"
                    type="button"
                    aria-label={`${participant} katılımcısını çıkar`}
                    onClick={async () => {
                      setRoomError("");
                      try {
                        const updatedRoom = await roomApi.removeParticipant(room.id, participant);
                        if (updatedRoom) setRoom(updatedRoom);
                      } catch (error) {
                        setRoomError(friendlyError(error, "Katılımcı çıkarılamadı."));
                      }
                    }}
                  >
                    <UserMinus size={14} />
                  </button>
                ) : null}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm font-semibold text-slate-500">Henüz katılımcı yok.</p>
        )}
      </div>
      {roomError ? <div className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{roomError}</div> : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {!hasJoined && !isOwner ? (
          <button
            className="primary-button justify-center"
            onClick={async () => {
              setRoomError("");
              if (room.requireName && !voterName.trim()) {
                setRoomError("Devam etmek için adını yaz.");
                return;
              }
              try {
                const updatedRoom = await roomApi.addParticipant(room.id, voterName);
                sessionStorage.setItem(`pick-me-voter-${room.id}`, voterName);
                if (updatedRoom) setRoom(updatedRoom);
                if (updatedRoom?.isStarted) navigate(`/play/${updatedRoom.id}/0`);
              } catch (error) {
                setRoomError(friendlyError(error, "Odaya katılım tamamlanamadı."));
              }
            }}
          >
            <Play size={18} />
            Katıl ve bekle
          </button>
        ) : null}

        {isOwner ? (
          <button
            className="primary-button justify-center"
            disabled={room.participants.length < 1}
            onClick={async () => {
              setRoomError("");
              try {
                const updatedRoom = await roomApi.startRoom(room.id);
                if (updatedRoom) setRoom(updatedRoom);
                navigate(`/play/${room.id}/0`);
              } catch (error) {
                setRoomError(friendlyError(error, "Oyun başlatılamadı."));
              }
            }}
          >
            <Play size={18} />
            Oyunu başlat
          </button>
        ) : null}
      </div>

      {!isOwner && hasJoined && !room.isStarted ? (
        <div className="warning-box mt-4">
          Oda sahibi oyunu başlatınca quiz otomatik açılacak.
        </div>
      ) : null}

      {!isOwner && hasJoined && room.isStarted && !allFinished ? (
        <div className="success-box mt-4">
          {currentPlayerFinished ? "Cevapların kaydedildi. Herkes bitirince sonuçlar açılacak." : "Oyun başladı. Kaldığın yerden devam edebilirsin."}
        </div>
      ) : null}

      {!isOwner && hasJoined && room.isStarted && allFinished && !room.resultsReleased ? (
        <div className="warning-box mt-4">
          Herkes tamamladı. Oda sahibi sonuçları açınca otomatik geçeceksin.
        </div>
      ) : null}

      {!isOwner && hasJoined && room.isStarted && !currentPlayerFinished ? (
        <Link className="primary-button mt-4 justify-center" to={`/play/${room.id}/${answeredCount}`}>
          Devam et
        </Link>
      ) : null}

      {!isOwner && hasJoined && room.isStarted && allFinished && room.resultsReleased ? (
        <Link className="primary-button mt-4 justify-center" to={`/results/${room.id}`}>
          Sonuçlara git
        </Link>
      ) : null}

      {isOwner && room.isStarted ? (
        <div className="mt-4 rounded-xl bg-grape/10 p-4 text-sm font-bold leading-6 text-grape">
          Tamamlayanlar: {finishedCount(room)} / {room.participants.length}
        </div>
      ) : null}

      {isOwner && room.isStarted && currentPlayerFinished ? (
        <button
          className="primary-button mt-4 justify-center"
          disabled={!allFinished}
          onClick={async () => {
            const updatedRoom = await roomApi.releaseResults(room.id);
            if (updatedRoom) setRoom(updatedRoom);
            navigate(`/results/${room.id}`);
          }}
        >
          Sonuçları aç
        </button>
      ) : null}

      {isOwner && room.isStarted && currentPlayerFinished && !allFinished ? (
        <div className="mt-3 text-sm font-bold text-slate-500">
          Tüm katılımcılar bitirince sonuç butonu aktif olacak.
        </div>
      ) : null}

      {isOwner && room.participants.length < 1 ? (
        <div className="warning-box mt-4">
          Oyunu başlatmak için en az 1 kişinin odaya katılması gerekiyor.
        </div>
      ) : null}
    </section>
  );
}
