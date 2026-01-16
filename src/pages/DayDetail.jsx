import { useNavigate, useParams } from "react-router-dom";
import itineraryData from "../data/itinerary.json";
import EventMap from "../components/EventMap";

export default function DayDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    // Find the day (convert id param to number)
    const dayData = itineraryData.find(d => d.id === parseInt(id));

    if (!dayData) return <div className="text-white text-center pt-20">Day not found</div>;

    return (
        <div className="relative w-full max-w-[430px] mx-auto flex flex-col bg-background-light dark:bg-background-dark min-h-screen pb-24 font-display text-slate-900 dark:text-white">
            {/* Top Navigation */}
            <nav className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-4 py-4">
                <div className="flex items-center justify-between max-w-md mx-auto">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 dark:bg-card-dark text-slate-900 dark:text-white shadow-sm active:scale-95 transition-transform">
                        <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
                    </button>
                    <div className="text-center">
                        <h1 className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{dayData.date}</h1>
                        <p className="text-lg font-extrabold text-primary">Day {dayData.id}: {dayData.location}</p>
                    </div>
                    <button className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 dark:bg-card-dark text-slate-900 dark:text-white shadow-sm">
                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                </div>
            </nav>

            <main className="max-w-md mx-auto px-4 space-y-6">
                {/* Header Bento Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-1 lakers-gradient p-5 rounded-xl shadow-lg text-white">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-[20px]">cloudy_snowing</span>
                            </div>
                            <span className="text-xs font-bold opacity-80 uppercase tracking-wider">Weather</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-3xl font-black">{dayData.weather.split(' ')[1]}</span>
                            <span className="text-xs text-white/80 font-bold uppercase tracking-widest">{dayData.weather.split(' ')[0]}</span>
                        </div>
                    </div>
                    <div className="col-span-1 bg-white dark:bg-card-dark p-5 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
                            <span className="text-xs font-semibold opacity-60 uppercase">Budget</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold">$120<span className="text-sm font-normal opacity-40">/$150</span></span>
                            <span className="text-xs text-red-400 font-medium">-$30 remaining</span>
                        </div>
                    </div>
                </div>

                {/* Timeline Section */}
                <div className="relative space-y-8">
                    {/* Timeline Line */}
                    <div className="absolute left-[19px] top-6 bottom-0 w-0.5 bg-slate-200 dark:bg-white/10"></div>

                    {dayData.events.map((event, index) => (
                        <div key={index} className="relative pl-12">
                            {/* Icon */}
                            <div className={`absolute left-0 top-1 w-10 h-10 flex items-center justify-center rounded-full z-10 shadow-lg ${index === 0 ? 'bg-primary text-white shadow-primary/20' : 'bg-white dark:bg-card-dark border-2 border-primary text-primary'}`}>
                                <span className="material-symbols-outlined text-sm">{event.icon}</span>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-baseline justify-between">
                                    <h3 className="text-lg font-bold leading-tight">{event.title}</h3>
                                    <span className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${index === 0 ? 'text-primary bg-primary/10' : 'opacity-40 bg-slate-200 dark:bg-white/5'}`}>{event.time}</span>
                                </div>

                                {event.description && (
                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                        {event.description}
                                    </p>
                                )}

                                {/* Map Module */}
                                {event.mapLink && (
                                    <div className="rounded-xl overflow-hidden bg-white dark:bg-card-dark border border-slate-100 dark:border-white/5 shadow-sm">
                                        <EventMap mapLink={event.mapLink} />
                                        <div className="p-3 flex items-center justify-between">
                                            <span className="text-xs font-medium opacity-60 truncate max-w-[180px]">{event.location}</span>
                                            <a
                                                href={event.mapLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-tight hover:underline"
                                            >
                                                <span className="material-symbols-outlined text-sm">directions</span>
                                                Open Maps
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Daily Expense Summary */}
                <div className="bg-primary p-6 rounded-2xl text-white shadow-xl shadow-primary/20 mt-8 mb-24">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-lg">Daily Summary</h4>
                        <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full uppercase">Day {dayData.id}</span>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="opacity-80">Accommodation</span>
                            <span className="font-semibold">$0.00 (Prepaid)</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="opacity-80">Activities & Dining</span>
                            <span className="font-semibold">$120.45</span>
                        </div>
                        <div className="pt-3 border-t border-white/20 flex justify-between items-end">
                            <span className="text-sm opacity-80 font-medium uppercase tracking-wider">Total Spent</span>
                            <span className="text-2xl font-black">$120.45</span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Floating Navigation Bar */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[360px] bg-white/90 dark:bg-card-dark/90 backdrop-blur-xl rounded-full px-2 py-2 flex items-center justify-between shadow-2xl border border-white/10 z-[100]">
                <button onClick={() => navigate('/itinerary')} className="flex-1 flex flex-col items-center justify-center py-2 text-primary">
                    <span className="material-symbols-outlined">calendar_month</span>
                    <span className="text-[10px] font-bold mt-1">Days</span>
                </button>
                <button onClick={() => navigate('/overview')} className="flex-1 flex flex-col items-center justify-center py-2 text-slate-400 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">dashboard</span>
                    <span className="text-[10px] font-bold mt-1">Dash</span>
                </button>
                <div className="flex-1 flex justify-center -mt-8">
                    <button onClick={() => navigate('/add-expense')} className="w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center ring-4 ring-background-light dark:ring-background-dark active:scale-95 transition-transform">
                        <span className="material-symbols-outlined text-3xl">add</span>
                    </button>
                </div>
                <button onClick={() => navigate('/add-expense')} className="flex-1 flex flex-col items-center justify-center py-2 text-slate-400 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">payments</span>
                    <span className="text-[10px] font-bold mt-1">Split</span>
                </button>
                <button className="flex-1 flex flex-col items-center justify-center py-2 text-slate-400 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">person</span>
                    <span className="text-[10px] font-bold mt-1">Profile</span>
                </button>
            </div>
        </div>
    );
}
