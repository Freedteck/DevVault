import React, { useState } from "react";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Send } from "lucide-react";

interface Message {
  id: string;
  sender: string;
  avatarUrl: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
}

interface Conversation {
  id: string;
  user: {
    name: string;
    avatarUrl: string;
    status: "online" | "offline";
    lastActive?: string;
  };
  lastMessage: {
    content: string;
    timestamp: string;
  };
  unread: number;
}

const MessagesPage: React.FC = () => {
  const [activeConversation, setActiveConversation] = useState<string | null>(
    "1"
  );
  const [messageInput, setMessageInput] = useState<string>("");

  // Mock data for conversations
  const conversations: Conversation[] = [
    {
      id: "1",
      user: {
        name: "John Doe",
        avatarUrl: "",
        status: "online",
      },
      lastMessage: {
        content: "Thanks for your help with the React issue!",
        timestamp: "5m ago",
      },
      unread: 2,
    },
    {
      id: "2",
      user: {
        name: "Alice Smith",
        avatarUrl: "",
        status: "offline",
        lastActive: "1h ago",
      },
      lastMessage: {
        content: "Could you check my PR when you get a chance?",
        timestamp: "2h ago",
      },
      unread: 0,
    },
    {
      id: "3",
      user: {
        name: "Bob Johnson",
        avatarUrl: "",
        status: "online",
      },
      lastMessage: {
        content: "I've sent you the documentation for the API",
        timestamp: "1d ago",
      },
      unread: 0,
    },
  ];

  // Mock data for messages in a conversation
  const messages: Message[] = [
    {
      id: "1",
      sender: "John Doe",
      avatarUrl: "",
      content: "Hey, I'm having trouble with a React component. Could you help?",
      timestamp: "Yesterday, 2:35 PM",
      isOwn: false,
    },
    {
      id: "2",
      sender: "You",
      avatarUrl: "",
      content:
        "Sure, what seems to be the issue? Are you getting any error messages?",
      timestamp: "Yesterday, 2:38 PM",
      isOwn: true,
    },
    {
      id: "3",
      sender: "John Doe",
      avatarUrl: "",
      content:
        "I'm trying to implement a custom hook for form validation, but it's not working as expected.",
      timestamp: "Yesterday, 2:40 PM",
      isOwn: false,
    },
    {
      id: "4",
      sender: "You",
      avatarUrl: "",
      content: "Could you share your code? Let me take a look at it.",
      timestamp: "Yesterday, 2:45 PM",
      isOwn: true,
    },
    {
      id: "5",
      sender: "John Doe",
      avatarUrl: "",
      content: "Here's the code snippet:\n```\nconst useFormValidation = (initialState, validate) => {\n  const [values, setValues] = useState(initialState);\n  const [errors, setErrors] = useState({});\n  \n  // ... rest of the implementation\n};\n```",
      timestamp: "Yesterday, 2:50 PM",
      isOwn: false,
    },
    {
      id: "6",
      sender: "You",
      avatarUrl: "",
      content: "I think I see the issue. You're not updating the errors state after validation. Try adding this after your validate function call.",
      timestamp: "Yesterday, 3:00 PM",
      isOwn: true,
    },
    {
      id: "7",
      sender: "John Doe",
      avatarUrl: "",
      content: "Thanks for your help with the React issue!",
      timestamp: "Yesterday, 3:15 PM",
      isOwn: false,
    },
  ];

  const handleSendMessage = () => {
    if (messageInput.trim() === "") return;
    
    // In a real app, you would dispatch an action or make an API call here
    console.log(`Sending message: ${messageInput}`);
    
    // Clear the input field
    setMessageInput("");
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
                <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                <TabsTrigger value="unread" className="flex-1">Unread</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-2 p-0">
                <ScrollArea className="h-[calc(80vh-16rem)]" type="always">
                  {conversations.map((conversation) => (
                    <div key={conversation.id} className="cursor-pointer">
                      <div
                        className={`flex items-center gap-3 p-3 mb-1 hover:bg-muted transition-colors ${
                          activeConversation === conversation.id ? "bg-accent" : ""
                        }`}
                        onClick={() => setActiveConversation(conversation.id)}
                      >
                        <div className="relative">
                          <Avatar>
                            <AvatarFallback>
                              {conversation.user.name.charAt(0)}
                            </AvatarFallback>
                            {conversation.user.avatarUrl && (
                              <AvatarImage src={conversation.user.avatarUrl} />
                            )}
                          </Avatar>
                          <span
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${
                              conversation.user.status === "online"
                                ? "bg-green-500"
                                : "bg-gray-400"
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <p className="font-medium">{conversation.user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {conversation.lastMessage.timestamp}
                            </p>
                          </div>
                          <p className="text-sm truncate text-muted-foreground">
                            {conversation.lastMessage.content}
                          </p>
                        </div>
                        {conversation.unread > 0 && (
                          <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">
                            {conversation.unread}
                          </span>
                        )}
                      </div>
                      <Separator />
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="unread" className="mt-2 p-0">
                <ScrollArea className="h-[calc(80vh-16rem)]" type="always">
                  {conversations
                    .filter((conversation) => conversation.unread > 0)
                    .map((conversation) => (
                      <div key={conversation.id} className="cursor-pointer">
                        <div
                          className={`flex items-center gap-3 p-3 mb-1 hover:bg-muted transition-colors ${
                            activeConversation === conversation.id ? "bg-accent" : ""
                          }`}
                          onClick={() => setActiveConversation(conversation.id)}
                        >
                          <div className="relative">
                            <Avatar>
                              <AvatarFallback>
                                {conversation.user.name.charAt(0)}
                              </AvatarFallback>
                              {conversation.user.avatarUrl && (
                                <AvatarImage src={conversation.user.avatarUrl} />
                              )}
                            </Avatar>
                            <span
                              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${
                                conversation.user.status === "online"
                                  ? "bg-green-500"
                                  : "bg-gray-400"
                              }`}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <p className="font-medium">{conversation.user.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {conversation.lastMessage.timestamp}
                              </p>
                            </div>
                            <p className="text-sm truncate text-muted-foreground">
                              {conversation.lastMessage.content}
                            </p>
                          </div>
                          <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">
                            {conversation.unread}
                          </span>
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
                      {conversations.find(c => c.id === activeConversation)?.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>
                      {conversations.find(c => c.id === activeConversation)?.user.name}
                    </CardTitle>
                    <CardDescription>
                      {conversations.find(c => c.id === activeConversation)?.user.status === "online" 
                        ? "Online" 
                        : `Last active ${conversations.find(c => c.id === activeConversation)?.user.lastActive}`}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="flex-1 overflow-auto p-4">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.isOwn ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`flex gap-2 max-w-[75%] ${
                            message.isOwn ? "flex-row-reverse" : ""
                          }`}
                        >
                          {!message.isOwn && (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{message.sender.charAt(0)}</AvatarFallback>
                              {message.avatarUrl && (
                                <AvatarImage src={message.avatarUrl} />
                              )}
                            </Avatar>
                          )}
                          <div>
                            <div
                              className={`rounded-lg p-3 ${
                                message.isOwn
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {message.timestamp}
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
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-medium">No conversation selected</h3>
                <p className="text-muted-foreground">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MessagesPage;