import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { friendlyError } from "../lib/errors";
import { isSupabaseConfigured } from "../lib/supabase";

type FormValues = {
  name: string;
  email: string;
  password: string;
};

export function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState("");
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState } = useForm<FormValues>();

  if (user) return <Navigate to="/create" replace />;

  const submit = async (values: FormValues) => {
    setError("");
    try {
      if (mode === "signup") await signUp(values.name, values.email, values.password);
      else await signIn(values.email, values.password);
      navigate("/create");
    } catch (err) {
      setError(friendlyError(err, "Giriş işlemi tamamlanamadı."));
    }
  };

  return (
    <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="panel-card">
        <div className="eyebrow mb-5">
          {mode === "signup" ? "Hesap oluştur" : "Tekrar hoş geldin"}
        </div>
        <h1 className="text-5xl font-black leading-tight">
          Odalarını kurmak ve yönetmek için giriş yap.
        </h1>
        <p className="mt-5 leading-8 text-slate-600">
          Hesabınla quiz odası oluşturabilir, link paylaşabilir ve sonuçları tekrar açabilirsin.
          Katılımcılar için üyelik gerekmez.
        </p>
        <div className="mt-6 rounded-xl bg-slate-900 p-4 text-sm leading-6 text-white">
          Supabase durumu: {isSupabaseConfigured ? "Bağlantı anahtarları hazır." : "Şimdilik yerel demo modu aktif."}
        </div>
      </div>

      <form className="panel-card space-y-4" onSubmit={handleSubmit(submit)}>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          <button className={`tab-button ${mode === "signin" ? "active" : ""}`} type="button" onClick={() => setMode("signin")}>
            Giriş yap
          </button>
          <button className={`tab-button ${mode === "signup" ? "active" : ""}`} type="button" onClick={() => setMode("signup")}>
            Kaydol
          </button>
        </div>

        {mode === "signup" ? (
          <label className="field">
            <span>Ad soyad</span>
            <div className="input-shell">
              <UserRound size={18} />
              <input {...register("name", { required: mode === "signup" })} placeholder="Adını yaz" />
            </div>
          </label>
        ) : null}

        <label className="field">
          <span>E-posta</span>
          <div className="input-shell">
            <Mail size={18} />
            <input {...register("email", { required: true })} placeholder="ornek@mail.com" type="email" />
          </div>
        </label>

        <label className="field">
          <span>Şifre</span>
          <div className="input-shell">
            <LockKeyhole size={18} />
            <input {...register("password", { required: true, minLength: 4 })} placeholder="En az 4 karakter" type="password" />
          </div>
        </label>

        {error ? <p className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p> : null}
        {formState.errors.password ? <p className="text-sm font-bold text-pink-700">Şifre en az 4 karakter olmalı.</p> : null}

        <button className="primary-button w-full justify-center" type="submit">
          {mode === "signup" ? "Hesap oluştur ve devam et" : "Giriş yap ve devam et"}
        </button>
      </form>
    </section>
  );
}
