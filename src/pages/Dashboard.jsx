import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import itineraryData from "../data/itinerary.json";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore"; // Import needed functions
import { db } from "../firebase"; // Import db

export default function Dashboard() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [totalExpense, setTotalExpense] = useState(0);

    // Calculate total expense for current user
    useEffect(() => {
        async function fetchExpenses() {
            if (!currentUser) return;

            try {
                // Query expenses where paidBy is current user OR splitWith contains current user
                // simplified for now: just fetch all and filter in client or just paidBy
                const q = query(collection(db, "expenses"), where("paidBy", "==", currentUser.uid));
                const querySnapshot = await getDocs(q);
                let total = 0;
                querySnapshot.forEach((doc) => {
                    total += parseFloat(doc.data().amount);
                });
                setTotalExpense(total);
            } catch (error) {
                console.error("Error fetching expenses:", error);
            }
        }

        fetchExpenses();
    }, [currentUser]);

    return (
        <div className="relative w-full max-w-[430px] mx-auto flex flex-col bg-background-dark min-h-screen pb-24 font-display">
            {/* Header */}
            <header className="sticky top-0 z-50 flex items-center bg-background-dark/80 ios-blur p-4 border-b border-white/5">
                <div className="flex size-10 items-center justify-center cursor-pointer active:opacity-50 transition-opacity">
                    <span className="material-symbols-outlined text-gray-400">menu</span>
                </div>
                <h1 className="text-white text-base font-bold flex-1 text-center tracking-tight">洛杉磯總覽</h1>
                <div className="flex size-10 items-center justify-center">
                    {currentUser?.photoURL ? (
                        <img src={currentUser.photoURL} alt="User" className="size-8 rounded-full border border-primary/30" />
                    ) : (
                        <button className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
                            <span className="material-symbols-outlined text-[20px]">person</span>
                        </button>
                    )}
                </div>
            </header>

            <main className="flex-1 px-5 pt-6 space-y-6">
                {/* Expense Card */}
                <section>
                    <div className="relative rounded-2xl bg-card-dark border border-white/10 overflow-hidden shadow-xl">
                        <div className="absolute top-0 right-0 p-4 z-20">
                            <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full border border-white/10">
                                <span className="material-symbols-outlined text-primary text-[14px]">sync_alt</span>
                                <span className="text-[10px] font-bold text-white uppercase tracking-wider">USD/TWD</span>
                            </div>
                        </div>
                        <div className="relative w-full h-32 bg-center bg-cover" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBbIfNtpxEJBkZ8nYoWabGRJZepciIRWK4jMVZPfjItvYa9li7pRYX8TrXIArgl87Yh5Djf_pEfmr2eoPqW639TGnFeWm1r_ysOIOaQQqGTVrJJjwadrfrB5b95zhiANEEoHRW2FyWshCDf1NoPpUapy6OL41TA8a18js9_Fr-xuM8NOXE1PF8U-6O7Jmwvl0b8Qnj9tgGZxzjVmHu1Bc4Iu4KbnV02UfiX1yKMc3IxFtk8NDEOTFYIUZ86hblVP0Twpk_vhw7yA00")' }}>
                            <div className="absolute inset-0 bg-gradient-to-t from-card-dark via-card-dark/40 to-transparent"></div>
                        </div>
                        <div className="px-5 pb-5 -mt-6 relative z-10 flex flex-col">
                            <span className="text-primary text-[10px] font-bold tracking-[0.15em] uppercase mb-1">我的總花費</span>
                            <div className="flex flex-col gap-1">
                                <div className="flex items-baseline gap-2">
                                    <p className="text-white text-3xl font-bold tracking-tight">${totalExpense.toFixed(2)}</p>
                                    <span className="text-gray-500 text-sm font-medium">USD</span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 opacity-80">
                                    <span className="material-symbols-outlined text-[14px] text-gray-400">trending_up</span>
                                    <p className="text-gray-400 text-lg font-semibold leading-none">≈ NT$ {(totalExpense * 32).toLocaleString()}</p>
                                    <span className="text-gray-600 text-[10px] font-medium uppercase tracking-tighter">TWD</span>
                                </div>
                            </div>
                            <button onClick={() => navigate('/add-expense')} className="mt-4 w-full bg-primary text-background-dark py-3 rounded-xl font-bold text-xs uppercase tracking-widest active:scale-[0.98] transition-transform">
                                查看明細
                            </button>
                        </div>
                    </div>
                </section>

                {/* Weather Status */}
                <section className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between bg-gradient-to-br from-blue-600/20 to-primary/5 p-4 rounded-2xl border border-white/5 ios-blur">
                        <div className="flex items-center gap-4">
                            <div className="size-12 bg-white/10 rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-3xl fill-icon">partly_cloudy_day</span>
                            </div>
                            <div>
                                <p className="text-white text-lg font-bold">24°C <span className="text-gray-400 font-normal">晴朗</span></p>
                                <p className="text-gray-500 text-[11px] font-medium flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px]">location_on</span> 洛杉磯, CA
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-primary text-[10px] font-bold uppercase tracking-wider mb-1">日落</p>
                            <p className="text-white/80 text-xs font-semibold">17:45</p>
                        </div>
                    </div>
                </section>

                {/* Itinerary List */}
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h2 className="text-white text-xl font-bold tracking-tight">8 天行程</h2>
                    <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md">
                        <span className="material-symbols-outlined text-[14px] text-primary">calendar_month</span>
                        <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">2/18 - 2/25</span>
                    </div>
                </div>
                <section className="space-y-3 pb-8">
                    {itineraryData.map((day) => (
                        <div
                            key={day.id}
                            onClick={() => navigate(`/day/${day.id}`)}
                            className={`flex items-center gap-4 border border-white/5 p-4 rounded-2xl active:bg-white/5 transition-colors cursor-pointer ${day.id === 1 ? 'bg-primary/10 border-primary/20' : 'bg-card-dark'}`}
                        >
                            <div className={`flex flex-col items-center justify-center size-14 rounded-xl ${day.id === 1 ? 'bg-primary text-background-dark' : 'bg-white/5 text-gray-400'}`}>
                                <span className="text-[10px] font-black uppercase leading-none mb-0.5">2月</span>
                                <span className="text-xl font-bold leading-none">{parseInt(day.date.split('-')[2])}</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className={`${day.id === 1 ? 'text-primary' : 'text-gray-500'} text-[10px] font-black uppercase tracking-widest`}>第 0{day.id} 天</span>
                                    {day.id === 1 && <span className="size-1 bg-primary rounded-full"></span>}
                                    <span className={`${day.id === 1 ? 'text-primary' : 'text-gray-500'} text-[10px] font-medium uppercase`}>{day.location}</span>
                                </div>
                                <p className="text-white text-base font-bold leading-snug">{day.title}</p>
                            </div>
                            <span className={`material-symbols-outlined ${day.id === 1 ? 'text-primary' : 'text-gray-700'}`}>arrow_forward_ios</span>
                        </div>
                    ))}
                </section>
            </main>

            <Navbar />
        </div>
    );
}
