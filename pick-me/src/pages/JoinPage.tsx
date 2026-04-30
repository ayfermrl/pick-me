import { Copy, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { roomApi } from "../lib/api";
import type { QuizRoom } from "../types";

export function JoinPage() {
  const { roomId } = useParams();
  const [room, setRoom] = useState<QuizRoom | undefined>();
  const [loaded, setLoaded] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!roomId) return;
    setLoaded(false);
    roomApi
      .get(roomId)
      .then(setRoom)
      .finally(() => setLoaded(true));
  }, [roomId]);

  if (!roomId) {
    return (
      <section className="mx-auto max-w-2xl panel-card">
        <h1 className="text-4xl font-black">Link ile gir</h1>
        <p className="mt-3 leading-7 text-slate-600">Sana gelen oda kodunu yaz veya tam linki aç.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input className="plain-input" value={manualCode} onChange={(event) => setManualCode(event.target.value)} placeholder="room-..." />
          <button className="primary-button justify-center" onClick={() => manualCode && navigate(`/join/${manualCode}`)}>
            Odaya git
          </button>
        </div>
      </section>
    );
  }

  if (!loaded) {
    return (
      <section className="mx-auto max-w-2xl panel-card text-center">
        <h1 className="text-4xl font-black">Oda hazırlanıyor</h1>
        <p className="mt-3 leading-7 text-slate-600">Backend’den oda bilgisi alınıyor.</p>
      </section>
    );
  }

  if (!room) {
    return (
      <section className="mx-auto max-w-2xl panel-card text-center">
        <h1 className="text-4xl font-black">Oda bulunamadı</h1>
        <p className="mt-3 leading-7 text-slate-600">Oda kodu hatalı olabilir veya backend henüz çalışmıyor olabilir.</p>
        <Link className="primary-button mt-6 justify-center" to="/">
          Ana sayfa
        </Link>
      </section>
    );
  }

  const link = `${window.location.origin}/join/${room.id}`;
  const loggedInName = user?.name.trim() || "";
  const voterName = loggedInName || name.trim() || "Anonim";

  return (
    <section className="mx-auto max-w-3xl panel-card">
      <div className="mb-6">
        <h1 className="text-4xl font-black">{room.title}</h1>
        <p className="mt-3 leading-7 text-slate-600">
          {room.questions.length} soru · {room.participants.length} katılımcı · {room.isAnonymous ? "Anonim sonuç" : "İsimli sonuç"}
        </p>
      </div>

      <div className="grid gap-2 rounded-2xl bg-slate-100 p-2 sm:grid-cols-[1fr_auto]">
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
        <div className="mt-6 rounded-2xl bg-mint/15 p-4 text-sm font-bold leading-6 text-emerald-800">
          {loggedInName} olarak katılıyorsun.
        </div>
      ) : (
        <label className="field mt-6">
          <span>{room.requireName ? "Katılımcı adı" : "Takma ad"}</span>
          <input className="plain-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Adını yaz" />
        </label>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          className="primary-button justify-center"
          onClick={async () => {
            if (room.requireName && !voterName.trim()) return;
            await roomApi.addParticipant(room.id, voterName);
            sessionStorage.setItem(`pick-me-voter-${room.id}`, voterName);
            navigate(`/play/${room.id}/0`);
          }}
        >
          <Play size={18} />
          Quize başla
        </button>
      </div>
    </section>
  );
}
