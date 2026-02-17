import { useState, useEffect, useCallback } from "react";
import { isTokenAssociated } from "../client/tokenAssociation";

export const useTokenAssociation = (accountId) => {
  const [isAssociated, setIsAssociated] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const tokenId = import.meta.env.VITE_TOKEN_ID;

  const checkAssociation = useCallback(async () => {
    if (!accountId || !tokenId) {
      setIsAssociated(null);
      return;
    }

    setIsLoading(true);
    try {
      const associated = await isTokenAssociated(accountId, tokenId);
      setIsAssociated(associated);
    } catch (error) {
      console.error("Error checking token association:", error);
      setIsAssociated(false);
    } finally {
      setIsLoading(false);
    }
  }, [accountId, tokenId]);

  useEffect(() => {
    checkAssociation();
  }, [checkAssociation]);

  return {
    isAssociated,
    isLoading,
    refetch: checkAssociation,
  };
};
