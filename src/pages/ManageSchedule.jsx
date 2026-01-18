import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSchedule } from "../context/ScheduleContext";
import BottomNav from "../components/BottomNav";

export default function ManageSchedule() {
    const { dayId } = useParams();
    const navigate = useNavigate();
    const { getDay, addEvent, updateEvent, deleteEvent, schedule, syncToFirestore } = useSchedule();
    const [dayData, setDayData] = useState(null);
    const [editingIndex, setEditingIndex] = useState(null);

    // Form inputs
    const [when, setWhen] = useState("");
    const [what, setWhat] = useState("");
    const [details, setDetails] = useState("");
    const [mapLink, setMapLink] = useState("");
    const [icon, setIcon] = useState("calendar_today"); // Default icon

    useEffect(() => {
        const day = getDay(dayId);
        if (day) {
            setDayData(day);
        }
    }, [dayId, schedule]); // Re-run if schedule updates

    const handleSave = () => {
        if (!when || !what || !details) {
            alert("Please fill in all required fields (When, What, Details)");
            return;
        }

        const eventData = {
            time: when,
            title: what,
            description: details,
            location: what,
            mapLink: mapLink,
            icon: icon
        };

        if (editingIndex !== null) {
            updateEvent(dayId, editingIndex, eventData);
            alert("Event updated!");
        } else {
            addEvent(dayId, eventData);
            alert("Event added!");
        }

        // Reset form
        setWhen("");
        setWhat("");
        setDetails("");
        setMapLink("");
        setIcon("calendar_today");
        setEditingIndex(null);
    };

    const handleEdit = (index) => {
        const event = dayData.events[index];
        setWhen(event.time);
        setWhat(event.title);
        setDetails(event.description);
        setMapLink(event.mapLink || "");
        setIcon(event.icon || "calendar_today");
        setEditingIndex(index);

        // Scroll to top to see form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setWhen("");
        setWhat("");
        setDetails("");
        setMapLink("");
        setIcon("calendar_today");
        setEditingIndex(null);
    };

    const handleDelete = (index) => {
        if (window.confirm("Are you sure you want to delete this event?")) {
            deleteEvent(dayId, index);
        }
    };

    if (!dayData) return <div className="text-white text-center pt-20">Loading Day {dayId}...</div>;

    // Helper to get formatted date "Oct 18" from "2026-02-18" or "YYYY-MM-DD"
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        // Beware of timezone issues with simple Date parsing, but for display:
        // Adjust for timezone offset or use simple string splitting if YYYY-MM-DD
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return `${months[parseInt(parts[1]) - 1]} ${parseInt(parts[2])}`;
        }
        return dateStr;
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-white min-h-screen pb-32 font-display w-full max-w-[430px] mx-auto">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-background-light dark:bg-background-dark/95 backdrop-blur-md border-b border-white/10">
                <div className="flex items-center p-4 justify-between">
                    <button onClick={() => navigate(`/day/${dayId}`)} className="text-primary dark:text-accent flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-primary/10 cursor-pointer">
                        <span className="material-symbols-outlined">arrow_back_ios_new</span>
                    </button>
                    <h2 className="text-primary dark:text-white text-lg font-extrabold uppercase tracking-widest flex-1 text-center">Manage Schedule</h2>
                    <div className="flex w-10 items-center justify-end">
                        <button onClick={syncToFirestore} className="flex items-center justify-center size-10 rounded-full hover:bg-primary/10" title="Sync to Cloud">
                            <span className="material-symbols-outlined text-primary dark:text-accent text-[20px]">cloud_upload</span>
                        </button>
                    </div>
                </div>
                {/* Day Selector (Horizontal Scroll) */}
                <div className="flex overflow-x-auto custom-scrollbar px-4 gap-6 border-b border-white/10 pb-1">
                    {schedule.map((d) => (
                        <button
                            key={d.id}
                            onClick={() => navigate(`/manage/${d.id}`)}
                            className={`flex flex-col items-center justify-center border-b-4 pb-3 pt-2 shrink-0 min-w-[60px] transition-colors ${d.id === parseInt(dayId) ? 'border-accent text-accent' : 'border-transparent text-white/40'}`}
                        >
                            <p className="text-xs font-black uppercase">Day {d.id}</p>
                            <p className="text-[10px] font-bold opacity-70">{formatDate(d.date)}</p>
                        </button>
                    ))}
                </div>
            </div>

            <main className="p-4 space-y-8">
                {/* Add New Event Form */}
                <section className="bg-surface-dark rounded-xl p-5 border border-white/10 shadow-2xl relative overflow-hidden bg-[#2b2533]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full -mr-16 -mt-16"></div>
                    <h3 className="text-accent text-sm font-black uppercase tracking-tighter mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">{editingIndex !== null ? 'edit' : 'add_circle'}</span>
                        {editingIndex !== null ? 'Edit Event' : 'Add New Event'}
                    </h3>
                    <div className="space-y-4">
                        <div className="flex flex-col gap-1.5 gold-glow">
                            <label className="text-[10px] font-black uppercase text-white/60 px-1">When? (Required)</label>
                            <div className="flex items-stretch rounded-lg bg-black/20 border border-white/10">
                                <input
                                    value={when}
                                    onChange={(e) => setWhen(e.target.value)}
                                    className="flex-1 bg-transparent border-0 text-white p-3 text-sm font-bold focus:ring-0 placeholder:text-white/20"
                                    placeholder="e.g. 19:30"
                                    type="time"
                                />
                                <div className="flex items-center px-3 border-l border-white/10">
                                    <span className="material-symbols-outlined text-accent text-xl">schedule</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5 gold-glow">
                            <label className="text-[10px] font-black uppercase text-white/60 px-1">What are we doing? (Required)</label>
                            <input
                                value={what}
                                onChange={(e) => setWhat(e.target.value)}
                                className="bg-black/20 border border-white/10 rounded-lg p-3 text-sm font-bold focus:ring-0 focus:border-accent text-white placeholder:text-white/20"
                                placeholder="e.g. Game Tip-off"
                                type="text"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5 gold-glow">
                            <label className="text-[10px] font-black uppercase text-white/60 px-1">Details (Required)</label>
                            <textarea
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                className="bg-black/20 border border-white/10 rounded-lg p-3 text-sm font-bold focus:ring-0 focus:border-accent text-white placeholder:text-white/20"
                                placeholder="e.g. Section 112, Entrance B."
                                rows="2"
                            ></textarea>
                        </div>
                        <div className="flex flex-col gap-1.5 gold-glow">
                            <label className="text-[10px] font-black uppercase text-white/60 px-1">Location Link (Optional)</label>
                            <div className="flex items-stretch rounded-lg bg-black/20 border border-white/10 overflow-hidden">
                                <div className="flex items-center px-3 bg-primary/20 border-r border-white/10">
                                    <span className="material-symbols-outlined text-accent text-xl">map</span>
                                </div>
                                <input
                                    value={mapLink}
                                    onChange={(e) => setMapLink(e.target.value)}
                                    className="flex-1 bg-transparent border-0 text-white p-3 text-sm font-bold focus:ring-0 placeholder:text-white/20"
                                    placeholder="Paste Google Maps URL"
                                    type="text"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 mt-4">
                            {editingIndex !== null ? (
                                <div className="flex gap-3 w-full">
                                    {/* CANCEL BUTTON */}
                                    <button
                                        onClick={handleCancelEdit}
                                        className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-widest text-[10px]"
                                    >
                                        <span className="material-symbols-outlined text-sm">close</span>
                                        CANCEL
                                    </button>

                                    {/* UPDATE BUTTON */}
                                    <button
                                        onClick={handleSave}
                                        className="flex-[2] bg-[#FDB927] text-[#552583] py-4 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-[0.98] transition-all shadow-[0_4px_0_#b8861b] flex items-center justify-center gap-2"
                                    >
                                        UPDATE EVENT
                                        <span className="material-symbols-outlined text-sm">update</span>
                                    </button>
                                </div>
                            ) : (
                                /* PRIMARY ADD BUTTON */
                                <button
                                    onClick={handleSave}
                                    className="w-full bg-[#FDB927] text-[#552583] py-4 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-[0.98] transition-all shadow-[0_4px_0_#b8861b] flex items-center justify-center gap-2"
                                >
                                    ADD TO SCHEDULE
                                    <span className="material-symbols-outlined text-sm">celebration</span>
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                {/* Existing Plans */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-white text-lg font-black uppercase tracking-tight">Existing Plans</h3>
                        <span className="text-[10px] font-black text-accent px-2 py-0.5 border border-accent/30 rounded-full bg-accent/5">{dayData.events.length} EVENTS</span>
                    </div>
                    {dayData.events.map((event, index) => (
                        <div key={index} className="group relative bg-[#2b2533] border border-white/10 rounded-xl p-4 flex gap-4 transition-all hover:border-accent/40 shadow-lg">
                            <div className="flex flex-col items-center justify-start pt-1 border-r border-white/10 pr-4 min-w-[75px]">
                                <span className="text-accent font-black text-sm">{event.time}</span>
                                <span className="text-[9px] uppercase font-black text-white/40">TIME</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-black text-white text-base">{event.title}</h4>
                                <p className="text-white/60 text-xs font-medium line-clamp-2 mt-1">{event.description}</p>
                            </div>
                            <div className="flex flex-col gap-4">
                                <button onClick={() => handleEdit(index)} className={`size-8 rounded-full flex items-center justify-center text-white/40 hover:text-accent hover:bg-accent/10 transition-colors ${editingIndex === index ? 'text-accent bg-accent/10' : ''}`}>
                                    <span className="material-symbols-outlined text-lg">edit</span>
                                </button>
                                <button onClick={() => handleDelete(index)} className="size-8 rounded-full flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                    {dayData.events.length === 0 && (
                        <p className="text-white/30 text-center text-sm italic py-4">No events scheduled.</p>
                    )}
                </section>
            </main>

            <BottomNav />
        </div>
    );
}
