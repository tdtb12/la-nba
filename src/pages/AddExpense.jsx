import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useUsers } from "../context/UsersContext";
import BottomNav from "../components/BottomNav";
import currencyJs from "currency.js";
import { Ticket, CheckCircle2 } from 'lucide-react';

export default function AddExpense() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { usersList, loading: usersLoading } = useUsers();

    const [amount, setAmount] = useState("");
    const [currency, setCurrency] = useState("USD");
    const [item, setItem] = useState("");
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [loading, setLoading] = useState(false);

    // Derived state for available users
    const availableUsers = usersList.filter(u => u.id !== currentUser?.uid);

    const toggleFriend = (friendId) => {
        if (selectedFriends.includes(friendId)) {
            setSelectedFriends(selectedFriends.filter((id) => id !== friendId));
        } else {
            setSelectedFriends([...selectedFriends, friendId]);
        }
    };

    const handleSave = async () => {
        if (!amount || !item) {
            alert("請輸入金額與項目名稱");
            return;
        }

        setLoading(true);
        try {
            const totalVal = currencyJs(amount);
            const allInvolvedIds = [currentUser.uid, ...selectedFriends];
            const splitValues = totalVal.distribute(allInvolvedIds.length);

            const splits = allInvolvedIds.map((uid, index) => ({
                userId: uid,
                amount: splitValues[index].value
            }));

            await addDoc(collection(db, "expenses"), {
                item,
                amount: totalVal.value,
                currency,
                paidBy: currentUser.uid,
                createdAt: serverTimestamp(),
                splits,
                splitWith: allInvolvedIds
            });
            navigate("/overview");
        } catch (e) {
            console.error("Error adding document: ", e);
            alert("儲存失敗");
        } finally {
            setLoading(false);
        }
    };

    // Calculation for display
    const splitCount = selectedFriends.length + 1;
    const perPerson = amount && splitCount > 0
        ? currencyJs(amount).divide(splitCount).toString()
        : "0.00";

    const currencySymbol = currency === "USD" ? "$" : "NT$";

    return (
        <div className="w-full min-h-screen bg-background-dark text-white font-['Inter'] pb-32 max-w-[430px] mx-auto relative shadow-2xl flex flex-col border-x border-[#592e7f]/10">
            {/* HEADER - Sticky at top */}
            <header className="px-6 py-5 flex justify-between items-center border-b border-white/5 sticky top-0 bg-[#0F0F0F] z-50">
                <button
                    onClick={() => navigate(-1)}
                    className="text-[#FDB927] font-[900] italic uppercase text-[10px] tracking-widest hover:opacity-80 transition-opacity"
                >
                    CANCEL
                </button>
                <h1 className="text-white font-[900] italic uppercase text-[10px] tracking-[0.2em]">
                    ADD NEW EXPENSE
                </h1>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="text-[#FDB927] font-[900] italic uppercase text-[10px] tracking-widest disabled:opacity-50 hover:opacity-80 transition-opacity"
                >
                    SAVE
                </button>
            </header>

            <main className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                {/* AMOUNT SECTION */}
                <section className="text-center py-4 relative group">
                    <div className="flex justify-center mb-8">
                        <div className="inline-flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <button
                                onClick={() => setCurrency('USD')}
                                className={`px-8 py-2.5 rounded-xl text-[10px] font-[900] italic uppercase tracking-widest transition-all duration-200 ${currency === 'USD'
                                    ? 'bg-[#FDB927] text-[#552583] shadow-lg'
                                    : 'text-white/40 hover:text-white/60'
                                    }`}
                            >
                                USD
                            </button>
                            <button
                                onClick={() => setCurrency('TWD')}
                                className={`px-8 py-2.5 rounded-xl text-[10px] font-[900] italic uppercase tracking-widest transition-all duration-200 ${currency === 'TWD'
                                    ? 'bg-[#FDB927] text-[#552583] shadow-lg'
                                    : 'text-white/40 hover:text-white/60'
                                    }`}
                            >
                                TWD
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                        <span className="text-[#FDB927] text-4xl font-[900] italic leading-none">{currencySymbol}</span>
                        <input
                            type="text"
                            inputMode="decimal"
                            value={amount}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                                    setAmount(value);
                                }
                            }}
                            placeholder="0.00"
                            className="bg-transparent text-7xl font-[900] italic tracking-tighter w-48 text-center outline-none text-white placeholder:text-white/10 caret-[#FDB927]"
                        />
                    </div>
                    <p className="text-[10px] font-[900] text-white/20 uppercase tracking-[0.3em] mt-3 italic">
                        Total Expense
                    </p>
                </section>

                {/* ITEM INPUT */}
                <div className="bg-white/5 rounded-[32px] p-5 flex items-center gap-4 border border-white/5 focus-within:border-[#FDB927]/30 transition-colors">
                    <div className="bg-[#552583] p-3 rounded-2xl">
                        <Ticket className="text-[#FDB927]" size={20} fill="#FDB927" />
                    </div>
                    <input
                        value={item}
                        onChange={(e) => setItem(e.target.value)}
                        placeholder="ITEM NAME (E.G. TACOS)"
                        className="bg-transparent flex-1 font-[900] text-xl outline-none placeholder:text-white/20 tracking-tighter text-white"
                    />
                </div>

                {/* FRIENDS LIST */}
                <section className="space-y-4">
                    <div className="flex justify-between items-end px-2">
                        <h2 className="text-[10px] font-[900] text-white/40 uppercase tracking-widest italic">
                            Split With Friends
                        </h2>
                        <span className="text-[9px] font-[900] text-[#FDB927] uppercase tracking-widest italic opacity-60">
                            {selectedFriends.length === 0 ? "Personal" : `${selectedFriends.length} Selected`}
                        </span>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar px-1 custom-scrollbar">
                        {availableUsers.map(user => {
                            const isSelected = selectedFriends.includes(user.uid);
                            return (
                                <button
                                    key={user.uid}
                                    onClick={() => toggleFriend(user.uid)}
                                    className="flex flex-col items-center gap-2 shrink-0 group"
                                >
                                    <div className={`relative w-16 h-16 rounded-full border-2 p-1 transition-all duration-300 ${isSelected ? 'border-[#552583] bg-white/5' : 'border-white/10 opacity-50 grayscale hover:grayscale-0'}`}>
                                        {user.photoURL ? (
                                            <img src={user.photoURL} alt={user.displayName} className="w-full h-full rounded-full bg-neutral-800 object-cover" />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-[#552583] flex items-center justify-center text-lg font-bold">
                                                {user.displayName?.[0] || "?"}
                                            </div>
                                        )}
                                        {isSelected && (
                                            <div className="absolute -bottom-1 -right-1 bg-[#552583] rounded-full p-1.5 border-[3px] border-[#0F0F0F] shadow-lg animate-in zoom-in duration-200">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FDB927" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <span className={`text-[12px] font-[900] uppercase font-bold tracking-tighter transition-colors ${isSelected ? 'text-white' : 'text-white/40'}`}>
                                        {user.displayName}
                                    </span>
                                </button>
                            );
                        })}
                        {availableUsers.length === 0 && (
                            <p className="text-[10px] text-white/30 italic font-bold p-2">No other friends found</p>
                        )}
                    </div>
                </section>

                {/* PER PERSON BOX */}
                <div className="bg-[#552583] rounded-[32px] p-6 flex justify-between items-center shadow-2xl border-b-4 border-[#FDB927] relative overflow-hidden">
                    {/* Decorative background element matching sample feel */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#FDB927] blur-[50px] opacity-10 rounded-full pointer-events-none"></div>

                    <div className="relative z-10">
                        <p className="text-[#FDB927] text-[10px] font-[900] uppercase tracking-widest italic mb-1">
                            Per Person
                        </p>
                        <h3 className="text-3xl font-[900] italic tracking-tighter leading-none text-white">
                            {currencySymbol}{perPerson}
                        </h3>
                    </div>
                    {selectedFriends.length === 0 ? (
                        <div className="bg-[#FDB927] text-[#552583] px-3 py-1.5 rounded-full text-[9px] font-[900] uppercase italic shadow-lg z-10">
                            PAYING FOR MYSELF
                        </div>
                    ) : (
                        <div className="bg-black/20 text-[#FDB927] px-3 py-1.5 rounded-full text-[9px] font-[900] uppercase italic border border-[#FDB927]/20 z-10">
                            {selectedFriends.length + 1} People
                        </div>
                    )}
                </div>

                {/* Main SAVE BUTTON (Visible in flow) */}
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full bg-[#FDB927] text-[#552583] py-5 rounded-[24px] font-[900] italic text-sm uppercase tracking-[0.2em] shadow-[0_6px_0_#b8861b] active:translate-y-1 transition-all disabled:opacity-50 disabled:shadow-none"
                >
                    Save Expense
                </button>
            </main>

            {/* Bottom Nav reused */}
            <BottomNav />
        </div>
    );
}
