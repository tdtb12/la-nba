import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function Login() {
    const { login, currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (currentUser) {
            navigate("/overview");
        }
    }, [currentUser, navigate]);

    const handleLogin = async () => {
        try {
            const result = await login();
            const user = result.user;
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                lastLogin: new Date()
            }, { merge: true });
            navigate("/overview");
        } catch (error) {
            console.error("Failed to log in", error);
        }
    };

    return (
        <div className="relative h-[100dvh] w-full flex flex-col bg-background-dark max-w-[430px] mx-auto overflow-hidden">
            <div className="absolute inset-0 z-0">
                <div
                    className="w-full h-full bg-center bg-cover opacity-60"
                    style={{
                        backgroundImage:
                            'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCyFS12cE_tdsJCcYWBRFI5_dm4dNftwFwFHYBIONKZS--oHxvHki6fjPcsSzItxp2gr4YdIXhoDMEaUcsmgn373vc9cOULt-X_WDUabdSxzEvu-hC_koF5HudSf_pDLhLH-gWulGmvAVBYrUkDsrJF6_P1OOrhkvFjQRfWVm3rTqC3DatZIQZjAwbA6o7p4DTEs8F4UPEbruOBnGn6dYXWvgvN7reYe2J4AgIoDAaLmr91Eq9tdNk5BZ-D8MT_7Ite6qHXL3RUYOQ")',
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-background-dark"></div>
                </div>
            </div>
            <div className="relative z-10 pt-20 px-8 text-center flex-1 flex flex-col items-center justify-center">
                <div className="mb-6 flex justify-center">
                    <div className="p-4 rounded-3xl bg-primary/10 border border-primary/20 backdrop-blur-md">
                        <span className="material-symbols-outlined text-primary text-5xl">
                            wb_sunny
                        </span>
                    </div>
                </div>
                <div className="mb-8">
                    <h1 className="font-display font-bold text-6xl tracking-tight mb-2 text-white">
                        🐐🐐🐐<br />    <span className="text-primary italic">LA BRON JAMES</span>
                    </h1>
                    <p className="text-white/80 text-lg font-medium leading-relaxed max-w-[280px] mx-auto">
                        為您打造的 8 天洛杉磯朝聖之旅
                    </p>
                </div>

                <div className="w-full max-w-sm mx-auto space-y-8 mt-8">
                    <div className="bg-card-dark/70 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                        <div className="space-y-6">
                            <button
                                onClick={handleLogin}
                                className="w-full flex items-center justify-center gap-4 bg-white text-black font-bold h-14 rounded-xl active:scale-[0.98] transition-all shadow-lg hover:bg-gray-50"
                            >
                                <img
                                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                    alt="Google"
                                    className="w-5 h-5"
                                />
                                <span className="text-base">使用 Google 登入</span>
                            </button>
                        </div>
                    </div>
                    <div className="pt-4 flex justify-center opacity-40">
                        <div className="h-1.5 w-32 bg-white/50 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
