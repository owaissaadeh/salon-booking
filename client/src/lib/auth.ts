import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "./queryClient";

export interface AuthUser {
  id: number;
  username: string;
  role: string;
  name: string;
}

export function useAuth() {
  const { data: user, isLoading, isError } = useQuery<AuthUser>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
      window.location.href = "/admin/login";
    },
  });

  return {
    user: isError ? null : user,
    isLoading,
    isAuthenticated: !isError && !!user,
    logout: logoutMutation.mutate,
  };
}
