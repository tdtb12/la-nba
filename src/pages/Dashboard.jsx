import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { useAuth } from "../context/AuthContext";
import { useSchedule } from "../context/ScheduleContext";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore"; // Import needed functions
import { db } from "../firebase"; // Import db
import { toCelsius } from "../utils/weather";

export default function Dashboard() {
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth(); // Get logout function
    const { schedule } = useSchedule();
    const [totalExpense, setTotalExpense] = useState(0);
    const [weather, setWeather] = useState(null);
    const [goldenHour, setGoldenHour] = useState("Loading...");

    const handleLogout = async () => {
        if (window.confirm("Are you sure you want to log out?")) {
            try {
                await logout();
                navigate("/");
            } catch (error) {
                console.error("Failed to log out", error);
            }
        }
    };

    // Calculate total expense for current user
    useEffect(() => {
        async function fetchExpenses() {
            if (!currentUser) return;

            try {
                // 1. Expenses paid by current user
                const paidByQuery = query(collection(db, "expenses"), where("paidBy", "==", currentUser.uid));
                const paidBySnapshot = await getDocs(paidByQuery);

                // 2. Expenses split with current user
                const splitWithQuery = query(collection(db, "expenses"), where("splitWith", "array-contains", currentUser.uid));
                const splitWithSnapshot = await getDocs(splitWithQuery);

                let totalUSD = 0;

                // Helper to process doc
                const processExpense = (doc) => {
                    const data = doc.data();
                    const amount = parseFloat(data.amount) || 0;
                    const currency = data.currency || "USD";
                    const splitWith = data.splitWith || [];
                    // Total people = Payer + Splitters (assuming payer is always included in the split group count based on AddExpense logic)
                    const totalPeople = splitWith.length + 1;

                    const myShare = amount / totalPeople;

                    if (currency === "TWD") {
                        totalUSD += myShare / 32; // Fixed rate for now
                    } else {
                        totalUSD += myShare;
                    }
                };

                // Use a Set to avoid duplicates if any (though logic suggests they shouldn't overlap usually, 
                // unless I can split with myself which AddExpense prevents)
                const processedIds = new Set();

                paidBySnapshot.forEach((doc) => {
                    if (!processedIds.has(doc.id)) {
                        processExpense(doc);
                        processedIds.add(doc.id);
                    }
                });

                splitWithSnapshot.forEach((doc) => {
                    if (!processedIds.has(doc.id)) {
                        processExpense(doc);
                        processedIds.add(doc.id);
                    }
                });

                setTotalExpense(totalUSD);
            } catch (error) {
                console.error("Error fetching expenses:", error);
            }
        }

        fetchExpenses();
        fetchExpenses();
    }, [currentUser]);

    // Fetch Weather for LA
    useEffect(() => {
        async function fetchWeather() {
            try {
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=34.0522&longitude=-118.2437&current_weather=true&temperature_unit=fahrenheit&daily=sunset&timezone=America%2FLos_Angeles`);
                const data = await res.json();
                setWeather(data.current_weather);

                // Calculate Golden Hour (approx 1 hour before sunset)
                if (data.daily && data.daily.sunset && data.daily.sunset.length > 0) {
                    const sunsetTime = new Date(data.daily.sunset[0]);
                    const goldenHourStart = new Date(sunsetTime.getTime() - 60 * 60 * 1000); // 1 hour before sunset
                    const now = new Date();

                    const diffMs = goldenHourStart - now;
                    const diffMins = Math.floor(diffMs / 60000);

                    if (diffMins > 0) {
                        const hours = Math.floor(diffMins / 60);
                        const mins = diffMins % 60;
                        setGoldenHour(`Starts in ${hours}h ${mins}m`);
                    } else if (diffMins > -60) {
                        setGoldenHour("Happening Now!");
                    } else {
                        setGoldenHour("Ended for today");
                    }
                }
            } catch (error) {
                console.error("Failed to fetch weather", error);
                setGoldenHour("Unavailable");
            }
        }
        fetchWeather();
    }, []);

    return (
        <div className="relative w-full max-w-[430px] mx-auto flex flex-col bg-background-dark min-h-screen pb-28 font-display shadow-2xl">
            {/* Header */}
            <header className="sticky top-0 z-50 flex items-center bg-lakers-purple ios-blur p-4 border-b border-primary/20">
                <div className="flex size-10 items-center justify-center cursor-pointer active:opacity-50 transition-opacity">
                    <span className="material-symbols-outlined text-primary">chevron_left</span>
                </div>
                <h1 className="text-primary text-base font-extrabold flex-1 text-center tracking-tight uppercase">LA Trip Overview</h1>
                <div onClick={handleLogout} className="flex size-10 items-center justify-center cursor-pointer hover:opacity-80 transition-opacity" title="Click to Logout">
                    {currentUser?.photoURL ? (
                        <img src={currentUser.photoURL} alt="User" className="size-8 rounded-full border-2 border-primary shadow-lg" />
                    ) : (
                        <button className="size-8 rounded-full bg-primary text-lakers-purple flex items-center justify-center border-2 border-primary shadow-lg">
                            <span className="material-symbols-outlined text-[20px] fill-icon">person</span>
                        </button>
                    )}
                </div>
            </header>

            <main className="flex-1 px-5 pt-6 space-y-6">
                {/* Expense Card */}
                <section>
                    <div className="relative rounded-2xl bg-card-dark border-4 border-primary overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-4 z-20">
                            <div className="flex items-center gap-1 bg-lakers-purple/90 px-2 py-1 rounded-full border border-primary/30">
                                <span className="material-symbols-outlined text-primary text-[14px]">sync_alt</span>
                                <span className="text-[10px] font-bold text-white uppercase tracking-wider">USD / TWD</span>
                            </div>
                        </div>
                        <div className="relative w-full h-32 bg-center bg-cover" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBbIfNtpxEJBkZ8nYoWabGRJZepciIRWK4jMVZPfjItvYa9li7pRYX8TrXIArgl87Yh5Djf_pEfmr2eoPqW639TGnFeWm1r_ysOIOaQQqGTVrJJjwadrfrB5b95zhiANEEoHRW2FyWshCDf1NoPpUapy6OL41TA8a18js9_Fr-xuM8NOXE1PF8U-6O7Jmwvl0b8Qnj9tgGZxzjVmHu1Bc4Iu4KbnV02UfiX1yKMc3IxFtk8NDEOTFYIUZ86hblVP0Twpk_vhw7yA00")' }}>
                            <div className="absolute inset-0 bg-gradient-to-t from-card-dark via-card-dark/20 to-transparent"></div>
                        </div>
                        <div className="px-5 pb-5 -mt-6 relative z-10 flex flex-col">
                            <span className="text-lakers-purple text-[11px] font-black tracking-[0.15em] uppercase mb-1 bg-primary/90 self-start px-2 py-0.5 rounded">Total My Expenses</span>
                            <div className="flex flex-col gap-1 mt-2">
                                <div className="flex items-baseline gap-2">
                                    <p className="text-lakers-purple text-4xl font-black tracking-tighter">${totalExpense.toFixed(2)}</p>
                                    <span className="text-lakers-purple/60 text-sm font-bold">USD</span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="material-symbols-outlined text-[16px] text-lakers-purple/50">payments</span>
                                    <p className="text-lakers-purple/80 text-xl font-bold leading-none">≈ NT$ {(totalExpense * 32).toLocaleString()}</p>
                                    <span className="text-lakers-purple/40 text-[10px] font-bold uppercase tracking-tighter">TWD</span>
                                </div>
                            </div>
                            <button onClick={() => navigate('/expenses')} className="mt-5 w-full bg-primary text-lakers-purple py-4 rounded-xl font-black text-xs uppercase tracking-widest active:scale-[0.98] transition-transform shadow-lg border-b-4 border-yellow-600">
                                View Expense Details
                            </button>
                        </div>
                    </div>
                </section>

                {/* Weather Status */}
                <section className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between bg-gradient-to-br from-lakers-purple to-[#3b1a5a] p-5 rounded-2xl border border-primary/20 shadow-xl">
                        <div className="flex items-center gap-4">
                            <div className="size-14 bg-primary rounded-2xl flex items-center justify-center shadow-inner">
                                <span className="material-symbols-outlined text-lakers-purple text-4xl fill-icon">partly_cloudy_day</span>
                            </div>
                            <div>
                                <p className="text-white text-xl font-black">
                                    {weather ? (
                                        <>
                                            {Math.round(weather.temperature)}°F <span className="text-base font-normal opacity-60">/ {toCelsius(weather.temperature)}°C</span>
                                        </>
                                    ) : '--'}
                                    <span className="text-primary font-medium ml-1">
                                        {weather ? 'Current' : 'Loading...'}
                                    </span>
                                </p>
                                <p className="text-primary/70 text-[11px] font-bold flex items-center gap-1 uppercase tracking-wider">
                                    <span className="material-symbols-outlined text-[12px]">location_on</span> Los Angeles, CA
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-primary text-[10px] font-black uppercase tracking-wider mb-1">Golden Hour</p>
                            <p className="text-white/90 text-xs font-bold">{goldenHour}</p>
                        </div>
                    </div>
                </section>

                {/* Itinerary List */}
                <div className="flex items-center justify-between border-b-2 border-lakers-purple/30 pb-3">
                    <h2 className="text-white text-xl font-black tracking-tight uppercase">8-Day Itinerary</h2>
                    <div className="flex items-center gap-1 bg-lakers-purple px-3 py-1.5 rounded-full border border-primary/30">
                        <span className="material-symbols-outlined text-[16px] text-primary fill-icon">calendar_month</span>
                        <span className="text-primary text-[10px] font-black uppercase tracking-wider">2/18 - 2/25</span>
                    </div>
                </div>
                <section className="space-y-4 pb-8">
                    {schedule.map((day, index) => (
                        <div
                            key={day.id}
                            onClick={() => navigate(`/day/${day.id}`)}
                            className={`flex items-center gap-4 border p-4 rounded-2xl active:bg-white/5 transition-colors cursor-pointer shadow-md ${day.id === 1 ? 'bg-lakers-purple/10 border-l-4 border-primary' : 'bg-card-dark border-white/5'}`}
                        >
                            <div className={`flex flex-col items-center justify-center size-14 rounded-xl shadow-md ${day.id === 1 ? 'bg-primary text-lakers-purple' : 'bg-white/5 text-gray-400'}`}>
                                <span className="text-[10px] font-black uppercase leading-none mb-0.5">2月</span>
                                <span className={`font-black leading-none ${day.id === 1 ? 'text-2xl' : 'text-xl'}`}>{parseInt(day.date.split('-')[2])}</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className={`${day.id === 1 ? 'text-primary' : 'text-gray-500'} text-[10px] font-black uppercase tracking-widest`}>Day 0{day.id}</span>
                                    {day.id === 1 && <span className="size-1.5 bg-primary rounded-full"></span>}
                                    {day.id === 1 && <span className="text-primary text-[10px] font-bold uppercase">{day.location}</span>}
                                </div>
                                <p className="text-white text-base font-extrabold leading-snug">{day.title}</p>
                            </div>
                            <span className={`material-symbols-outlined ${day.id === 1 ? 'text-primary font-bold' : 'text-gray-700'}`}>arrow_forward_ios</span>
                        </div>
                    ))}
                    <button className="w-full py-6 text-primary text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 bg-lakers-purple/5 rounded-2xl border border-primary/10 mt-2">
                        Expand All 8 Days
                        <span className="material-symbols-outlined text-[18px]">keyboard_double_arrow_down</span>
                    </button>
                </section>
            </main>

            <BottomNav />
        </div>
    );
}
