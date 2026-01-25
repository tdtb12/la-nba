import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useUsers } from '../context/UsersContext';
import BottomNav from '../components/BottomNav';
import { ChevronLeft, Calendar as CalendarIcon, Clock, Check, AlertCircle, Wallet } from 'lucide-react';
import currency from 'currency.js';

export default function EditExpense() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const { usersList } = useUsers();

    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState(0);
    const [item, setItem] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [currencyType, setCurrencyType] = useState('USD');
    const [paidBy, setPaidBy] = useState('');

    // Friends/Users for split logic
    // Structure: { id, name, photoURL, selected, amount }
    const [friends, setFriends] = useState([]);

    const [originalData, setOriginalData] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                let data = null;

                // 1. Check if data passed via state (from ExpenseDetails)
                if (location.state?.expense) {
                    data = location.state.expense;
                    // Ensure dates are parsed if they were serialized (though router state usually preserves objects, Firestore timestamps might need conversion if serialized poorly, but here likely okay or need toDate)
                    // If passed from state which was set from Firestore data in ExpenseDetails, it has toDate().
                } else {
                    // 2. Fetch if not in state
                    const expenseRef = doc(db, 'expenses', id);
                    const expenseSnap = await getDoc(expenseRef);

                    if (!expenseSnap.exists()) {
                        console.error("Expense not found");
                        navigate('/expenses');
                        return;
                    }
                    data = expenseSnap.data();
                }

                setOriginalData(data);
                setAmount(data.amount);
                setItem(data.item);
                setCurrencyType(data.currency || 'USD');
                setPaidBy(data.paidBy);

                // Format Date/Time
                const dateObj = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(); // Handle both Timestamp and Date if passed differently
                const yyyy = dateObj.getFullYear();
                const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                const dd = String(dateObj.getDate()).padStart(2, '0');
                setDate(`${yyyy}-${mm}-${dd}`);

                const hh = String(dateObj.getHours()).padStart(2, '0');
                const min = String(dateObj.getMinutes()).padStart(2, '0');
                setTime(`${hh}:${min}`);

                // 3. Process Splits using GLOBAL usersList
                // Map usersList to friends structure
                const friendsList = usersList.map(u => ({
                    id: u.id,
                    name: u.displayName || 'Unknown',
                    photoURL: u.photoURL,
                    selected: false,
                    amount: 0
                }));

                const currentSplitsHelper = {};
                if (data.splits && Array.isArray(data.splits)) {
                    data.splits.forEach(s => {
                        currentSplitsHelper[s.userId] = s.amount;
                    });
                } else if (data.splitWith && Array.isArray(data.splitWith)) {
                    const splitCount = data.splitWith.length;
                    const equalAmt = currency(data.amount).divide(splitCount).value;
                    data.splitWith.forEach(uid => {
                        currentSplitsHelper[uid] = equalAmt;
                    });
                }

                const mappedFriends = friendsList.map(u => {
                    const isSelected = !!currentSplitsHelper[u.id];
                    return {
                        ...u,
                        selected: isSelected,
                        amount: isSelected ? currentSplitsHelper[u.id] : 0
                    };
                });

                setFriends(mappedFriends);

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        }

        if (id && usersList.length > 0) fetchData();
    }, [id, navigate, location.state, usersList]);

    // Split Logic Handlers
    const currentSum = friends.reduce((acc, curr) => acc + (curr.selected ? parseFloat(curr.amount) || 0 : 0), 0);
    // Using currency.js for float comparison safety or just simple small epsilon
    const isValid = Math.abs(currentSum - amount) < 0.05;

    const toggleFriend = (userId) => {
        setFriends(prev => {
            const nextFriends = prev.map(f => {
                if (f.id === userId) {
                    return { ...f, selected: !f.selected };
                }
                return f;
            });

            // Recalculate equal splits for strictly selected friends? 
            // The prompt says "default is split total amount equally, or manual edit".
            // So if I toggle, I should probably re-distribute equally immediately? 
            // Or just set the new one to 0 and let them manual?
            // "default is split total amount equally" -> implying auto-calc.
            // Let's implement auto-equal-split on toggle for simplicity and UX.

            const selectedCount = nextFriends.filter(f => f.selected).length;
            if (selectedCount > 0) {
                const equalAmt = currency(amount).divide(selectedCount).value;
                return nextFriends.map(f => ({
                    ...f,
                    amount: f.selected ? equalAmt : 0
                }));
            } else {
                return nextFriends.map(f => ({ ...f, amount: 0 }));
            }
        });
    };

    const updateMemberAmount = (userId, val) => {
        setFriends(prev => prev.map(f => f.id === userId ? { ...f, amount: val } : f));
    };

    const handleUpdate = async () => {
        if (!isValid) {
            alert("Total amount does not match split sum!");
            return;
        }
        if (!item || !amount || !paidBy) {
            alert("Please fill in all required fields.");
            return;
        }

        try {
            const expenseRef = doc(db, 'expenses', id);

            // Construct Date object
            const [year, month, day] = date.split('-').map(Number);
            const [hours, minutes] = time.split(':').map(Number);
            const newDate = new Date(year, month - 1, day, hours, minutes);

            // Construct splits array for Firestore
            const splitsData = friends
                .filter(f => f.selected)
                .map(f => ({
                    userId: f.id,
                    amount: parseFloat(f.amount)
                }));

            const splitWithData = splitsData.map(s => s.userId);

            // Import timestamp
            const { Timestamp } = await import("firebase/firestore");

            await updateDoc(expenseRef, {
                amount: parseFloat(amount),
                item: item,
                createdAt: Timestamp.fromDate(newDate),
                paidBy: paidBy,
                splits: splitsData,
                splitWith: splitWithData,
                // Ensure currency is preserved or updated if we allowed editing (we enabled display but maybe not edit in this UI yet, assume preserved if not in UI)
                // Actually the UI doesn't show currency picker in the snippet, so we keep original or state.
                currency: currencyType
            });

            navigate(-1); // Go back
        } catch (e) {
            console.error("Error updating expense:", e);
            alert("Failed to update expense");
        }
    };



    if (loading) return <div className="min-h-screen bg-[#0F0F0F] text-white flex items-center justify-center">Loading...</div>;

    const currencySymbol = currencyType === 'USD' ? '$' : 'NT$';

    return (
        <div className="min-h-screen bg-[#0F0F0F] text-white font-sans pb-32 max-w-[430px] mx-auto relative shadow-2xl border-x border-[#592e7f]/10">
            {/* Header */}
            <header className="p-4 flex items-center justify-between border-b border-white/5 sticky top-0 bg-[#0F0F0F]/90 backdrop-blur-md z-40">
                <button onClick={() => navigate(-1)} className="bg-white/5 p-2 rounded-full text-[#FDB927]">
                    <ChevronLeft size={20} />
                </button>
                <h1 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Edit Expense</h1>
                <div className="w-10"></div>
            </header>

            <main className="p-4 space-y-6">
                {/* Hero Card */}
                <section className="bg-gradient-to-br from-[#552583] to-[#2D1345] p-8 rounded-[40px] shadow-2xl relative overflow-hidden border-b-4 border-[#FDB927]">
                    <div className="relative z-10">
                        <p className="text-[#FDB927] text-[10px] font-black uppercase tracking-widest text-center mb-1">Total Amount</p>
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-[#FDB927] text-3xl font-black italic">{currencySymbol}</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                                className="bg-transparent text-6xl font-black italic tracking-tighter w-48 text-center outline-none"
                            />
                        </div>
                    </div>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10">
                        <Wallet size={100} className="text-white" strokeWidth={1} />
                    </div>
                </section>

                {/* Form Fields */}
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2 mb-2 block">Item Title</label>
                        <input
                            value={item}
                            onChange={(e) => setItem(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-3xl p-4 font-bold outline-none focus:border-[#FDB927]/50"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2 mb-2 block">Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-3xl p-4 font-bold outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden"
                                />
                                <CalendarIcon className="absolute right-4 top-4 text-white/20 pointer-events-none" size={18} />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2 mb-2 block">Time</label>
                            <div className="relative">
                                <input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-3xl p-4 font-bold outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden"
                                />
                                <Clock className="absolute right-4 top-4 text-white/20 pointer-events-none" size={18} />
                            </div>
                        </div>
                    </div>

                    {/* Paid By Selection */}
                    <div>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2 mb-2 block">Paid By</label>
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {friends.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => setPaidBy(user.id)}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-2xl whitespace-nowrap transition-all border ${paidBy === user.id
                                        ? 'bg-[#552583] border-[#FDB927] shadow-lg'
                                        : 'bg-white/5 border-transparent opacity-60'
                                        }`}
                                >
                                    <div className="w-6 h-6 rounded-full overflow-hidden bg-white/10">
                                        {user.photoURL ? (
                                            <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-bold text-[10px]">{user.name[0]}</div>
                                        )}
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-wide">{user.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Manual Split Section */}
                <section className="space-y-4">
                    <div className="flex justify-between items-end px-2">
                        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Split Details</h4>
                        <p className="text-[10px] font-black uppercase">Current Total: <span className={isValid ? "text-[#FDB927]" : "text-red-500"}>{currencySymbol}{currentSum.toFixed(2)}</span></p>
                    </div>

                    <div className="space-y-3">
                        {friends.map(friend => (
                            <div
                                key={friend.id}
                                className={`flex items-center justify-between p-4 rounded-3xl border transition-all ${friend.selected ? 'bg-white/5 border-white/20' : 'bg-white/[0.02] border-white/5 opacity-40'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => toggleFriend(friend.id)}
                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${friend.selected ? 'bg-[#552583] border-[#FDB927]' : 'border-white/20'
                                            }`}
                                    >
                                        {friend.selected && <Check size={14} className="text-[#FDB927]" strokeWidth={4} />}
                                    </button>
                                    <div className="w-10 h-10 rounded-full border border-white/10 bg-black overflow-hidden flex items-center justify-center">
                                        {friend.photoURL ? (
                                            <img src={friend.photoURL} alt={friend.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="font-bold text-xs">{friend.name[0]}</span>
                                        )}
                                    </div>
                                    <span className="text-xs font-black italic tracking-tight">{friend.name}</span>
                                </div>

                                <div className="relative w-28">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#FDB927]">{currencySymbol}</span>
                                    <input
                                        type="number"
                                        disabled={!friend.selected}
                                        value={friend.amount}
                                        onChange={(e) => updateMemberAmount(friend.id, e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-2 pl-7 pr-3 text-right text-sm font-black outline-none focus:border-[#FDB927]"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Validation Status */}
                    <div className={`flex items-center gap-2 p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest justify-center transition-colors ${isValid ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                        {isValid ? (
                            <><Check size={14} strokeWidth={4} /> Matches (${amount.toFixed(2)})</>
                        ) : (
                            <><AlertCircle size={14} strokeWidth={4} /> Diff: ${(amount - currentSum).toFixed(2)}</>
                        )}
                    </div>
                </section>

                {/* Primary Actions */}
                <div className="space-y-3 pt-4">
                    <button
                        onClick={handleUpdate}
                        className="w-full bg-[#FDB927] text-[#552583] py-5 rounded-[32px] font-['Inter'] font-black italic text-sm uppercase tracking-[0.2em] shadow-[0_4px_0_#b8861b] active:translate-y-[2px] active:shadow-[0_2px_0_#b8861b] transition-all duration-75 flex items-center justify-center gap-2"
                    >
                        Update Expense
                    </button>
                    <button
                        onClick={() => navigate(-1)} // OR confirm cancel?
                        className="w-full bg-[#552583]/20 text-white/40 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white/5 active:scale-[0.98] transition-all"
                    >
                        Cancel
                    </button>

                </div>
            </main>

            <BottomNav />
        </div>
    );
}
