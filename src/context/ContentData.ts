import { createContext } from "react";

export const contentData = createContext({
  contents: [],
  questions: [],
  resources: [],
  isLoading: false,
  tokenBalance: "0",
  uploadContent: (content: any, topicId?: string) => {},
  sendTip: (userAddress: string, amount: number): Promise<any> =>
    Promise.resolve(),
});
