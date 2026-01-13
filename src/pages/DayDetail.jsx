import { useNavigate, useParams } from "react-router-dom";
import itineraryData from "../data/itinerary.json";

export default function DayDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    // Find the day (convert id param to number)
    const dayData = itineraryData.find(d => d.id === parseInt(id));

    if (!dayData) return <div className="text-white text-center pt-20">Day not found</div>;

    return (
        <div className="relative w-full max-w-[430px] mx-auto flex flex-col bg-background-dark min-h-screen pb-24 font-display">
            {/* Nav */}
            <nav className="sticky top-0 z-50 bg-background-dark/95 backdrop-blur-xl border-b border-white/5">
                <div className="flex items-center justify-between px-4 h-16">
                    <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center rounded-full active:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-2xl text-white">arrow_back_ios_new</span>
                    </button>
                    <div className="text-center">
                        <h1 className="text-[10px] font-bold opacity-50 uppercase tracking-[0.2em] text-primary">{dayData.date}</h1>
                        <p className="text-lg font-bold text-white">Day {dayData.id} Details</p>
                    </div>
                    <button className="w-12 h-12 flex items-center justify-center rounded-full active:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-2xl text-white">ios_share</span>
                    </button>
                </div>
            </nav>

            <main className="px-4 pt-6 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-card-dark p-4 rounded-2xl border border-white/5 shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary">cloudy_snowing</span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Weather</span>
                            <span className="text-lg font-bold text-white">{dayData.weather}</span>
                        </div>
                    </div>
                    <div className="bg-card-dark p-4 rounded-2xl border border-white/5 shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-emerald-500">currency_exchange</span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold text-gray-400 uppercase">Rate (TWD)</span>
                            <span className="text-lg font-bold text-primary">32.1</span>
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="relative">
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/5"></div>
                    <div className="space-y-10">
                        {dayData.events.map((event, index) => (
                            <div key={index} className="relative pl-14">
                                <div className="absolute left-3 top-0 w-6 h-6 rounded-full bg-primary ring-4 ring-background-dark z-10 flex items-center justify-center shadow-lg">
                                    <span className="material-symbols-outlined text-[14px] text-white font-bold">{index === 0 ? 'check' : 'schedule'}</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-xs font-bold text-primary mb-1 block">{event.time}</span>
                                            <h3 className="text-xl font-bold text-white">{event.title}</h3>
                                        </div>
                                        <span className="material-symbols-outlined opacity-30 text-white">more_horiz</span>
                                    </div>
                                    <div className="rounded-2xl overflow-hidden bg-card-dark border border-white/10 shadow-md">
                                        {event.mapLink ? (
                                            <a href={event.mapLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 active:bg-white/5 transition-colors cursor-pointer group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-sm text-primary">{event.icon || 'location_on'}</span>
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-300 truncate max-w-[150px]">{event.location}</span>
                                                </div>
                                                <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1 group-hover:underline">
                                                    Open <span className="material-symbols-outlined text-sm">open_in_new</span>
                                                </span>
                                            </a>
                                        ) : (
                                            <div className="flex items-center gap-3 p-4">
                                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-sm text-gray-400">{event.icon || 'location_on'}</span>
                                                </div>
                                                <span className="text-sm font-medium text-gray-400 truncate">{event.location}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Floating Action Bar */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[360px] bg-white/10 backdrop-blur-xl rounded-full px-2 py-2 flex items-center justify-between shadow-2xl border border-white/10 z-[100]">
                <button onClick={() => navigate('/itinerary')} className="flex-1 flex flex-col items-center justify-center py-2 text-primary">
                    <span className="material-symbols-outlined">calendar_month</span>
                </button>
                <button onClick={() => navigate('/overview')} className="flex-1 flex flex-col items-center justify-center py-2 text-slate-400">
                    <span className="material-symbols-outlined">dashboard</span>
                </button>
                <div className="flex-1 flex justify-center -mt-8">
                    <button onClick={() => navigate('/add-expense')} className="w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center ring-4 ring-background-dark active:scale-95 transition-transform">
                        <span className="material-symbols-outlined text-3xl">add</span>
                    </button>
                </div>
                <button className="flex-1 flex flex-col items-center justify-center py-2 text-slate-400">
                    <span className="material-symbols-outlined">payments</span>
                </button>
                <button className="flex-1 flex flex-col items-center justify-center py-2 text-slate-400">
                    <span className="material-symbols-outlined">person</span>
                </button>
            </div>
        </div>
    );
}
