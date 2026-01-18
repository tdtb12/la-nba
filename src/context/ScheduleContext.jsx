import { createContext, useContext, useEffect, useState } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthContext";
import itineraryData from "../data/itinerary.json";

const ScheduleContext = createContext();

export function useSchedule() {
    return useContext(ScheduleContext);
}

export function ScheduleProvider({ children }) {
    const { currentUser } = useAuth();
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);

    // Initial load from localStorage
    useEffect(() => {
        const cached = localStorage.getItem("cached_schedule");
        if (cached) {
            setSchedule(JSON.parse(cached));
            setLoading(false);
        } else {
            // Fallback to static JSON if no cache
            setSchedule(itineraryData);
            setLoading(false);
        }
    }, []);

    // Sync with Firestore when user logs in
    useEffect(() => {
        if (!currentUser) return;

        async function fetchSchedule() {
            try {
                const querySnapshot = await getDocs(collection(db, "itinerary"));
                if (!querySnapshot.empty) {
                    const firestoreData = querySnapshot.docs.map(doc => ({
                        id: parseInt(doc.id),
                        ...doc.data()
                    }));

                    // Sort by ID to ensure order
                    firestoreData.sort((a, b) => a.id - b.id);

                    setSchedule(firestoreData);
                    localStorage.setItem("cached_schedule", JSON.stringify(firestoreData));
                } else {
                    // First time: Firestore is empty, use static data but don't write yet
                    // Only write when user edits
                }
            } catch (error) {
                console.error("Error fetching schedule:", error);
            }
        }

        fetchSchedule();
    }, [currentUser]);

    const getDay = (id) => {
        return schedule.find(day => day.id === parseInt(id));
    };

    const updateDay = async (updatedDay) => {
        // Optimistic update
        const newSchedule = schedule.map(day =>
            day.id === updatedDay.id ? updatedDay : day
        );
        setSchedule(newSchedule);
        localStorage.setItem("cached_schedule", JSON.stringify(newSchedule));

        if (currentUser) {
            try {
                await setDoc(doc(db, "itinerary", updatedDay.id.toString()), updatedDay);
            } catch (error) {
                console.error("Error updating day in Firestore:", error);
                // Revert? For now, we assume simple retry or conflict isn't distinct
            }
        }
    };

    const addEvent = (dayId, event) => {
        const day = getDay(dayId);
        if (!day) return;

        const updatedEvents = [...day.events, event];
        // Sort events by time
        updatedEvents.sort((a, b) => a.time.localeCompare(b.time));

        const updatedDay = {
            ...day,
            events: updatedEvents
        };

        updateDay(updatedDay);
    };

    const updateEvent = (dayId, eventIndex, updatedEvent) => {
        const day = getDay(dayId);
        if (!day) return;

        const updatedEvents = [...day.events];
        updatedEvents[eventIndex] = updatedEvent;
        // Sort events by time again in case time changed
        updatedEvents.sort((a, b) => a.time.localeCompare(b.time));

        const updatedDay = {
            ...day,
            events: updatedEvents
        };

        updateDay(updatedDay);
    };

    const deleteEvent = (dayId, eventIndex) => {
        const day = getDay(dayId);
        if (!day) return;

        const updatedEvents = day.events.filter((_, index) => index !== eventIndex);
        const updatedDay = {
            ...day,
            events: updatedEvents
        };

        updateDay(updatedDay);
    };

    // One-time sync: Uploads current state (which might be the JSON fallback) to Firestore
    const syncToFirestore = async () => {
        if (!currentUser) {
            alert("You must be logged in to sync.");
            return;
        }

        try {
            const batch = writeBatch(db);
            schedule.forEach(day => {
                const docRef = doc(db, "itinerary", day.id.toString());
                batch.set(docRef, day);
            });
            await batch.commit();
            alert("Successfully synced schedule to cloud!");

            // Re-cache specific to cloud confirmation if we wanted, but local state is already consistent
        } catch (error) {
            console.error("Error syncing to Firestore:", error);
            alert("Failed to sync. Check console.");
        }
    };

    const value = {
        schedule,
        getDay,
        addEvent,
        updateEvent,
        deleteEvent,
        syncToFirestore,
        loading
    };

    return (
        <ScheduleContext.Provider value={value}>
            {children}
        </ScheduleContext.Provider>
    );
}
