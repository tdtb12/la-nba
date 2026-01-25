import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import { ChevronLeft, Share2, Receipt, MapPin, Map, Check, Pencil, Trash2, Calendar, Wallet } from 'lucide-react';

const ExpenseDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState({});

    useEffect(() => {
        async function fetchTransaction() {
            try {
                if (!id) return;
                const docRef = doc(db, 'expenses', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setTransaction({ id: docSnap.id, ...data });

                    const involvedUids = new Set();
                    if (data.paidBy) involvedUids.add(data.paidBy);
                    if (data.splits) {
                        data.splits.forEach(s => involvedUids.add(s.userId));
                    }
                    if (data.splitWith) {
                        data.splitWith.forEach(uid => involvedUids.add(uid));
                    }

                    const usersData = {};
                    await Promise.all(Array.from(involvedUids).map(async (uid) => {
                        const userDoc = await getDoc(doc(db, 'users', uid));
                        if (userDoc.exists()) {
                            usersData[uid] = userDoc.data();
                        }
                    }));
                    setUsers(usersData);

                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.error("Error fetching transaction:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchTransaction();
    }, [id]);

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this expense?")) return;
        try {
            await deleteDoc(doc(db, 'expenses', id));
            navigate('/expenses');
        } catch (e) {
            console.error("Error deleting:", e);
            alert("Failed to delete");
        }
    };

    if (loading) return <div className="min-h-screen bg-[#171717] text-white flex items-center justify-center">Loading...</div>;
    if (!transaction) return <div className="min-h-screen bg-[#171717] text-white flex items-center justify-center">Transaction not found</div>;

    const getUserInfo = (uid) => {
        if (users[uid]) return users[uid];
        if (currentUser && currentUser.uid === uid) return currentUser;
        return { displayName: 'Unknown', photoURL: null };
    };

    const payer = getUserInfo(transaction.paidBy);

    // Format date logic
    const dateObj = transaction.createdAt ? transaction.createdAt.toDate() : new Date();
    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    // Splits Logic
    let splitsDisplay = [];
    if (transaction.splits) {
        splitsDisplay = transaction.splits.map(split => {
            const u = getUserInfo(split.userId);
            return {
                name: u.displayName || 'Unknown',
                photoURL: u.photoURL,
                amount: split.amount,
                status: split.userId === transaction.paidBy ? 'Paid' : 'Owed'
            };
        });
    }

    const currencySymbol = transaction.currency === 'USD' ? '$' : 'NT$';

    return (
        <div className="min-h-screen flex flex-col bg-[#171717] text-white font-sans max-w-[430px] mx-auto">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#171717]/90 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-[#262626]">
                <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-[#262626] text-[#FDB927]">
                    <ChevronLeft size={20} />
                </button>
                <h1 className="font-extrabold uppercase tracking-widest text-[11px] text-neutral-400">Transaction Details</h1>
                <button className="size-10 flex items-center justify-center rounded-full bg-[#262626] text-[#FDB927]">
                    <Share2 size={20} />
                </button>
            </header>

            <main className="flex-1 pb-32">
                <div className="px-5 pt-6">
                    {/* Hero Card */}
                    <div className="relative overflow-hidden rounded-xl p-8 mb-6 border-b-4 border-[#FDB927] shadow-2xl bg-gradient-to-br from-[#552583] to-[#3a195a]">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Receipt size={96} />
                        </div>
                        <div className="relative z-10 text-center">
                            <p className="font-extrabold uppercase tracking-widest text-[10px] text-[#FDB927]/80 mb-2">Total Amount</p>
                            <h2 className="text-5xl font-extrabold text-white tracking-tighter mb-4">
                                {currencySymbol}{parseFloat(transaction.amount).toFixed(2)}
                            </h2>
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-sm font-bold text-white uppercase tracking-wider">{transaction.item}</span>
                                <span className="text-[11px] font-medium text-white/50">{dateStr} • {timeStr}</span>
                            </div>
                        </div>
                    </div>

                    {/* Map Section (Optional - kept empty or removed as per 'location unnecessary', but visually requested in sample. I will OMIT it for now as per instructions but if needed can add back) */}
                    {/* If user STRICTLY follows sample, they might want map. But they sent contradictory instructions. I will assume NO map is safer based on text instruction. */}

                    <div className="space-y-8">
                        {/* Paid By */}
                        <section>
                            <h3 className="font-extrabold uppercase tracking-widest text-[10px] text-neutral-500 mb-3 px-1">Paid By</h3>
                            <div className="bg-[#262626]/40 rounded-2xl p-4 flex items-center gap-4 border border-white/5">
                                <div className="relative">
                                    {payer.photoURL ? (
                                        <img src={payer.photoURL} alt={payer.displayName} className="size-12 rounded-full border-2 border-[#FDB927] object-cover" />
                                    ) : (
                                        <div className="size-12 rounded-full border-2 border-[#FDB927] bg-[#552583] flex items-center justify-center font-bold text-white">
                                            {payer.displayName ? payer.displayName[0] : '?'}
                                        </div>
                                    )}
                                    <div className="absolute -bottom-1 -right-1 bg-[#552583] rounded-full p-1 border border-[#262626]">
                                        <Check size={10} className="text-[#FDB927]" />
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-extrabold text-base uppercase tracking-tight">{payer.displayName}</span>
                                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-500">Primary Payer</span>
                                </div>
                            </div>
                        </section>

                        {/* Split Breakdown */}
                        <section>
                            <h3 className="font-extrabold uppercase tracking-widest text-[10px] text-neutral-500 mb-3 px-1">Split Breakdown</h3>
                            <div className="space-y-2">
                                {splitsDisplay.length > 0 ? splitsDisplay.map((split, i) => (
                                    <div key={i} className="bg-[#262626]/20 rounded-2xl p-4 flex items-center justify-between border border-white/5">
                                        <div className="flex items-center gap-3">
                                            {split.photoURL ? (
                                                <img src={split.photoURL} alt={split.name} className="size-9 rounded-full object-cover" />
                                            ) : (
                                                <div className="size-9 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs">
                                                    {split.name[0]}
                                                </div>
                                            )}
                                            <span className="font-bold uppercase text-xs tracking-wide">{split.name}</span>
                                        </div>
                                        <span className="font-extrabold text-sm text-[#FDB927]">{currencySymbol}{parseFloat(split.amount).toFixed(2)}</span>
                                    </div>
                                )) : (
                                    <div className="text-center text-white/30 text-xs italic py-4">No split details available</div>
                                )}
                            </div>
                        </section>

                        {/* Actions */}
                        <div className="flex flex-col gap-3 pt-4">
                            <button
                                onClick={() => navigate(`/edit-expense/${id}`, { state: { expense: transaction } })}
                                className="w-full h-16 bg-[#552583] text-white rounded-2xl font-extrabold uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all border-b-4 border-[#3a195a] shadow-lg"
                            >
                                <Pencil size={20} /> Edit Expense
                            </button>
                            <button
                                onClick={handleDelete}
                                className="w-full h-16 bg-[#262626] text-red-500 rounded-2xl font-extrabold uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all border border-red-500/10 hover:bg-red-500/5"
                            >
                                <Trash2 size={20} /> Delete
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Nav reused but checking visibility */}
            <div className="fixed bottom-0 left-0 right-0 z-50">
                {/* Provide padding or wrap BottomNav if necessary to match the 'floating' look from the sample. 
                     The sample has a floating pill nav.
                     Existing BottomNav is full width.
                     User said 'dont change nav bar below just keep ...BottomNav.jsx'.
                     So I will just include it as is. The padding-bottom on main (pb-32) handles spacing.
                 */}
                <BottomNav />
            </div>
        </div>
    );
};

export default ExpenseDetails;
