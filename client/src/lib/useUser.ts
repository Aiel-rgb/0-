import { trpc } from "./trpc";

export function useUser() {
    const { data: user, isLoading, error } = trpc.auth.me.useQuery(undefined, {
        retry: false,
        refetchOnWindowFocus: false,
    });

    return {
        user,
        isLoading,
        error,
    };
}
