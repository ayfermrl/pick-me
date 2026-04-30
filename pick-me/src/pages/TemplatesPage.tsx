import { ArrowRight, Tags } from "lucide-react";
import { Link } from "react-router-dom";
import { templates } from "../data/templates";

export function TemplatesPage() {
  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Hazır quizler</h1>
          <p>Şablon seç, soruları düzenle ve linki paylaş. Hepsi sonradan özelleştirilebilir.</p>
        </div>
        <Link className="primary-button" to="/create">
          Sıfırdan oluştur
          <ArrowRight size={20} />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {templates.map((template) => (
          <article className="panel-card flex flex-col" key={template.id}>
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-mint/15 text-emerald-700">
              <Tags size={22} />
            </div>
            <h2 className="text-2xl font-black">{template.title}</h2>
            <p className="mt-2 flex-1 leading-7 text-slate-600">{template.description}</p>
            <div className="my-5 flex flex-wrap gap-2">
              {template.tags.map((tag) => (
                <span className="rounded-full bg-grape/10 px-3 py-1.5 text-sm font-bold text-grape" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
            <Link className="primary-button w-full justify-center" to={`/create/${template.id}`}>
              Bu quizle başla
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
