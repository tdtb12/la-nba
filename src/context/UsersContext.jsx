import { createContext, useContext, useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthContext";

const UsersContext = createContext();

export function useUsers() {
    return useContext(UsersContext);
}

export function UsersProvider({ children }) {
    const { currentUser } = useAuth(); // If we want to only fetch when logged in
    const [users, setUsers] = useState({});
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUsers() {
            if (!currentUser) return; // Wait for auth

            try {
                const querySnapshot = await getDocs(collection(db, "users"));
                const uList = [];
                const uMap = {};

                querySnapshot.forEach((doc) => {
                    const userData = { id: doc.id, ...doc.data() };
                    uList.push(userData);
                    uMap[doc.id] = userData;
                });

                setUsers(uMap);
                setUsersList(uList);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchUsers();
    }, [currentUser]); // Re-fetch if auth state changes from null to user (login)

    const value = {
        users,      // Map: { uid: userData } for O(1) lookups
        usersList,  // Array: [userData] for mapping
        loading
    };

    return (
        <UsersContext.Provider value={value}>
            {children}
        </UsersContext.Provider>
    );
}
