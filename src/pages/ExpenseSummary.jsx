import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import currencyJs from 'currency.js';
import BottomNav from '../components/BottomNav';

const ExpenseSummary = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [settlements, setSettlements] = useState([]);
    const [totalNet, setTotalNet] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        async function calculateSettlements() {
            try {
                // 1. Get all expenses I'm involved in
                const q = query(
                    collection(db, "expenses"),
                    where("splitWith", "array-contains", currentUser.uid)
                );

                const snapshot = await getDocs(q);
                const balMap = {}; // { uid: { amount: 0, items: [] } }

                snapshot.forEach(docSnap => {
                    const data = docSnap.data();
                    const isUSD = data.currency === 'USD';
                    const rate = isUSD ? 32 : 1;

                    if (data.paidBy === currentUser.uid) {
                        // I paid. Others owe me.
                        if (data.splits) {
                            data.splits.forEach(split => {
                                if (split.userId !== currentUser.uid) {
                                    // Convert to TWD
                                    let splitAmount = currencyJs(split.amount).multiply(rate).value;

                                    if (!balMap[split.userId]) balMap[split.userId] = { amount: 0, items: [] };

                                    // Use currency.js for addition
                                    balMap[split.userId].amount = currencyJs(balMap[split.userId].amount).add(splitAmount).value;

                                    balMap[split.userId].items.push({
                                        name: data.item,
                                        amount: splitAmount,
                                        type: 'owe_me',
                                        originalCurrency: data.currency
                                    });
                                }
                            });
                        }
                    } else {
                        // Someone else paid. I owe them (if I'm in splits).
                        if (data.splits) {
                            const mySplit = data.splits.find(s => s.userId === currentUser.uid);
                            if (mySplit) {
                                // Convert to TWD
                                let mySplitAmount = currencyJs(mySplit.amount).multiply(rate).value;

                                const creditor = data.paidBy;
                                if (!balMap[creditor]) balMap[creditor] = { amount: 0, items: [] };

                                // Use currency.js for subtraction
                                balMap[creditor].amount = currencyJs(balMap[creditor].amount).subtract(mySplitAmount).value;

                                balMap[creditor].items.push({
                                    name: data.item,
                                    amount: mySplitAmount,
                                    type: 'i_owe',
                                    originalCurrency: data.currency
                                });
                            }
                        }
                    }
                });

                // 2. Fetch User Details for everyone in balMap
                const uids = Object.keys(balMap);
                const userDocs = await Promise.all(uids.map(uid => getDoc(doc(db, "users", uid))));
                const usersMap = {};
                userDocs.forEach(d => {
                    if (d.exists()) usersMap[d.id] = d.data();
                });

                // 3. Transform to array
                let netTotal = currencyJs(0);
                const result = uids.map(uid => {
                    const bal = balMap[uid];
                    netTotal = netTotal.add(bal.amount);
                    const user = usersMap[uid] || { displayName: 'Unknown', photoURL: null };

                    return {
                        uid,
                        name: user.displayName || 'Unknown',
                        initial: (user.displayName ? user.displayName[0] : '?').toUpperCase(),
                        photoURL: user.photoURL,
                        amount: bal.amount, // Net amount (+ owes me, - I owe)
                        items: bal.items
                    };
                });

                setSettlements(result);
                setTotalNet(netTotal.value);

            } catch (error) {
                console.error("Error calculating settlements:", error);
            } finally {
                setLoading(false);
            }
        }

        calculateSettlements();
    }, [currentUser]);

    // Derived UI state
    // "My Total Owed" logic: 
    // If netTotal < 0, I owe money overall. If > 0, I am owed money.
    // The UI label "My Total Owed" implies Debt.
    // Let's adapt: if totalNet < 0, show "My Total Owed" (Debt). 
    // If totalNet > 0, show "Total Owed To Me" (Credit).

    // Actually, let's stick to the visual provided but adapt the text.
    // Or just show "Net Balance".
    // I will show "My Net Position" to be safe, or stick to "My Total Owed" if negative.

    const isDebt = totalNet < 0;
    const displayTotalTWD = Math.abs(totalNet);
    const displayTotalUSD = currencyJs(displayTotalTWD).divide(32).value;

    return (
        <div className="min-h-screen bg-[#121212] text-white pb-24 font-sans max-w-[430px] mx-auto">
            <header className="p-6 flex justify-between items-center">
                <button onClick={() => navigate(-1)}><span className="material-symbols-outlined rotate-180 text-[#FDB927]">chevron_right</span></button>
                <h1 className="text-xl font-black italic tracking-tighter uppercase">My Expense Summary</h1>
                <div className="w-8 h-8 rounded-lg bg-[#FDB927]/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#FDB927] text-lg">attach_money</span>
                </div>
            </header>

            {/* Main Total Card */}
            <div className="px-4 mb-8">
                <div className="bg-gradient-to-br from-[#552583] to-[#3a1958] p-8 rounded-[40px] shadow-2xl relative overflow-hidden border-b-4 border-[#FDB927]">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-[#FDB927] text-xs font-black uppercase tracking-widest">{isDebt ? "My Total Debt" : "My Total Credit"}</p>
                        <span className="material-symbols-outlined text-white/40 text-xl">info</span>
                    </div>
                    <h2 className="text-5xl font-black italic mb-2 tracking-tighter">
                        {isDebt ? '-' : '+'}NT${displayTotalTWD.toFixed(0)}
                    </h2>
                    <p className="text-white/50 text-sm font-bold tracking-tight">≈ ${displayTotalUSD.toFixed(2)} USD</p>

                    <div className="mt-8 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full ${isDebt ? 'bg-red-500' : 'bg-[#FDB927]'} w-[65%] rounded-full shadow-[0_0_10px_#FDB927]`}></div>
                    </div>
                </div>
            </div>

            {/* Settlement Breakdown */}
            <div className="px-4">
                <div className="flex justify-between items-center mb-6 px-2">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#FDB927]">Settlement Breakdown</h3>
                    <span className="text-[10px] font-bold text-white/30 uppercase">{settlements.length} People</span>
                </div>

                {loading ? (
                    <div className="text-center text-white/50 py-10">Loading...</div>
                ) : (
                    <div className="space-y-4">
                        {settlements.map((person, idx) => {
                            const personOwesMe = person.amount > 0;
                            const personAmount = Math.abs(person.amount);

                            return (
                                <div key={idx} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                                    <div className="p-5 flex items-center justify-between bg-white/[0.02]">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-full bg-purple-900 border-2 border-[#FDB927] flex items-center justify-center text-xs font-black relative overflow-hidden`}>
                                                {person.photoURL ? (
                                                    <img src={person.photoURL} alt={person.name} className="w-full h-full object-cover" />
                                                ) : person.initial}
                                                <div className="absolute -bottom-1 -right-1 bg-[#FDB927] p-1 rounded-full shadow-lg flex items-center justify-center">
                                                    <div className="w-2 h-2 rounded-full border border-[#552583]"></div>
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-black text-lg">{person.name}</h4>
                                                <p className={`${personOwesMe ? 'text-[#FDB927]' : 'text-red-400'} text-[10px] font-black uppercase italic`}>
                                                    {personOwesMe ? "Owes You" : "You Owe"}: ${personAmount.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                        <button className="bg-white/10 hover:bg-[#FDB927] hover:text-[#552583] px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest cursor-pointer">
                                            Settle
                                        </button>
                                    </div>

                                    <div className="p-5 pt-2 space-y-3">
                                        {person.items.map((item, i) => (
                                            <div key={i} className="flex justify-between items-center text-sm">
                                                <span className="text-white/50 font-medium">
                                                    {item.name}
                                                    <span className="text-[9px] opacity-50 ml-1">
                                                        ({item.type === 'owe_me' ? 'Split' : 'Covered'})
                                                    </span>
                                                </span>
                                                <span className="font-black">${item.amount.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                        {settlements.length === 0 && (
                            <div className="text-center text-white/30 py-8 text-sm italic">
                                No expenses to settle.
                            </div>
                        )}
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
};

export default ExpenseSummary;
