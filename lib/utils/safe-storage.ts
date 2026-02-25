/**
 * Safe Storage Utilities
 * 
 * Safely handles localStorage and sessionStorage operations,
 * providing graceful fallbacks when access is denied (e.g. Safari Private Mode).
 */

type StorageType = 'localStorage' | 'sessionStorage';

const isStorageAvailable = (type: StorageType): boolean => {
    try {
        const storage = window[type];
        const x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    } catch (e) {
        return false;
    }
};

const safeStorage = {
    getItem: (type: StorageType, key: string, defaultValue: string | null = null): string | null => {
        try {
            if (typeof window === 'undefined') return defaultValue;
            return window[type].getItem(key) ?? defaultValue;
        } catch (error) {
            console.warn(`[SafeStorage] Error getting ${key} from ${type}:`, error);
            return defaultValue;
        }
    },

    setItem: (type: StorageType, key: string, value: string): boolean => {
        try {
            if (typeof window === 'undefined') return false;
            window[type].setItem(key, value);
            return true;
        } catch (error) {
            console.warn(`[SafeStorage] Error setting ${key} in ${type}:`, error);
            return false;
        }
    },

    removeItem: (type: StorageType, key: string): boolean => {
        try {
            if (typeof window === 'undefined') return false;
            window[type].removeItem(key);
            return true;
        } catch (error) {
            console.warn(`[SafeStorage] Error removing ${key} from ${type}:`, error);
            return false;
        }
    },

    clear: (type: StorageType): boolean => {
        try {
            if (typeof window === 'undefined') return false;
            window[type].clear();
            return true;
        } catch (error) {
            console.warn(`[SafeStorage] Error clearing ${type}:`, error);
            return false;
        }
    }
};

/**
 * Convenience wrappers for localStorage
 */
export const localToken = {
    get: (key: string, defaultValue: string | null = null) => safeStorage.getItem('localStorage', key, defaultValue),
    set: (key: string, value: string) => safeStorage.setItem('localStorage', key, value),
    remove: (key: string) => safeStorage.removeItem('localStorage', key),
    clear: () => safeStorage.clear('localStorage'),
};

/**
 * Convenience wrappers for sessionStorage
 */
export const sessionToken = {
    get: (key: string, defaultValue: string | null = null) => safeStorage.getItem('sessionStorage', key, defaultValue),
    set: (key: string, value: string) => safeStorage.setItem('sessionStorage', key, value),
    remove: (key: string) => safeStorage.removeItem('sessionStorage', key),
    clear: () => safeStorage.clear('sessionStorage'),
};

export default safeStorage;
