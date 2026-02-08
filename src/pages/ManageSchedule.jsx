import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useSchedule } from "../context/ScheduleContext";
import BottomNav from "../components/BottomNav";
import {
    Clock,
    Type,
    AlignLeft,
    Image as ImageIcon,
    Link as LinkIcon,
    MapPin,
    Plus,
    X,
    Edit3,
    Trash2,
    Loader2
} from 'lucide-react';
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function ManageSchedule() {
    const { dayId } = useParams();
    const navigate = useNavigate();
    const { getDay, addEvent, updateEvent, deleteEvent, schedule, syncToFirestore } = useSchedule();
    const [dayData, setDayData] = useState(null);
    const [editingIndex, setEditingIndex] = useState(null);

    const scrollContainerRef = useRef(null);


    // Drag to scroll state
    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);

    const handleMouseDown = (e) => {
        isDragging.current = true;
        startX.current = e.pageX - scrollContainerRef.current.offsetLeft;
        scrollLeft.current = scrollContainerRef.current.scrollLeft;
        scrollContainerRef.current.style.cursor = 'grabbing';
        scrollContainerRef.current.style.userSelect = 'none';
    };

    const handleMouseLeave = () => {
        isDragging.current = false;
        if (scrollContainerRef.current) {
            scrollContainerRef.current.style.cursor = 'grab';
            scrollContainerRef.current.style.removeProperty('user-select');
        }
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        if (scrollContainerRef.current) {
            scrollContainerRef.current.style.cursor = 'grab';
            scrollContainerRef.current.style.removeProperty('user-select');
        }
    };

    const handleMouseMove = (e) => {
        if (!isDragging.current) return;
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startX.current) * 2; // Scroll-fast
        scrollContainerRef.current.scrollLeft = scrollLeft.current - walk;
    };

    // Auto-scroll to active day
    useEffect(() => {
        if (scrollContainerRef.current && dayId) {
            const activeBtn = scrollContainerRef.current.querySelector(`[data-day-id="${dayId}"]`);
            if (activeBtn) {
                activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [dayId, schedule]);

    // Form inputs
    const [when, setWhen] = useState("");
    const [what, setWhat] = useState("");
    const [details, setDetails] = useState("");
    const [mapLink, setMapLink] = useState("");
    const [icon, setIcon] = useState("calendar_today"); // Default icon

    // New fields for attachments/resources
    const [resourceLink, setResourceLink] = useState("");
    const [images, setImages] = useState([]);
    const [currentImageUrl, setCurrentImageUrl] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const day = getDay(dayId);
        if (day) {
            setDayData(day);
        }
    }, [dayId, schedule]);

    const handleAddImage = () => {
        if (!currentImageUrl.trim()) return;
        setImages([...images, { type: 'url', value: currentImageUrl.trim(), preview: currentImageUrl.trim() }]);
        setCurrentImageUrl("");
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const previewUrl = URL.createObjectURL(file);
        setImages([...images, { type: 'file', value: file, preview: previewUrl }]);
    };



    const handleRemoveImage = (index) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!when || !what || !details) {
            alert("Please fill in all required fields (When, What, Details)");
            return;
        }

        setIsUploading(true);

        try {
            // Process images: upload files, keep URLs
            const processedImages = await Promise.all(images.map(async (img) => {
                if (img.type === 'file') {
                    const storageRef = ref(storage, `schedule_images/${Date.now()}_${img.value.name}`);
                    await uploadBytes(storageRef, img.value);
                    const downloadURL = await getDownloadURL(storageRef);
                    return downloadURL;
                }
                return img.value;
            }));

            const eventData = {
                time: when,
                title: what,
                description: details,
                location: what,
                mapLink: mapLink,
                icon: icon,
                resourceLink: resourceLink,
                images: processedImages
            };

            if (editingIndex !== null) {
                updateEvent(dayId, editingIndex, eventData);
            } else {
                addEvent(dayId, eventData);
            }

            // Reset form
            handleCancelEdit();
        } catch (error) {
            console.error("Error saving event:", error);
            alert("Failed to save event. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleEdit = (index) => {
        const event = dayData.events[index];
        setWhen(event.time);
        setWhat(event.title);
        setDetails(event.description);
        setMapLink(event.mapLink || "");
        setIcon(event.icon || "calendar_today");
        setResourceLink(event.resourceLink || "");

        // Convert existing string URLs to image objects
        const existingImages = (event.images || []).map(url => ({
            type: 'url',
            value: url,
            preview: url
        }));
        setImages(existingImages);

        setEditingIndex(index);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setWhen("");
        setWhat("");
        setDetails("");
        setMapLink("");
        setIcon("calendar_today");
        setResourceLink("");
        setImages([]);
        setCurrentImageUrl("");
        setIsUploading(false);
        setEditingIndex(null);
    };

    const handleDelete = (index) => {
        if (window.confirm("Are you sure you want to delete this event?")) {
            deleteEvent(dayId, index);
        }
    };

    if (!dayData) return <div className="text-white text-center pt-20">Loading Day {dayId}...</div>;

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return `${months[parseInt(parts[1]) - 1]} ${parseInt(parts[2])}`;
        }
        return dateStr;
    };

    return (
        <div className="min-h-screen bg-[#0F0F0F] text-white font-sans pb-32 overflow-x-hidden w-full max-w-[430px] mx-auto">
            {/* 1. HEADER */}
            <header className="p-6 text-center border-b border-white/5 sticky top-0 bg-[#0F0F0F]/90 backdrop-blur-md z-40 flex items-center justify-between">
                <button onClick={() => navigate(`/day/${dayId}`)} className="text-[#FDB927] flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-white/5 cursor-pointer">
                    <span className="sr-only">Back</span>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <h1 className="text-sm font-[900] uppercase tracking-widest italic text-[#FDB927] flex-1 text-center">Manage Schedule</h1>
                <div className="flex w-10 items-center justify-end">
                    <button onClick={syncToFirestore} className="flex items-center justify-center size-10 rounded-full hover:bg-white/5" title="Sync to Cloud">
                        <span className="sr-only">Sync</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FDB927" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M12 12v9" /><path d="m16 16-4-4-4 4" /></svg>
                    </button>
                </div>
            </header>

            {/* 2. DAY PICKER */}
            <div
                ref={scrollContainerRef}
                className="flex overflow-x-auto custom-scrollbar px-4 gap-4 border-b border-white/5 pb-4 pt-2 snap-x cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
            >
                {schedule.map((d) => (
                    <button
                        key={d.id}
                        data-day-id={d.id}
                        onClick={() => navigate(`/manage/${d.id}`)}
                        className={`flex flex-col items-center justify-center border-b-4 pb-3 pt-2 shrink-0 min-w-[60px] snap-center transition-colors ${d.id === parseInt(dayId) ? 'border-[#FDB927] text-[#FDB927]' : 'border-transparent text-white/40'}`}
                    >
                        <p className="text-xs font-black uppercase italic">Day {d.id}</p>
                        <p className="text-[10px] font-bold opacity-70 italic">{formatDate(d.date)}</p>
                    </button>
                ))}
            </div>

            <main className="p-5 space-y-8">
                {/* 3. INPUT FORM */}
                <section className="space-y-6">
                    {/* WHEN */}
                    <div className="flex flex-col">
                        <label className="font-black italic text-[11px] uppercase tracking-[0.15em] text-[#888888] mb-3 px-4 font-lakers">WHEN?</label>
                        <div className="relative">
                            <input
                                value={when}
                                onChange={(e) => setWhen(e.target.value)}
                                className="w-full bg-[#1A1A1A] border-0 rounded-[32px] py-4 px-6 text-white font-bold focus:ring-2 focus:ring-[#FDB927]/50 placeholder:text-white/20"
                                type="time"
                                placeholder="7:00 PM"
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[#FDB927] pointer-events-none">
                                <Clock size={24} />
                            </div>
                        </div>
                    </div>

                    {/* WHAT */}
                    <div className="flex flex-col">
                        <label className="font-black italic text-[11px] uppercase tracking-[0.15em] text-[#888888] mb-3 px-4 font-lakers">WHAT ARE WE DOING?</label>
                        <input
                            value={what}
                            onChange={(e) => setWhat(e.target.value)}
                            className="w-full bg-[#1A1A1A] border-0 rounded-[32px] py-4 px-6 text-white font-bold focus:ring-2 focus:ring-[#FDB927]/50 placeholder:text-white/20"
                            type="text"
                            placeholder="Evening Game"
                        />
                    </div>

                    {/* DETAILS */}
                    <div className="flex flex-col">
                        <label className="font-black italic text-[11px] uppercase tracking-[0.15em] text-[#888888] mb-3 px-4 font-lakers">DETAILS</label>
                        <textarea
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            className="w-full bg-[#1A1A1A] border-0 rounded-[32px] py-4 px-6 text-white font-bold focus:ring-2 focus:ring-[#FDB927]/50 placeholder:text-white/20 resize-none"
                            rows="3"
                            placeholder="Arena visit. Tip-off is at 7:30, arriving early for warmups."
                        ></textarea>
                    </div>

                    {/* MEDIA */}
                    <div className="space-y-3">
                        <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] italic ml-4 flex items-center gap-2">
                            <ImageIcon size={12} /> Media (QR Codes / Maps)
                        </label>

                        {/* URL INPUT */}
                        <div className="relative">
                            <input
                                value={currentImageUrl}
                                onChange={(e) => setCurrentImageUrl(e.target.value)}
                                className="w-full bg-[#1A1A1A] border-0 rounded-[32px] py-4 px-6 text-white font-bold focus:ring-2 focus:ring-[#FDB927]/50 placeholder:text-white/20 pr-16"
                                placeholder="Paste Image URL or Ticket Link"
                                type="text"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddImage();
                                    }
                                }}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <button
                                    onClick={handleAddImage}
                                    className="bg-[#FDB927]/10 p-2 rounded-full text-[#FDB927] hover:bg-[#FDB927]/20 transition-colors"
                                >
                                    <ImageIcon size={20} />
                                </button>
                            </div>
                        </div>

                        {/* IMAGE LIST & UPLOAD */}
                        <div className="flex gap-3 overflow-x-auto no-scrollbar px-1">
                            <label className={`w-20 h-20 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-1 text-white/20 hover:text-[#FDB927] hover:border-[#FDB927] transition-all cursor-pointer`}>
                                <Plus size={20} />
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                            </label>
                            {images.map((img, i) => (
                                <div key={i} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-white/10 shrink-0 group">
                                    <img src={img.preview} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all" />
                                    <button
                                        onClick={() => handleRemoveImage(i)}
                                        className="absolute top-1 right-1 bg-[#552583] p-1 rounded-full text-[#FDB927] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* LOCATION LINK */}
                    <div className="flex flex-col">
                        <label className="font-black italic text-[11px] uppercase tracking-[0.15em] text-[#888888] mb-3 px-4 font-lakers">LOCATION LINK</label>
                        <div className="relative">
                            <input
                                value={mapLink}
                                onChange={(e) => setMapLink(e.target.value)}
                                className="w-full bg-[#1A1A1A] border-0 rounded-[32px] py-4 px-6 text-white font-bold focus:ring-2 focus:ring-[#FDB927]/50 placeholder:text-white/20"
                                placeholder="Paste Google Maps URL"
                                type="text"
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[#FDB927] pointer-events-none">
                                <MapPin size={24} />
                            </div>
                        </div>
                    </div>

                    {/* ADDITIONAL INFO LINK */}
                    <div className="flex flex-col">
                        <label className="font-black italic text-[11px] uppercase tracking-[0.15em] text-[#888888] mb-3 px-4 font-lakers">ADDITIONAL INFO LINK</label>
                        <div className="relative">
                            <input
                                value={resourceLink}
                                onChange={(e) => setResourceLink(e.target.value)}
                                className="w-full bg-[#1A1A1A] border-0 rounded-[32px] py-4 px-6 text-white font-bold focus:ring-2 focus:ring-[#FDB927]/50 placeholder:text-white/20"
                                placeholder="Enter external reference link"
                                type="text"
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[#FDB927] pointer-events-none">
                                <LinkIcon size={24} />
                            </div>
                        </div>
                    </div>

                    {/* BUTTONS */}
                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={handleCancelEdit}
                            disabled={isUploading}
                            className="flex-1 bg-white/5 text-white/40 py-5 rounded-[28px] font-[900] italic text-xs uppercase tracking-[0.2em] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isUploading}
                            className="flex-[2] bg-[#FDB927] text-[#552583] py-5 rounded-[28px] font-[900] italic text-xs uppercase tracking-[0.25em] shadow-[0_6px_0_#b8861b] active:translate-y-[2px] active:shadow-[0_4px_0_#b8861b] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    SAVING...
                                </>
                            ) : (
                                "Update Schedule"
                            )}
                        </button>
                    </div>
                </section>

                {/* 4. EXISTING PLANS */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest italic ml-4">Existing Plans</h3>
                        <span className="text-[10px] font-black text-[#FDB927] px-2 py-0.5 border border-[#FDB927]/30 rounded-full bg-[#FDB927]/5">{dayData.events.length} PLANS</span>
                    </div>

                    <div className="space-y-3">
                        {dayData.events.map((event, index) => (
                            <div key={index} className={`bg-white/5 border border-white/10 p-5 rounded-[32px] flex items-center justify-between group transition-all ${editingIndex === index ? 'border-[#FDB927]/50 bg-[#FDB927]/5' : ''}`}>
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="bg-[#552583]/20 w-12 h-12 shrink-0 rounded-2xl flex flex-col items-center justify-center border border-[#552583]/30">
                                        <span className="text-[8px] font-black italic text-[#FDB927] leading-none uppercase">Plan</span>
                                        <span className="text-lg font-[900] italic text-white leading-none">{String(index + 1).padStart(2, '0')}</span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[#FDB927] text-[10px] font-black italic leading-none mb-1">{event.time}</p>
                                        <h4 className="font-black italic text-sm uppercase tracking-tighter leading-none truncate text-white">{event.title}</h4>
                                        <p className="text-white/40 text-[10px] font-bold mt-1 line-clamp-1 truncate">{event.description}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 ml-2">
                                    <button
                                        onClick={() => handleEdit(index)}
                                        className={`p-3 bg-white/5 rounded-xl text-white/40 hover:text-[#FDB927] transition-colors ${editingIndex === index ? 'text-[#FDB927] bg-[#FDB927]/10' : ''}`}
                                    >
                                        <Edit3 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(index)}
                                        className="p-3 bg-white/5 rounded-xl text-white/40 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {dayData.events.length === 0 && (
                            <p className="text-white/30 text-center text-sm italic py-4">No events scheduled.</p>
                        )}
                    </div>
                </section>
            </main>

            <BottomNav />
        </div >
    );
}
