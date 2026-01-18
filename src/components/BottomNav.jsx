import { useNavigate, useLocation } from "react-router-dom";

export default function BottomNav() {
    const navigate = useNavigate();
    const location = useLocation();

    // Helper to determine if a tab is active based on the URL path
    const isActive = (path) => location.pathname.startsWith(path);

    const navItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: 'space_dashboard', // Material Symbol for dashboard
            path: '/overview',
        },
        {
            id: 'add-expense',
            label: 'Add Expense',
            icon: 'payments', // Material Symbol for payments/dollar sign
            path: '/add-expense',
        },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#121212] border-t border-white/10 px-10 pb-8 pt-3 flex justify-around items-center z-50 max-w-[430px] mx-auto">
            {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={`flex flex-col items-center justify-center w-20 transition-all duration-200 active:scale-90 ${isActive(item.path) ? 'text-[#FDB927]' : 'text-white/30 hover:text-white/60'
                        }`}
                >
                    <div className={`mb-1 ${isActive(item.path) ? 'drop-shadow-[0_0_8px_rgba(253,185,39,0.4)]' : ''}`}>
                        <span className="material-symbols-outlined text-2xl fill-icon">{item.icon}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase italic tracking-widest text-center leading-none">
                        {item.label}
                    </span>

                    {/* Active Indicator Line */}
                    {isActive(item.path) && (
                        <div className="absolute -bottom-1 w-1 h-1 bg-[#FDB927] rounded-full shadow-[0_0_5px_#FDB927]" />
                    )}
                </button>
            ))}
        </nav>
    );
}
