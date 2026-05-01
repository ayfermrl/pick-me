import { ArrowRight, Tags } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { templates } from "../data/templates";

export function TemplatesPage() {
  const categories = useMemo(() => ["Tümü", ...Array.from(new Set(templates.map((template) => template.category)))], []);
  const [selectedCategory, setSelectedCategory] = useState("Tümü");
  const visibleTemplates =
    selectedCategory === "Tümü" ? templates : templates.filter((template) => template.category === selectedCategory);

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Hazır quizler</h1>
          <p>Kaotik, kızsal, karışık, ofis ve parti gibi konulardan şablon seç; sonra soruları istediğin gibi düzenle.</p>
        </div>
        <Link className="primary-button" to="/create">
          Sıfırdan oluştur
          <ArrowRight size={20} />
        </Link>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            className={`shrink-0 rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
              selectedCategory === category ? "bg-grape text-white shadow-lg shadow-grape/20" : "border border-slate-200 bg-white/75 text-slate-700"
            }`}
            key={category}
            onClick={() => setSelectedCategory(category)}
            type="button"
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {visibleTemplates.map((template) => (
          <article className="panel-card flex flex-col" key={template.id}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-mint/15 text-emerald-700">
                <Tags size={22} />
              </div>
              <span className="rounded-full bg-white px-3 py-1.5 text-sm font-black text-slate-500">
                {template.category}
              </span>
            </div>
            <h2 className="text-2xl font-black">{template.title}</h2>
            <p className="mt-2 flex-1 leading-7 text-slate-600">{template.description}</p>
            <p className="mt-4 text-sm font-black text-slate-500">{template.questions.length} soru</p>
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
