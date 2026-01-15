import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function ExpenseDetails() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [currency, setCurrency] = useState("USD");
    const [expenses, setExpenses] = useState([]);
    const [users, setUsers] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                // 1. Fetch Users
                const usersSnapshot = await getDocs(collection(db, "users"));
                const usersMap = {};
                usersSnapshot.forEach((doc) => {
                    usersMap[doc.id] = doc.data();
                });
                setUsers(usersMap);

                // 2. Fetch Expenses
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
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateGroup = (timestamp) => {
        if (!timestamp) return "Unknown Date";
        const date = timestamp.toDate();
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return "Today";
        if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Group expenses by date
    const groupedExpenses = expenses.reduce((groups, expense) => {
        const dateLabel = formatDateGroup(expense.createdAt);
        if (!groups[dateLabel]) {
            groups[dateLabel] = [];
        }
        groups[dateLabel].push(expense);
        return groups;
    }, {});


    return (
        <div className="relative flex h-full min-h-screen w-full max-w-[430px] mx-auto flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display overflow-x-hidden shadow-2xl">
            {/* Header Section */}
            <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md pt-6 px-4">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => navigate('/overview')} className="text-lakers-gold cursor-pointer">
                        <span className="material-symbols-outlined text-3xl">arrow_back_ios</span>
                    </button>
                    <h1 className="text-xl font-extrabold tracking-tight uppercase italic dark:text-white">All Expense Details</h1>
                    <div className="text-lakers-gold">
                        <span className="material-symbols-outlined text-3xl">more_horiz</span>
                    </div>
                </div>
                {/* Currency Toggle */}
                <div className="flex bg-slate-200 dark:bg-[#362b40] p-1 rounded-xl mb-6 shadow-inner">
                    <label className={`flex cursor-pointer h-10 grow items-center justify-center overflow-hidden rounded-lg px-2 transition-all duration-200 ${currency === 'USD' ? 'bg-primary text-white' : 'text-slate-500 dark:text-[#ae9ebd]'}`}>
                        <span className="truncate">USD</span>
                        <input checked={currency === 'USD'} onChange={() => setCurrency('USD')} className="invisible w-0" name="currency" type="radio" value="USD" />
                    </label>
                    <label className={`flex cursor-pointer h-10 grow items-center justify-center overflow-hidden rounded-lg px-2 transition-all duration-200 ${currency === 'TWD' ? 'bg-primary text-white' : 'text-slate-500 dark:text-[#ae9ebd]'}`}>
                        <span className="truncate">TWD</span>
                        <input checked={currency === 'TWD'} onChange={() => setCurrency('TWD')} className="invisible w-0" name="currency" type="radio" value="TWD" />
                    </label>
                </div>
            </header>

            {/* Main Expense List */}
            <main className="flex-1 px-4 py-2 space-y-4 pb-32 overflow-y-auto custom-scrollbar">
                {Object.keys(groupedExpenses).map((dateLabel) => (
                    <div key={dateLabel}>
                        {/* Date Divider */}
                        <div className="flex items-center gap-3 py-2 pt-4">
                            <div className="h-[1px] flex-1 bg-primary/20"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 dark:text-primary">{dateLabel}</span>
                            <div className="h-[1px] flex-1 bg-primary/20"></div>
                        </div>

                        {groupedExpenses[dateLabel].map((expense) => {
                            // Try to find in fetched users, fallback to currentUser if ID matches, else unknown
                            let payer = users[expense.paidBy];
                            if (!payer && currentUser && currentUser.uid === expense.paidBy) {
                                payer = {
                                    displayName: currentUser.displayName,
                                    photoURL: currentUser.photoURL
                                };
                            }
                            if (!payer) payer = { displayName: 'Unknown' };

                            const payerInitial = payer.displayName ? payer.displayName[0] : '?';
                            const amountDisplay = getDisplayAmount(expense.amount, expense.currency);
                            const splitList = expense.splitWith || [];

                            return (
                                <div key={expense.id} className="bg-white dark:bg-card-dark rounded-xl overflow-hidden shadow-xl border-l-4 border-lakers-gold mb-4">
                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="max-w-[70%]">
                                                <h3 className="text-lg font-bold leading-tight dark:text-white">{expense.item}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="material-symbols-outlined text-sm text-primary">sell</span>
                                                    <span className="text-xs font-medium text-slate-400 uppercase tracking-tighter">General</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-black text-lakers-gold gold-glow">
                                                    {currency === 'USD' ? '$' : 'NT$'}
                                                    {amountDisplay.toFixed(2)}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total {currency}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-6">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className="size-10 rounded-full border-2 border-lakers-gold overflow-hidden bg-primary flex items-center justify-center">
                                                        {payer.photoURL ? (
                                                            <img src={payer.photoURL} alt={payer.displayName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-white font-bold text-xs">{payerInitial}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Paid by</p>
                                                    <p className="text-sm font-bold dark:text-white">{payer.displayName}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-2">Split with</p>
                                                <div className="flex -space-x-3">
                                                    {splitList.slice(0, 3).map((uid) => {
                                                        let user = users[uid];
                                                        if (!user && currentUser && currentUser.uid === uid) {
                                                            user = {
                                                                displayName: currentUser.displayName,
                                                                photoURL: currentUser.photoURL
                                                            };
                                                        }

                                                        return (
                                                            <div key={uid} className="size-8 rounded-full ring-2 ring-white dark:ring-card-dark bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white shadow-md overflow-hidden">
                                                                {user?.photoURL ? (
                                                                    <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span>{user?.displayName ? user.displayName[0] : '?'}</span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                    {splitList.length > 3 && (
                                                        <div className="size-8 rounded-full ring-2 ring-white dark:ring-card-dark bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                                                            +{splitList.length - 3}
                                                        </div>
                                                    )}
                                                    {splitList.length === 0 && <span className="text-xs text-slate-500 font-bold">None</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-5 py-3 bg-slate-50 dark:bg-black/20 flex justify-between items-center border-t border-slate-100 dark:border-white/5">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg text-slate-400">schedule</span>
                                            <span className="text-xs font-medium text-slate-400">{formatTime(expense.createdAt)}</span>
                                        </div>
                                        {/* Future: Details Page */}
                                        {/* <button className="text-xs font-bold uppercase tracking-widest text-primary dark:text-lakers-gold flex items-center gap-1">
                                            Details <span className="material-symbols-outlined text-base">chevron_right</span>
                                        </button> */}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}

                {expenses.length === 0 && !loading && (
                    <div className="text-center py-10 text-slate-500">No expenses found.</div>
                )}
            </main>

            {/* Floating Action Button */}
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 flex items-center justify-center z-40">
                <button onClick={() => navigate('/add-expense')} className="bg-primary text-lakers-gold w-16 h-16 rounded-full shadow-[0_8px_25px_rgba(89,46,127,0.5)] flex items-center justify-center active:scale-95 transition-transform border-4 border-background-dark">
                    <span className="material-symbols-outlined text-3xl font-black">add</span>
                </button>
            </div>

            {/* Navigation Bar (iOS Style) - Placeholder, effectively same as Dashboard's but simplified for this view if needed, or we can reuse a component */}
            <nav className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto h-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-xl border-t border-primary/20 flex justify-around items-center px-6 pb-4 z-50">
                <button onClick={() => navigate('/itinerary')} className="flex flex-col items-center gap-1 text-slate-400">
                    <span className="material-symbols-outlined">explore</span>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Trip</span>
                </button>
                <button onClick={() => navigate('/expenses')} className="flex flex-col items-center gap-1 text-primary dark:text-lakers-gold">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Expenses</span>
                </button>
                {/* Placeholders for now */}
                <div className="flex flex-col items-center gap-1 text-slate-400">
                    <span className="material-symbols-outlined">group</span>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Squad</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-slate-400">
                    <span className="material-symbols-outlined">settings</span>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Menu</span>
                </div>
            </nav>
        </div>
    );
}
