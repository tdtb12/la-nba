import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useUsers } from "../context/UsersContext";
import BottomNav from "../components/BottomNav";
import { BarChart, ChevronRight } from "lucide-react";

export default function ExpensesList() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { users } = useUsers(); // Use global users map
    const [currency, setCurrency] = useState("USD");
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch Expenses Only (Users handled by context)
                const q = query(collection(db, "expenses"), orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);
                const expensesList = [];
                querySnapshot.forEach((doc) => {
                    expensesList.push({ id: doc.id, ...doc.data() });
                });
                setExpenses(expensesList);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const getDisplayAmount = (amount, itemCurrency) => {
        const val = parseFloat(amount);
        if (currency === "USD") {
            return itemCurrency === "TWD" ? val / 32 : val;
        } else {
            return itemCurrency === "USD" ? val * 32 : val;
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return "";
        const date = timestamp.toDate();
        // Return full date/time string for "Today, 7:30 PM" if logic implemented, otherwise simple logic
        const now = new Date();
        const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        const prefix = isToday ? "Today, " : date.toLocaleDateString() + ", ";
        return prefix + date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    const formatDateGroup = (timestamp) => {
        if (!timestamp) return "Unknown Date";
        const date = timestamp.toDate();
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const groupedExpenses = expenses.reduce((groups, expense) => {
        const dateLabel = formatDateGroup(expense.createdAt);
        if (!groups[dateLabel]) {
            groups[dateLabel] = [];
        }
        groups[dateLabel].push(expense);
        return groups;
    }, {});

    return (
        <div className="min-h-screen bg-[#19141e] text-white font-sans max-w-[430px] mx-auto flex flex-col relative shadow-2xl border-x border-[#592e7f]/10">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#19141e]/80 backdrop-blur-md pt-6 px-4">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => navigate(-1)} className="text-[#FDB927]">
                        <span className="material-symbols-outlined text-3xl">arrow_back_ios</span>
                    </button>
                    <h1 className="text-xl font-extrabold tracking-tight uppercase italic text-white">Expenses</h1>
                    <div className="text-[#FDB927]">
                        <span className="material-symbols-outlined text-3xl">more_horiz</span>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/expense-summary')}
                    className="w-full mb-6 bg-lakers-gold p-5 rounded-3xl flex items-center justify-between shadow-[0_10px_20px_rgba(253,185,39,0.3)] active:scale-[0.98] transition-transform"
                >
                    <div className="flex items-center gap-4 text-lakers-purple">
                        {/* Icon Container */}
                        <div className="bg-lakers-purple/10 p-2 rounded-xl">
                            <BarChart size={20} className="stroke-[3px]" />
                        </div>

                        <div className="text-left">
                            <p className="font-black text-sm uppercase tracking-[-0.02em] italic">View My Summary</p>
                            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Settlement</p>
                        </div>
                    </div>

                    <ChevronRight size={20} className="text-lakers-purple" />
                </button>

                <div className="flex bg-[#362b40] p-1 rounded-xl mb-6 shadow-inner">
                    <label className={`flex cursor-pointer h-10 grow items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-bold transition-all duration-200 ${currency === 'USD' ? 'bg-[#592e7f] text-white' : 'text-[#ae9ebd]'}`}>
                        <span className="truncate">USD</span>
                        <input
                            className="hidden"
                            type="radio"
                            name="currency"
                            value="USD"
                            checked={currency === 'USD'}
                            onChange={() => setCurrency('USD')}
                        />
                    </label>
                    <label className={`flex cursor-pointer h-10 grow items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-bold transition-all duration-200 ${currency === 'TWD' ? 'bg-[#592e7f] text-white' : 'text-[#ae9ebd]'}`}>
                        <span className="truncate">TWD</span>
                        <input
                            className="hidden"
                            type="radio"
                            name="currency"
                            value="TWD"
                            checked={currency === 'TWD'}
                            onChange={() => setCurrency('TWD')}
                        />
                    </label>
                </div>

                <div className="flex flex-col gap-3 pb-4">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#ae9ebd]">search</span>
                            <input
                                type="text"
                                placeholder="Search (e.g. Dinner, Tickets)"
                                className="w-full h-12 pl-10 pr-4 bg-[#362b40] border-none rounded-xl focus:ring-2 focus:ring-[#592e7f] text-sm placeholder:text-[#ae9ebd] text-white outline-none"
                            />
                        </div>
                        <button className="w-12 h-12 flex items-center justify-center bg-[#592e7f] rounded-xl text-[#FDB927] shadow-lg">
                            <span className="material-symbols-outlined">tune</span>
                        </button>
                    </div>

                    {/* Filters (Static for now as per UI) */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-[#592e7f] px-5 text-white shadow-md">
                            <span className="text-xs font-bold uppercase tracking-widest">All</span>
                        </button>
                        <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-[#362b40] px-5 text-[#ae9ebd]">
                            <span className="material-symbols-outlined text-lg">restaurant</span>
                            <span className="text-xs font-bold uppercase tracking-widest">Food</span>
                        </button>
                        <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-[#362b40] px-5 text-[#ae9ebd]">
                            <span className="material-symbols-outlined text-lg">local_taxi</span>
                            <span className="text-xs font-bold uppercase tracking-widest">Transit</span>
                        </button>
                        <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-[#362b40] px-5 text-[#ae9ebd]">
                            <span className="material-symbols-outlined text-lg">confirmation_number</span>
                            <span className="text-xs font-bold uppercase tracking-widest">Tickets</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 px-4 py-2 space-y-4 pb-32 overflow-y-auto">
                {Object.keys(groupedExpenses).map((dateLabel) => (
                    <div key={dateLabel}>
                        <div className="flex items-center gap-3 py-2">
                            <div className="h-[1px] flex-1 bg-[#592e7f]/20"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#592e7f]">{dateLabel}</span>
                            <div className="h-[1px] flex-1 bg-[#592e7f]/20"></div>
                        </div>

                        <div className="space-y-4">
                            {groupedExpenses[dateLabel].map((expense) => {
                                let payer = users[expense.paidBy];
                                if (!payer && currentUser && currentUser.uid === expense.paidBy) {
                                    payer = { displayName: currentUser.displayName, photoURL: currentUser.photoURL };
                                }
                                if (!payer) payer = { displayName: 'Unknown' };

                                const payerInitial = payer.displayName ? payer.displayName[0].toUpperCase() : '?';

                                const amountDisplay = getDisplayAmount(expense.amount, expense.currency);

                                const rawSplitList = expense.splitWith || [];
                                const splitList = rawSplitList.filter(uid => uid !== expense.paidBy);

                                return (
                                    <div key={expense.id} className="bg-[#2D2935] rounded-xl overflow-hidden shadow-xl border-l-4 border-[#FDB927]">
                                        <div className="p-5">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="max-w-[70%]">
                                                    <h3 className="text-lg font-bold leading-tight text-white">{expense.item}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="material-symbols-outlined text-sm text-[#592e7f]">sell</span>
                                                        <span className="text-xs font-medium text-slate-400 uppercase tracking-tighter">{expense.category || 'General'}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-black text-[#FDB927] drop-shadow-[0_0_12px_rgba(253,185,39,0.3)]">
                                                        {currency === 'USD' ? '$' : 'NT$'}{amountDisplay.toFixed(2)}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total {currency}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mt-6">
                                                {/* Paid By */}
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        {payer.photoURL ? (
                                                            <div className="size-10 rounded-full border-2 border-[#FDB927] overflow-hidden">
                                                                <img src={payer.photoURL} alt={payer.displayName} className="w-full h-full object-cover" />
                                                            </div>
                                                        ) : (
                                                            <div className="size-10 rounded-full border-2 border-[#FDB927] overflow-hidden bg-[#592e7f] flex items-center justify-center text-white font-bold text-xs">
                                                                {payerInitial}
                                                            </div>
                                                        )}
                                                        <div className="absolute -bottom-1 -right-1 size-5 bg-[#FDB927] rounded-full flex items-center justify-center text-[10px] border-2 border-[#2D2935] font-bold text-[#592e7f]">👑</div>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Paid by</p>
                                                        <p className="text-sm font-bold text-white">{payer.displayName}</p>
                                                    </div>
                                                </div>

                                                {/* Split With */}
                                                <div className="flex flex-col items-end">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-2">Split with</p>
                                                    <div className="flex -space-x-3">
                                                        {splitList.slice(0, 3).map((uid, idx) => {
                                                            let sUser = users[uid];
                                                            if (!sUser && currentUser && currentUser.uid === uid) sUser = currentUser;
                                                            return (
                                                                <div key={idx} className="size-8 rounded-full ring-2 ring-[#2D2935] bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white shadow-md overflow-hidden">
                                                                    {sUser?.photoURL ? <img src={sUser.photoURL} className="w-full h-full object-cover" /> : (sUser?.displayName?.[0] || '?')}
                                                                </div>
                                                            )
                                                        })}
                                                        {splitList.length > 3 && (
                                                            <div className="size-8 rounded-full ring-2 ring-[#2D2935] bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                                                                +{splitList.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="px-5 py-3 bg-black/20 flex justify-between items-center border-t border-white/5">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-lg text-slate-400">schedule</span>
                                                <span className="text-xs font-medium text-slate-400">{formatTime(expense.createdAt)}</span>
                                            </div>
                                            <button
                                                onClick={() => navigate(`/expense/${expense.id}`)}
                                                className="text-xs font-bold uppercase tracking-widest text-[#FDB927] flex items-center gap-1"
                                            >
                                                Details <span className="material-symbols-outlined text-base">chevron_right</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </main>

            {/* Floating Add Button */}
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
                <button
                    onClick={() => navigate('/add-expense')}
                    className="bg-[#592e7f] text-[#FDB927] w-16 h-16 rounded-full shadow-[0_8px_30px_rgba(89,46,127,0.4)] flex items-center justify-center active:scale-90 transition-all border-4 border-[#19141e]"
                >
                    <span className="material-symbols-outlined text-3xl font-black">add</span>
                </button>
            </div>

            <BottomNav />
        </div>
    );
}
