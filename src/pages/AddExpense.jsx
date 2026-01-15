import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function AddExpense() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [amount, setAmount] = useState("");
    const [currency, setCurrency] = useState("USD");
    const [item, setItem] = useState("");
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [loading, setLoading] = useState(false);
    const [availableUsers, setAvailableUsers] = useState([]);

    useEffect(() => {
        async function fetchUsers() {
            try {
                const querySnapshot = await getDocs(collection(db, "users"));
                const users = [];
                querySnapshot.forEach((doc) => {
                    // exclude current user from the list if desired, but user might want to split with themselves? 
                    // usually "split with" implies others. Let's include everyone so they can pick.
                    if (doc.id !== currentUser?.uid) {
                        users.push(doc.data());
                    }
                });
                setAvailableUsers(users);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        }
        fetchUsers();
    }, [currentUser]);

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
            await addDoc(collection(db, "expenses"), {
                amount: parseFloat(amount),
                currency,
                item,
                paidBy: currentUser.uid,
                splitWith: selectedFriends,
                createdAt: serverTimestamp(),
            });
            navigate("/overview");
        } catch (e) {
            console.error("Error adding document: ", e);
            alert("儲存失敗");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex h-full min-h-screen w-full max-w-[430px] mx-auto flex-col bg-background-dark overflow-x-hidden shadow-2xl font-display text-white">
            <header className="sticky top-0 z-20 flex items-center bg-lakers-purple px-4 pt-4 pb-4 justify-between border-b border-white/10">
                <button onClick={() => navigate(-1)} className="text-primary text-base font-medium">取消</button>
                <h1 className="text-primary text-[17px] font-bold uppercase tracking-wide">新増分帳</h1>
                <div className="flex w-12 items-center justify-end">
                    <button onClick={handleSave} disabled={loading} className="text-primary text-base font-bold disabled:opacity-50">儲存</button>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-6 pb-32">
                <div className="bg-card-dark rounded-xl p-5 mb-6 shadow-sm border border-primary/20">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col items-center justify-center py-4">
                            <div className="flex items-center gap-2 mb-2">
                                <p className="text-primary/70 text-[10px] font-bold uppercase tracking-widest">總金額</p>
                                <div className="flex bg-black/20 p-0.5 rounded-full">
                                    <button onClick={() => setCurrency("USD")} className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition-all ${currency === "USD" ? "bg-primary text-lakers-purple shadow-sm" : "text-white/40"}`}>USD</button>
                                    <button onClick={() => setCurrency("TWD")} className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition-all ${currency === "TWD" ? "bg-primary text-lakers-purple shadow-sm" : "text-white/40"}`}>TWD</button>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-primary text-3xl font-bold leading-none">{currency === "USD" ? "$" : "NT$"}</span>
                                <input
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="bg-transparent border-none text-primary text-5xl font-bold p-0 focus:ring-0 w-48 text-center placeholder:text-white/30 placeholder:font-bold"
                                    placeholder="0.00"
                                    type="number"
                                    step="0.01"
                                />
                            </div>
                        </div>
                        <div className="h-px bg-white/10 w-full"></div>
                        <div className="flex flex-col">
                            <label className="text-primary/70 text-[10px] font-bold uppercase tracking-widest mb-2">項目名稱</label>
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary text-xl">receipt_long</span>
                                <input
                                    value={item}
                                    onChange={(e) => setItem(e.target.value)}
                                    className="bg-transparent border-none text-white text-lg font-medium p-0 focus:ring-0 flex-1 placeholder:text-white/30"
                                    placeholder="例如: 晚餐"
                                    type="text"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-card-dark rounded-xl p-5 mb-6 shadow-sm border border-primary/20">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-white text-base font-bold leading-tight">分帳對象</h3>
                        <div className="flex items-center gap-1 text-primary/70">
                            <span className="material-symbols-outlined text-sm">group</span>
                            <span className="text-[11px] font-medium italic">選擇朋友</span>
                        </div>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                        {availableUsers.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">尚無其他使用者 (請朋友先登入)</p>
                        ) : (
                            availableUsers.map((user) => (
                                <button
                                    key={user.uid}
                                    onClick={() => toggleFriend(user.uid)}
                                    className={`flex flex-col items-center gap-2 min-w-[64px] transition-opacity ${selectedFriends.includes(user.uid) ? 'opacity-100' : 'opacity-40'}`}
                                >
                                    <div className={`relative p-0.5 rounded-full ring-2 ${selectedFriends.includes(user.uid) ? 'ring-primary' : 'ring-transparent'} ring-offset-2 ring-offset-card-dark`}>
                                        {user.photoURL ? (
                                            <img alt={user.displayName} className="w-12 h-12 rounded-full object-cover bg-slate-200" src={user.photoURL} />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold">
                                                {user.displayName ? user.displayName[0] : "?"}
                                            </div>
                                        )}
                                        {selectedFriends.includes(user.uid) && (
                                            <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-0.5 border-2 border-card-dark">
                                                <span className="material-symbols-outlined text-[12px] block font-bold text-lakers-purple">check</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-white text-[11px] font-bold truncate w-16 text-center">{user.displayName || "User"}</p>
                                </button>
                            ))
                        )}
                    </div>
                    <div className="mt-6 p-1 bg-black/20 rounded-lg flex">
                        <button className="flex-1 py-2 px-4 rounded-md text-xs font-bold transition-all bg-primary text-lakers-purple shadow-sm">平分</button>
                        <button className="flex-1 py-2 px-4 rounded-md text-xs font-bold transition-all text-white/40">自訂金額</button>
                    </div>
                </div>

                {/* Estimated Summary */}
                <div className="bg-card-dark rounded-xl p-5 shadow-sm border border-primary/20">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <p className="text-primary/70 text-[10px] font-bold uppercase tracking-wider">預估每人</p>
                            <p className="text-primary text-2xl font-bold">
                                {currency === 'USD' ? '$' : 'NT$'}
                                {amount && (selectedFriends.length + 1) > 0 ? (parseFloat(amount) / (selectedFriends.length + 1)).toFixed(2) : "0.00"}
                            </p>
                        </div>
                        <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight">
                            {selectedFriends.length + 1} 人
                        </div>
                    </div>
                </div>
            </main>
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-6 bg-gradient-to-t from-background-dark via-background-dark to-transparent pt-10 z-30">
                <button onClick={handleSave} disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-lakers-purple font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
                    <span className="material-symbols-outlined">add</span>
                    新增費用
                </button>
            </div>
        </div>
    );
}
