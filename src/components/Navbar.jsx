import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="fixed bottom-0 w-full max-w-[430px] bg-background-dark/95 border-t border-white/10 px-6 py-4 backdrop-blur-xl flex justify-between items-center z-50">
            <button
                onClick={() => navigate("/overview")}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${isActive("/overview") ? "text-primary" : "text-gray-500 hover:text-primary"
                    }`}
            >
                <span className={`material-symbols-outlined text-2xl ${isActive("/overview") ? "fill-icon" : ""}`}>
                    dashboard
                </span>
                <span className="text-[10px] font-bold uppercase tracking-tighter">Overview</span>
            </button>

            <button
                onClick={() => navigate("/itinerary")}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${isActive("/itinerary") ? "text-primary" : "text-gray-500 hover:text-primary"
                    }`}
            >
                <span className="material-symbols-outlined text-2xl">explore</span>
                <span className="text-[10px] font-medium uppercase tracking-tighter">Guide</span>
            </button>

            <button
                onClick={() => navigate("/add-expense")}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${isActive("/add-expense") ? "text-primary" : "text-gray-500 hover:text-primary"
                    }`}
            >
                <span className="material-symbols-outlined text-2xl">payments</span>
                <span className="text-[10px] font-medium uppercase tracking-tighter">Expenses</span>
            </button>

            <button
                className="flex flex-col items-center gap-1 text-gray-500 hover:text-primary transition-colors cursor-pointer"
            >
                <span className="material-symbols-outlined text-2xl">settings</span>
                <span className="text-[10px] font-medium uppercase tracking-tighter">Settings</span>
            </button>
        </nav>
    );
}
