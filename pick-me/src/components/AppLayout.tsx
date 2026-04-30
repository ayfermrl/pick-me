import { LogIn, LogOut, Plus, Sparkles } from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_14%,rgba(139,112,221,0.20),transparent_25rem),radial-gradient(circle_at_86%_12%,rgba(91,207,180,0.18),transparent_24rem),linear-gradient(135deg,#fbfbff_0%,#f4f5fb_48%,#fff7fb_100%)] text-ink">
      <div className="mx-auto min-h-screen w-full max-w-7xl overflow-hidden bg-white/55 shadow-glow backdrop-blur-3xl md:my-4 md:min-h-[calc(100vh-2rem)] md:rounded-[28px] md:border md:border-white/70">
        <header className="flex flex-col gap-4 border-b border-white/70 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-10">
          <Link to="/" className="flex items-center gap-3 text-2xl font-black tracking-normal md:text-3xl">
            <span className="grid h-10 w-10 -rotate-6 place-items-center rounded-2xl bg-gradient-to-br from-grape to-berry text-white">
              <Sparkles size={22} />
            </span>
            Pick Me
          </Link>

          <nav className="flex gap-2 overflow-x-auto pb-1 md:items-center md:pb-0">
            <NavLink className="nav-pill" to="/templates">
              Hazır quizler
            </NavLink>
            <NavLink className="nav-pill" to="/create">
              <Plus size={18} />
              Quiz oluştur
            </NavLink>
            <NavLink className="nav-pill" to="/join">
              Link ile gir
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
                Giriş
              </NavLink>
            )}
          </nav>
        </header>

        <main className="px-5 py-6 md:px-10 md:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
