import { createContext, useContext } from 'react';

const AuthAvailabilityContext = createContext(false);

export const AuthAvailabilityProvider = AuthAvailabilityContext.Provider;

export function useAuthAvailable() {
  return useContext(AuthAvailabilityContext);
}
