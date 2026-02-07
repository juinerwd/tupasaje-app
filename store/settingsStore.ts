import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SettingsState {
    biometricsEnabled: boolean;
    setBiometricsEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            biometricsEnabled: false,
            setBiometricsEnabled: (enabled: boolean) => set({ biometricsEnabled: enabled }),
        }),
        {
            name: 'tupasaje-settings',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
