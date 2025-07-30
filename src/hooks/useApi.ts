// Hook personalizzato per gestire gli stati delle chiamate API
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  showErrorToast?: boolean;
  showSuccessToast?: boolean;
  successMessage?: string;
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  deps: any[] = [],
  options: UseApiOptions = {}
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });
  
  const { toast } = useToast();

  const execute = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await apiCall();
      setState({ data: result, loading: false, error: null });
      
      if (options.showSuccessToast && options.successMessage) {
        toast({
          title: "Successo",
          description: options.successMessage,
        });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      setState({ data: null, loading: false, error: errorMessage });
      
      if (options.showErrorToast !== false) {
        toast({
          title: "Errore",
          description: errorMessage,
          variant: "destructive",
        });
      }
      
      throw error;
    }
  };

  useEffect(() => {
    execute();
  }, deps);

  return {
    ...state,
    refetch: execute,
  };
}

// Hook per mutazioni (POST, PUT, DELETE)
export function useMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseApiOptions & {
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const [state, setState] = useState<UseApiState<TData>>({
    data: null,
    loading: false,
    error: null,
  });
  
  const { toast } = useToast();

  const mutate = async (variables: TVariables) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await mutationFn(variables);
      setState({ data: result, loading: false, error: null });
      
      if (options.showSuccessToast && options.successMessage) {
        toast({
          title: "Successo",
          description: options.successMessage,
        });
      }
      
      options.onSuccess?.(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      setState({ data: null, loading: false, error: errorMessage });
      
      if (options.showErrorToast !== false) {
        toast({
          title: "Errore",
          description: errorMessage,
          variant: "destructive",
        });
      }
      
      options.onError?.(error as Error);
      throw error;
    }
  };

  return {
    ...state,
    mutate,
  };
}