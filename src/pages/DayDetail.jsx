import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import currencyJs from "currency.js";
import { toCelsius } from "../utils/weather";

import EventMap from "../components/EventMap";
import BottomNav from "../components/BottomNav";
import { useSchedule } from "../context/ScheduleContext";

const LOCATION_COORDS = {
    "San Gabriel": { lat: 34.0961, lng: -118.1058 },
    "Pasadena": { lat: 34.1478, lng: -118.1445 },
    "DTLA / Hollywood": { lat: 34.0522, lng: -118.2437 },
    "Universal City": { lat: 34.1381, lng: -118.3534 },
    "Las Vegas": { lat: 36.1699, lng: -115.1398 },
    "Grand Canyon / Las Vegas": { lat: 36.0544, lng: -112.1401 },
    "Ontario": { lat: 34.0633, lng: -117.6509 },
    "ONT Airport": { lat: 34.0560, lng: -117.6012 }
};

export default function DayDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getDay } = useSchedule();
    const dayData = getDay(id);
    const [weather, setWeather] = useState(null);
    const [dailyTotal, setDailyTotal] = useState(0);

    useEffect(() => {
        if (!dayData) return;

        const coords = LOCATION_COORDS[dayData.location] || LOCATION_COORDS["San Gabriel"]; // Fallback

        async function fetchWeather() {
            try {
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current_weather=true&temperature_unit=fahrenheit`);
                const data = await res.json();
                setWeather(data.current_weather);
            } catch (error) {
                console.error("Failed to fetch weather", error);
            }
        }

        fetchWeather();
    }, [dayData]);

    // Calculate Daily Expenses
    useEffect(() => {
        if (!dayData) return;

        // Construct date range for the day (00:00:00 to 23:59:59)
        const startOfDay = new Date(dayData.date + "T00:00:00");
        const endOfDay = new Date(dayData.date + "T23:59:59");

        const q = query(
            collection(db, "expenses"),
            where("createdAt", ">=", Timestamp.fromDate(startOfDay)),
            where("createdAt", "<=", Timestamp.fromDate(endOfDay))
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let total = currencyJs(0);
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.amount) {
                    total = total.add(data.amount);
                }
            });
            setDailyTotal(total.value);
        }, (error) => {
            console.error("Error fetching available expenses: ", error);
        });

        return () => unsubscribe();
    }, [dayData]);

    if (!dayData) return <div className="text-white text-center pt-20">Day not found</div>;

    return (
        <div className="relative w-full max-w-[430px] mx-auto flex flex-col bg-background-light dark:bg-background-dark min-h-screen pb-24 font-display text-slate-900 dark:text-white">
            {/* Top Navigation */}
            <nav className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-4 py-4">
                <div className="flex items-center justify-between max-w-md mx-auto">
                    <button onClick={() => navigate(`/overview`)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 dark:bg-card-dark text-slate-900 dark:text-white shadow-sm active:scale-95 transition-transform">
                        <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
                    </button>
                    <div className="text-center">
                        <h1 className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{dayData.date}</h1>
                        <p className="text-lg font-extrabold text-primary">Day {dayData.id}: {dayData.location}</p>
                    </div>
                    <button onClick={() => navigate(`/manage/${dayData.id}`)} className="w-auto px-4 h-10 flex items-center justify-center rounded-full bg-accent text-primary shadow-sm font-bold text-xs uppercase gap-1 hover:bg-accent/80 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                        Edit
                    </button>
                </div>
            </nav>

            <main className="max-w-md mx-auto px-4 space-y-6">
                {/* Header Bento Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 lakers-gradient p-5 rounded-xl shadow-lg text-white">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-[20px]">cloudy_snowing</span>
                            </div>
                            <span className="text-xs font-bold opacity-80 uppercase tracking-wider">Local Forecast</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-4xl font-black">
                                {weather ? (
                                    <>
                                        {Math.round(weather.temperature)}°F <span className="text-xl font-normal opacity-60">/ {toCelsius(weather.temperature)}°C</span>
                                    </>
                                ) : 'Loading...'}
                            </span>
                            <span className="text-xs text-white/80 font-bold uppercase tracking-widest mt-1">
                                {weather ? 'Current Temp' : dayData.weather}
                            </span>
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
                            <span className="font-semibold">${dailyTotal.toFixed(2)}</span>
                        </div>
                        <div className="pt-3 border-t border-white/20 flex justify-between items-end">
                            <span className="text-sm opacity-80 font-medium uppercase tracking-wider">Total Spent</span>
                            <span className="text-2xl font-black">${dailyTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Floating Action Button for Add Event */}
            <button
                onClick={() => navigate(`/manage/${dayData.id}`)}
                className="fixed bottom-24 right-6 bg-accent text-primary p-4 rounded-full shadow-[0_10px_30px_rgba(253,185,39,0.3)] border-4 border-background-dark active:scale-90 transition-transform z-40 hover:brightness-110"
            >
                <span className="material-symbols-outlined text-3xl font-bold">add</span>
            </button>

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    );
}
