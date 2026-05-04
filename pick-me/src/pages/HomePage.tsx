import { ArrowRight, BarChart3, Link2, ShieldCheck, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { roomApi } from "../lib/api";
import type { QuizRoom } from "../types";

export function HomePage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<QuizRoom[]>([]);
  const recentRooms = rooms.slice(0, 3);

  useEffect(() => {
    if (!user) {
      setRooms([]);
      return;
    }
    roomApi.mine(user.id).then(setRooms).catch(() => setRooms([]));
  }, [user]);

  return (
    <div className="space-y-8">
      <section className="grid min-h-[calc(100vh-12rem)] items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <div className="eyebrow mb-5">
            Canlı grup quizleri
          </div>
          <h1 className="max-w-3xl text-5xl font-black leading-[1.02] tracking-normal md:text-7xl">
            Soruyu sor, linki paylaş, grubu konuştur.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Pick Me; arkadaş, ofis veya parti grubun için hızlı quiz odaları kurar.
            Katılımcılar linkle girer, herkes oy verir, sonuçlar aynı ekranda birlikte açılır.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="primary-button" to="/create">
              Oda kur
              <ArrowRight size={20} />
            </Link>
            <Link className="secondary-button" to="/templates">
              Şablon seç
            </Link>
          </div>
        </div>

        <div className="relative min-h-[520px]">
          <div className="rounded-[30px] border-[8px] border-[#191c25] bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between font-extrabold">
              <span>Bizim Grup Testi</span>
              <span className="rounded-xl bg-slate-100 px-3 py-2 text-sm">İleri</span>
            </div>
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-200">
              <span className="block h-full w-2/5 rounded-full bg-gradient-to-r from-grape to-berry" />
            </div>
            <div className="panel-card">
              <h2 className="mb-4 text-2xl font-black">Kim en çok geç cevap verir?</h2>
              {["Ayfer", "Ali", "Merve"].map((name, index) => (
                <div className="choice-row" key={name}>
                  <span className={`avatar avatar-${index}`}>{name[0]}</span>
                  <b>{name}</b>
                  {index === 2 ? <span className="check-dot">✓</span> : null}
                </div>
              ))}
              <button className="mt-5 h-12 w-full rounded-xl bg-slate-100 font-extrabold text-slate-600">
                Oyumu kaydet
              </button>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 w-64 rounded-[28px] border-[8px] border-[#191c25] bg-white p-5 shadow-2xl sm:w-72">
            <h3 className="mb-4 text-2xl font-black">Sonuçlar</h3>
            {[
              ["Ayfer", 50],
              ["Ali", 30],
              ["Merve", 20],
            ].map(([name, value]) => (
              <div className="mb-3 rounded-xl bg-slate-50 p-3" key={name}>
                <div className="mb-2 flex justify-between font-bold">
                  <span>{name}</span>
                  <span>{value}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-gradient-to-r from-grape to-berry" style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Feature icon={<UsersRound />} title="Linkle katılım" text="Odayı kur, bağlantıyı paylaş; katılımcılar üyelik olmadan oyuna girsin." />
        <Feature icon={<ShieldCheck />} title="Anonim kontrolü" text="Oy veren isimleri gizli kalsın veya sonuçlarda açıkça görünsün." />
        <Feature icon={<BarChart3 />} title="Canlı sonuç" text="Oda sahibi sonuçları açar, herkes aynı istatistiği birlikte takip eder." />
      </section>

      {rooms.length > 0 ? (
        <section className="panel-card">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-3xl font-black">Son 3 odan</h2>
              <p className="text-slate-600">En yeni odalarına hızlıca dön.</p>
            </div>
            <Link className="secondary-button" to="/create">
              Yeni oda kur
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {recentRooms.map((room) => (
              <Link className="rounded-xl border border-slate-200 bg-white/80 p-4 transition hover:-translate-y-0.5 hover:border-grape/30" to={`/results/${room.id}`} key={room.id}>
                <h3 className="text-lg font-black">{room.title}</h3>
                <p className="mt-2 text-sm text-slate-600">
                  {room.questions.length} soru · {room.votes.length} cevap
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-grape">
                  <Link2 size={16} />
                  Sonuçları aç
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <article className="panel-card">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-grape/10 text-grape">{icon}</div>
      <h3 className="text-xl font-black">{title}</h3>
      <p className="mt-2 leading-7 text-slate-600">{text}</p>
    </article>
  );
}
