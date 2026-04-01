import { useQuery } from "@tanstack/react-query";
import { requestPython } from "@/services/api";
import { toast } from "react-hot-toast";
import { useRouter } from "next/router";
import useAuthError from "@/hooks/useAuthError";

const useGetQuery = ({
  key = "get-all",
  url = "/",
  params = {},
  headers = {},
  showSuccessMsg = false,
  showErrorMsg = false,
  enabled = true,
  redirectOn403 = true,
  redirectOn500 = true,
  apiClient = requestPython,
}) => {
  const router = useRouter();
  const { setUnauthorized, setForbidden } = useAuthError();

  const { isPending, isError, data, error, isFetching } = useQuery({
    queryKey: [key, params],
    queryFn: () =>
      apiClient.get(url, {
        params,
        headers,
      }),
    placeholderData: (previousData) => previousData, // Replaces keepPreviousData
    enabled,
  });

  // Handle success
  if (data && showSuccessMsg) {
    toast.success("SUCCESS");
  }

  // Handle errors
  if (error) {
    const status = error?.response?.status;

    // 🔴 401
    if (status === 401) {
      setUnauthorized();
    }
    // 🔴 403
    else if (status === 403 && redirectOn403) {
      setForbidden();
    }
    // 🔴 500
    else if (status >= 500 && redirectOn500) {
      router.replace("/500");
    } else if (showErrorMsg) {
      toast.error(error?.response?.data?.message || "Ошибка запроса");
    }
  }

  return {
    isLoading: isPending,
    isError,
    data,
    error,
    isFetching,
    status: error?.response?.status, // Add status code
  };
};

export default useGetQuery;
