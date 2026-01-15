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
        <div className="relative h-[100dvh] w-full flex flex-col bg-background-dark max-w-[430px] mx-auto overflow-hidden text-white antialiased">
            <div className="absolute inset-0 z-0">
                <div className="w-full h-full bg-center bg-cover opacity-60" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCyFS12cE_tdsJCcYWBRFI5_dm4dNftwFwFHYBIONKZS--oHxvHki6fjPcsSzItxp2gr4YdIXhoDMEaUcsmgn373vc9cOULt-X_WDUabdSxzEvu-hC_koF5HudSf_pDLhLH-gWulGmvAVBYrUkDsrJF6_P1OOrhkvFjQRfWVm3rTqC3DatZIQZjAwbA6o7p4DTEs8F4UPEbruOBnGn6dYXWvgvN7reYe2J4AgIoDAaLmr91Eq9tdNk5BZ-D8MT_7Ite6qHXL3RUYOQ")' }}>
                    <div className="absolute inset-0 bg-overlay"></div>
                </div>
            </div>
            <div className="relative z-10 flex flex-col h-full px-6 pt-16 pb-8"> {/* Adjusted padding-bottom somewhat arbitrarily as var(--ios-safe-area-bottom) isn't standard in index.css yet */}
                <div className="flex-grow flex flex-col items-center justify-center text-center">
                    <div className="mb-8 inline-flex p-4 rounded-3xl bg-lakers-gold/10 border border-lakers-gold/30 backdrop-blur-md">
                        <span className="material-symbols-outlined text-lakers-gold text-5xl">sports_basketball</span>
                    </div>
                    <h1 className="font-display font-bold text-6xl tracking-tight mb-4 text-glow">
                        🐐👑<br></br>LA<span className="text-lakers-gold italic"> BRON JAMES</span>
                    </h1>
                </div>
                <div className="w-full max-w-sm mx-auto space-y-10">
                    <div className="glass-panel rounded-2xl p-6 shadow-2xl">
                        <div className="space-y-6">
                            <button onClick={handleLogin} className="w-full flex items-center justify-center gap-4 bg-lakers-gold text-lakers-purple font-bold h-14 rounded-xl active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(253,185,39,0.3)]">
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor" fillOpacity="0.8"></path>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" fillOpacity="0.8"></path>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor" fillOpacity="0.8"></path>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="currentColor" fillOpacity="0.8"></path>
                                </svg>
                                <span className="text-base">Continue with Google</span>
                            </button>
                        </div>
                    </div>
                    <div className="pt-4 flex justify-center opacity-20">
                        <div className="h-1.5 w-32 bg-lakers-gold rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
