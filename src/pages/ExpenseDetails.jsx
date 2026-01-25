import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import BottomNav from "../components/BottomNav";

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
        // Mimicking "Today, 7:30 PM" format if needed, but for now just time
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
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
        <div className="min-h-screen bg-[#121212] text-white pb-24 font-sans max-w-[430px] mx-auto">
            {/* Header */}
            <header className="p-6 flex justify-between items-center">
                <button onClick={() => navigate(-1)}>
                    <span className="material-symbols-outlined rotate-180 text-[#FDB927]">chevron_right</span>
                </button>
                <h1 className="text-xl font-black italic tracking-tighter uppercase">Expenses</h1>
                <div className="flex gap-1">
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                </div>
            </header>

            {/* View Summary Banner */}
            <div className="px-4 mb-6">
                <button
                    onClick={() => navigate('/expense-summary')}
                    className="w-full bg-[#FDB927] p-5 rounded-3xl flex items-center justify-between shadow-lg active:scale-[0.98] transition-transform"
                >
                    <div className="flex items-center gap-4 text-[#552583]">
                        <div className="bg-[#552583]/10 p-2 rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined font-black">attach_money</span>
                        </div>
                        <div className="text-left">
                            <p className="font-black text-sm uppercase tracking-tighter">View My Summary</p>
                            <p className="text-[10px] font-bold opacity-60">SETTLEMENT</p>
                        </div>
                    </div>
                    <span className="material-symbols-outlined text-[#552583]">chevron_right</span>
                </button>
            </div>

            {/* Currency & Search */}
            <div className="px-4 space-y-4">
                <div className="flex bg-white/5 p-1 rounded-2xl">
                    <button onClick={() => setCurrency('USD')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${currency === 'USD' ? 'bg-[#552583] text-white' : 'text-white/40'}`}>USD</button>
                    <button onClick={() => setCurrency('TWD')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${currency === 'TWD' ? 'bg-[#552583] text-white' : 'text-white/40'}`}>TWD</button>
                </div>

                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-white/30 text-lg">search</span>
                        <input
                            type="text"
                            placeholder="Search (e.g. Dinner, Tickets)"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-[#FDB927] placeholder:text-white/20"
                        />
                    </div>
                    <button className="bg-[#552583] p-3 rounded-2xl text-[#FDB927] flex items-center justify-center">
                        <span className="material-symbols-outlined">filter_list</span>
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="mt-8 px-4 space-y-6">
                {Object.keys(groupedExpenses).map((dateLabel) => (
                    <div key={dateLabel}>
                        <div className="flex items-center gap-4 mb-4 mt-6 first:mt-0">
                            <div className="h-px flex-1 bg-white/10"></div>
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">{dateLabel}</span>
                            <div className="h-px flex-1 bg-white/10"></div>
                        </div>

                        <div className="space-y-4">
                            {groupedExpenses[dateLabel].map((expense) => {
                                // User Resolution Logic
                                let payer = users[expense.paidBy];
                                if (!payer && currentUser && currentUser.uid === expense.paidBy) {
                                    payer = { displayName: currentUser.displayName, photoURL: currentUser.photoURL };
                                }
                                if (!payer) payer = { displayName: 'Unknown' };

                                const payerInitial = payer.displayName ? payer.displayName[0] : '?';
                                const payerColor = "bg-purple-700";

                                const amountDisplay = getDisplayAmount(expense.amount, expense.currency);

                                // splitWith might include payer now, filter if desired or show all. 
                                // Let's filter out the payer from the "Split With" list to avoid redundancy with "Paid By"
                                const rawSplitList = expense.splitWith || [];
                                const splitList = rawSplitList.filter(uid => uid !== expense.paidBy);

                                return (
                                    <div key={expense.id} className="bg-white/5 border border-white/10 rounded-[32px] p-6 relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-[#FDB927]"></div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-xl font-black leading-tight max-w-[200px]">{expense.item}</h3>
                                                <p className="text-[10px] font-bold text-white/40 mt-1 uppercase tracking-wider italic flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[10px]">sell</span> {expense.category || 'General'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-black text-[#FDB927] leading-none">
                                                    {currency === 'USD' ? '$' : 'NT$'}{amountDisplay.toFixed(2)}
                                                </p>
                                                <p className="text-[8px] font-black text-white/30 uppercase mt-1">Total {currency}</p>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-end pt-4 border-t border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full ${payerColor} flex items-center justify-center text-[10px] font-black border-2 border-[#121212] overflow-hidden`}>
                                                    {payer.photoURL ? (
                                                        <img src={payer.photoURL} alt={payer.displayName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        payerInitial
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-bold text-white/30 uppercase">Paid By</p>
                                                    <p className="text-xs font-black">{payer.displayName}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[8px] font-bold text-white/30 uppercase mb-1">Split With</p>
                                                <div className="flex -space-x-2 justify-end">
                                                    {splitList.slice(0, 3).map((uid, i) => {
                                                        let sUser = users[uid];
                                                        if (!sUser && currentUser && currentUser.uid === uid) sUser = currentUser;

                                                        return (
                                                            <div key={i} className="w-6 h-6 rounded-full bg-white/10 border border-[#121212] flex items-center justify-center text-[8px] font-black overflow-hidden">
                                                                {sUser?.photoURL ? <img src={sUser.photoURL} className="w-full h-full object-cover" /> : (sUser?.displayName?.[0] || '?')}
                                                            </div>
                                                        )
                                                    })}
                                                    {splitList.length > 3 && (
                                                        <div className="w-6 h-6 rounded-full bg-white/10 border border-[#121212] flex items-center justify-center text-[8px] font-black">
                                                            +{splitList.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center mt-6">
                                            <div className="flex items-center gap-2 text-white/30 text-[10px] font-bold">
                                                <span className="material-symbols-outlined text-[12px]">schedule</span> {formatTime(expense.createdAt)}
                                            </div>
                                            <button
                                                onClick={() => navigate(`/expense/${expense.id}`)}
                                                className="text-[#FDB927] text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
                                            >
                                                Details <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 flex items-center justify-center z-40">
                <button onClick={() => navigate('/add-expense')} className="bg-[#552583] text-[#FDB927] w-16 h-16 rounded-full shadow-[0_8px_25px_rgba(89,46,127,0.5)] flex items-center justify-center active:scale-95 transition-transform border-4 border-[#121212]">
                    <span className="material-symbols-outlined text-3xl font-black">add</span>
                </button>
            </div>

            <BottomNav active="expenses" />
        </div>
    );
}
