import React, { useContext, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Send } from "lucide-react";
import { userWalletContext } from "@/context/userWalletContext";
import { format } from "date-fns";
import { useParams } from "react-router-dom";
import { MessageContext } from "@/context/messageContext";
import { s } from "node_modules/pinata/dist/gateway-tools-l9hk7kz4";

const MessagesPage: React.FC = () => {
  const [messageInput, setMessageInput] = useState<string>("");
  const { accountId, userProfile } = useContext(userWalletContext);
  const { userId } = useParams();
  const {
    activeConversation,
    conversations,
    messages,
    newMessage,
    allProfiles,
    handleConversationClick,
    handleSendMessage: sendMessage,
    initializeConversation,
    checkExistingConversations,
  } = useContext(MessageContext);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (userId) {
      checkExistingConversations(userId);
    } else {
      checkExistingConversations();
    }
  }, [userId, checkExistingConversations]);

  const handleSendMessage = async () => {
    if (messageInput.trim() === "") return;
    setIsLoading(true);
    await sendMessage(messageInput);
    setMessageInput(""); // Clear the input field after sending
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Conversations List */}
        <Card className="md:col-span-1 h-[calc(80vh-2rem)] flex flex-col">
          <CardHeader className="px-4 py-3">
            <CardTitle>Conversations</CardTitle>
            <CardDescription>Your recent messages</CardDescription>
          </CardHeader>
          <div className="px-4 py-2">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">
                  All
                </TabsTrigger>
                <TabsTrigger value="unread" className="flex-1">
                  Unread
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-2 p-0">
                <ScrollArea className="h-[calc(80vh-16rem)]" type="always">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation?.conversation_id}
                      className="cursor-pointer"
                    >
                      <div
                        className={`flex items-center gap-3 p-3 mb-1 hover:bg-muted transition-colors ${
                          activeConversation === conversation?.conversation_id
                            ? "bg-accent"
                            : ""
                        }`}
                        onClick={() =>
                          handleConversationClick(conversation?.conversation_id)
                        }
                      >
                        <div className="relative">
                          <Avatar>
                            <AvatarFallback>
                              {conversation?.partner?.full_name.charAt(0)}
                            </AvatarFallback>
                            {conversation?.partner?.profile_image_url && (
                              <AvatarImage
                                src={conversation?.partner?.profile_image_url}
                              />
                            )}
                          </Avatar>
                          {/* <span
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${
                              conversation?.partner?.status === "online"
                                ? "bg-green-500"
                                : "bg-gray-400"
                            }`}
                          /> */}
                        </div>
                        <div className="flex-1">
                          <div className="flex-col justify-between">
                            <p className="font-medium">
                              {conversation?.partner?.full_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(
                                new Date(conversation?.created_at),
                                "MMM dd, yyyy"
                              )}
                            </p>
                          </div>
                          <p className="text-sm truncate text-muted-foreground">
                            {conversation?.lastMessage?.content}
                          </p>
                        </div>
                      </div>
                      <Separator />
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>
              <TabsContent value="unread" className="mt-2 p-0">
                <ScrollArea className="h-[calc(80vh-16rem)]" type="always">
                  {allProfiles.map((profile) => (
                    <div key={profile?.id} className="cursor-pointer">
                      <div
                        className={`flex items-center gap-3 p-3 mb-1 hover:bg-muted transition-colors ${
                          activeConversation === profile?.conversation_id
                            ? "bg-accent"
                            : ""
                        }`}
                        onClick={() =>
                          handleConversationClick(profile?.conversation_id)
                        }
                      >
                        <div className="relative">
                          <Avatar>
                            <AvatarFallback>
                              {profile?.full_name.charAt(0)}
                            </AvatarFallback>
                            {profile?.profile_image_url && (
                              <AvatarImage src={profile?.profile_image_url} />
                            )}
                          </Avatar>
                          {/* <span
                              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${
                                conversation?.partner?.status === "online"
                                  ? "bg-green-500"
                                  : "bg-gray-400"
                              }`}
                            /> */}
                        </div>
                        <div className="flex-1">
                          <div className="flex-col justify-between">
                            <p className="font-medium">{profile?.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(
                                new Date(profile?.created_at),
                                "MMM dd, yyyy"
                              )}
                            </p>
                          </div>
                          <p className="text-sm truncate text-muted-foreground">
                            {profile?.lastMessage?.content}
                          </p>
                        </div>
                      </div>
                      <Separator />
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </Card>

        {/* Chat Area */}
        <Card className="md:col-span-2 lg:col-span-3 h-[calc(80vh-2rem)] flex flex-col">
          {activeConversation ? (
            <>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {conversations
                        .find((c) => c?.conversation_id === activeConversation)
                        ?.partner?.full_name.charAt(0)}
                    </AvatarFallback>
                    {conversations.find(
                      (c) => c?.conversation_id === activeConversation
                    )?.partner?.profile_image_url && (
                      <AvatarImage
                        src={
                          conversations.find(
                            (c) => c?.conversation_id === activeConversation
                          )?.partner?.profile_image_url
                        }
                      />
                    )}
                  </Avatar>
                  <div>
                    <CardTitle>
                      {conversations.find(
                        (c) => c.conversation_id === activeConversation
                      )?.partner?.full_name || "Unknown User"}
                    </CardTitle>
                    <CardDescription>
                      {`@${
                        conversations.find(
                          (c) => c.conversation_id === activeConversation
                        )?.partner?.account_id
                      }`}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="flex-1 overflow-auto p-4">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          message?.data?.sender?.account_id === accountId
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`flex gap-2 max-w-[75%] ${
                            message?.data?.sender === accountId
                              ? "flex-row-reverse"
                              : ""
                          }`}
                        >
                          {message?.data?.sender?.account_id !== accountId && (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {message?.data?.sender?.full_name.charAt(0)}
                              </AvatarFallback>
                              {message?.data?.sender?.profile_image_url && (
                                <AvatarImage
                                  src={
                                    message?.data?.sender?.profile_image_url
                                  }
                                />
                              )}
                            </Avatar>
                          )}
                          <div>
                            <div
                              className={`rounded-lg p-3 ${
                                message?.data?.sender?.account_id === accountId
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              } ${message?.isLoading ? "opacity-60" : ""}`}
                            >
                              <p className="text-sm whitespace-pre-wrap">
                                {message?.data?.content}
                              </p>
                              {message?.isLoading && (
                                <div className="flex items-center gap-1 mt-1">
                                  <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full"></div>
                                  <span className="text-xs opacity-70">
                                    Sending...
                                  </span>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {message?.isLoading
                                ? "Sending..."
                                : format(message?.data?.timestamp, "hh:mm a")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
              <Separator />
              <CardFooter className="p-3">
                <div className="flex w-full items-center gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </>
          ) : (
            <>
              {newMessage ? (
                <div className="flex flex-col items-center justify-center h-full p-4">
                  <p>This is your first time messaging this user:</p>
                  <p className="font-medium">{newMessage?.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    @{newMessage?.account_id}
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() =>
                      initializeConversation(newMessage?.account_id)
                    }
                  >
                    Start Conversation
                  </Button>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <h3 className="text-lg font-medium">
                      No conversation selected
                    </h3>
                    <p className="text-muted-foreground">
                      Choose a conversation from the list to start messaging
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MessagesPage;
