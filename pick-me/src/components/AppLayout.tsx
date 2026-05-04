import { LogIn, LogOut, Plus, Sparkles } from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_8%_10%,rgba(139,112,221,0.16),transparent_24rem),radial-gradient(circle_at_90%_8%,rgba(91,207,180,0.14),transparent_22rem),linear-gradient(135deg,#f8fafc_0%,#f5f3ff_50%,#fff7ed_100%)] text-ink">
      <div className="mx-auto min-h-screen w-full max-w-7xl overflow-hidden bg-white/68 shadow-glow backdrop-blur-3xl md:my-4 md:min-h-[calc(100vh-2rem)] md:rounded-[24px] md:border md:border-white/80">
        <header className="sticky top-0 z-20 flex flex-col gap-4 border-b border-slate-200/70 bg-white/72 px-5 py-4 backdrop-blur-2xl md:flex-row md:items-center md:justify-between md:px-10">
          <Link to="/" className="flex items-center gap-3 text-2xl font-black tracking-normal md:text-3xl">
            <span className="grid h-10 w-10 -rotate-6 place-items-center rounded-xl bg-gradient-to-br from-grape to-berry text-white shadow-lg shadow-grape/20">
              <Sparkles size={22} />
            </span>
            Pick Me
          </Link>

          <nav className="flex gap-2 overflow-x-auto pb-1 md:items-center md:pb-0">
            <NavLink className="nav-pill" to="/templates">
              <Plus size={18} />
              Hazırdan oluştur
            </NavLink>
            <NavLink className="nav-pill" to="/create">
              <Plus size={18} />
              Quiz oluştur
            </NavLink>
            <NavLink className="nav-pill" to="/join">
              Odaya katıl
            </NavLink>
            {user ? (
              <button
                className="nav-pill shrink-0"
                onClick={() => {
                  signOut();
                  navigate("/");
                }}
              >
                <LogOut size={18} />
                {user.name}
              </button>
            ) : (
              <NavLink className="primary-pill" to="/auth">
                <LogIn size={18} />
                Giriş yap
              </NavLink>
            )}
          </nav>
        </header>

        <main className="px-5 py-6 md:px-10 md:py-10">
          <Outlet />
        </main>

        <footer className="border-t border-slate-200/70 px-5 py-6 md:px-10">
          <div className="flex flex-col gap-4 text-sm font-bold text-slate-500 md:flex-row md:items-center md:justify-between">
            <div>
              <Link to="/" className="text-base font-black text-ink">
                Pick Me
              </Link>
              <p className="mt-1 font-semibold">Linkle oynanan canlı grup quizleri.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className="hover:text-grape" to="/templates">
                Hazırdan oluştur
              </Link>
              <Link className="hover:text-grape" to="/create">
                Quiz oluştur
              </Link>
              <Link className="hover:text-grape" to="/join">
                Odaya katıl
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
