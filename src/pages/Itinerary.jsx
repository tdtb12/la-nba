import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import itineraryData from "../data/itinerary.json";

export default function Itinerary() {
    const navigate = useNavigate();

    return (
        <div className="relative w-full max-w-[430px] mx-auto flex flex-col bg-background-dark min-h-screen pb-24 font-display">
            <header className="sticky top-0 z-50 flex items-center bg-background-dark/80 ios-blur p-4 border-b border-white/5">
                <div onClick={() => navigate(-1)} className="flex size-10 items-center justify-center cursor-pointer active:opacity-50 transition-opacity">
                    <span className="material-symbols-outlined text-gray-400">arrow_back</span>
                </div>
                <h1 className="text-white text-base font-bold flex-1 text-center tracking-tight">Full Itinerary</h1>
                <div className="size-10"></div>{/* Spacer */}
            </header>

            <main className="flex-1 px-5 pt-6 space-y-6">
                {itineraryData.map((day) => (
                    <div key={day.id} onClick={() => navigate(`/day/${day.id}`)} className="group flex items-start gap-4 p-4 rounded-2xl border border-white/5 bg-card-dark active:bg-white/5 cursor-pointer">
                        <div className="flex flex-col items-center gap-1 min-w-[3rem]">
                            <span className="text-gray-500 text-[10px] font-bold uppercase">{day.weekday.substring(0, 3)}</span>
                            <span className="text-2xl font-bold text-white">{parseInt(day.date.split('-')[2])}</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-primary text-xs font-bold uppercase tracking-wider mb-1">Day {day.id} • {day.location}</p>
                            <h3 className="text-white text-lg font-bold leading-tight mb-2">{day.title}</h3>
                            <div className="flex flex-wrap gap-2">
                                {day.events.slice(0, 3).map((event, i) => (
                                    <span key={i} className="text-gray-400 text-xs bg-black/20 px-2 py-1 rounded-md border border-white/5">
                                        {event.title}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-gray-600 group-active:text-primary self-center">chevron_right</span>
                    </div>
                ))}
            </main>
            <Navbar />
        </div>
    );
}
