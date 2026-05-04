import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function AboutPage() {
  return (
    <section className="mx-auto max-w-4xl panel-card">
      <div className="eyebrow mb-5">Pick Me hakkında</div>
      <h1 className="text-5xl font-black leading-tight">Grup içi kararları ve eğlenceli oylamaları kolaylaştırır.</h1>
      <p className="mt-5 leading-8 text-slate-600">
        Pick Me; arkadaş grupları, ekipler ve etkinlikler için linkle katılınan canlı quiz odaları oluşturur.
        Oda sahibi akışı yönetir, katılımcılar üyelik olmadan oy verir, sonuçlar birlikte izlenir.
      </p>
      <div className="mt-7 grid gap-4 md:grid-cols-3">
        <InfoCard title="Hızlı kurulum" text="Hazır quiz seç veya kendi sorularını birkaç dakikada oluştur." />
        <InfoCard title="Kontrollü akış" text="Odayı başlatma, sonuç açma ve soru geçişleri oda sahibindedir." />
        <InfoCard title="Paylaşılabilir sonuç" text="Özet ekranını metin veya PNG olarak paylaşabilirsin." />
      </div>
      <Link className="primary-button mt-7" to="/create">
        İlk odanı kur
      </Link>
    </section>
  );
}

export function PrivacyPage() {
  return (
    <LegalPage title="Gizlilik Politikası">
      <p>Pick Me, quiz odalarını çalıştırmak için hesap e-postanı, görünen adını, oluşturduğun oda bilgilerini ve katılımcı oylarını saklar.</p>
      <p>Katılımcılar üyelik olmadan odaya girebilir. Oda ayarına göre oy veren isimleri sonuçlarda gizlenebilir veya gösterilebilir.</p>
      <p>Veriler Supabase altyapısında tutulur. Oda linkine sahip kişiler ilgili oda ve sonuç ekranlarına erişebilir.</p>
      <p>Hassas kişisel bilgi, şifre veya özel veri quiz sorusu/cevabı olarak paylaşmamanı öneririz.</p>
    </LegalPage>
  );
}

export function TermsPage() {
  return (
    <LegalPage title="Kullanım Koşulları">
      <p>Pick Me eğlence, ekip içi buz kırıcı ve grup oylaması amacıyla sunulur.</p>
      <p>Oluşturduğun soru, cevap ve oda içeriklerinden sen sorumlusun. Başkalarının kişisel haklarını ihlal eden içerikler paylaşmamalısın.</p>
      <p>Oda linkini paylaştığın kişiler odaya katılabilir. Linki güvenilir kişilerle paylaşman gerekir.</p>
      <p>Uygulama geliştirme aşamasındadır; özellikler, veri modeli ve kullanım akışları zaman içinde değişebilir.</p>
    </LegalPage>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white/75 p-4">
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-2 leading-7 text-slate-600">{text}</p>
    </article>
  );
}

function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mx-auto max-w-3xl panel-card">
      <h1 className="text-5xl font-black leading-tight">{title}</h1>
      <div className="mt-6 space-y-4 leading-8 text-slate-600">{children}</div>
      <p className="mt-8 text-sm font-bold text-slate-500">Son güncelleme: Mayıs 2026</p>
    </section>
  );
}
