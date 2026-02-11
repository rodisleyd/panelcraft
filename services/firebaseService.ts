
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, onDisconnect, serverTimestamp, off } from 'firebase/database';
import { ScriptData } from '../types';

const firebaseConfig = {
    apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || '',
    authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || '',
    databaseURL: (import.meta as any).env?.VITE_FIREBASE_DATABASE_URL || '',
    projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || ''
};

const app = firebaseConfig.apiKey ? initializeApp(firebaseConfig) : null;
export const db = app ? getDatabase(app) : null;

let currentRoomId: string | null = null;

export const joinRoom = (
    roomId: string,
    userId: string,
    userName: string,
    onUpdate: (data: any) => void,
    onPresence: (users: any[]) => void
) => {
    if (!db) return;

    currentRoomId = roomId;
    const scriptRef = ref(db, `rooms/${roomId}/script`);
    const presenceRef = ref(db, `rooms/${roomId}/presence`);
    const myPresenceRef = ref(db, `rooms/${roomId}/presence/${userId}`);

    // Ouve mudanças no roteiro
    onValue(scriptRef, (snapshot) => {
        const data = snapshot.val();
        if (data) onUpdate(data);
    });

    // Gerencia Presença
    const connectedRef = ref(db, '.info/connected');
    onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
            set(myPresenceRef, {
                id: userId,
                name: userName,
                color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
                lastActive: serverTimestamp(),
                isTyping: false
            });
            onDisconnect(myPresenceRef).remove();
        }
    });

    // Ouve quem está online
    onValue(presenceRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            onPresence(Object.values(data));
        } else {
            onPresence([]);
        }
    });
};

export const updatePresence = (roomId: string, userId: string, data: any) => {
    if (!db) return;
    const myPresenceRef = ref(db, `rooms/${roomId}/presence/${userId}`);
    // Usamos set com as informações completas para garantir consistência
    set(myPresenceRef, {
        ...data,
        lastActive: serverTimestamp()
    });
};

export const broadcastUpdate = (data: Partial<ScriptData>) => {
    if (!db || !currentRoomId) return;
    const scriptRef = ref(db, `rooms/${currentRoomId}/script`);
    set(scriptRef, data);
};

export const leaveRoom = (userId?: string) => {
    if (!db || !currentRoomId) return;

    const scriptRef = ref(db, `rooms/${currentRoomId}/script`);
    const presenceRef = ref(db, `rooms/${currentRoomId}/presence`);

    off(scriptRef);
    off(presenceRef);

    if (userId) {
        const myPresenceRef = ref(db, `rooms/${currentRoomId}/presence/${userId}`);
        set(myPresenceRef, null);
    }

    currentRoomId = null;
};
