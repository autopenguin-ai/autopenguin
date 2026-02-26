import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import penguinIconLight from "@/assets/penguin-icon-light.png";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const HeroChatInterface = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: "Hi! 👋 I'm here to answer questions about AutoPenguin. What would you like to know?",
    timestamp: new Date()
  }]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll the messages container, not the whole page
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const quickReplies = ["What is Steve AI?", "How does monitoring work?", "See how it works", "Get beta access"];

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const { data, error } = await supabase.functions.invoke('website-chatbot', {
        body: {
          message: content,
          conversationHistory
        }
      });

      if (error) throw error;

      // Handle different response types
      if (data.type === 'contact_submitted') {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Show success toast
        toast({
          title: '✅ Message Sent!',
          description: data.message,
        });
      } else {
        // Normal text response
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting. Please try again or contact us directly.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden">
      <div className="container relative mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          {/* AI Assistant Badge - Centered */}
          <div className="flex justify-center mb-6 animate-fade-in-up">
            
          </div>
          
          {/* Product Hunt Badge - Centered above headline */}
          <div className="flex justify-center mb-6 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
            <a 
              href="https://www.producthunt.com/products/autopenguin?utm_source=badge-follow&utm_medium=badge&utm_source=badge-autopenguin" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <img 
                src="https://api.producthunt.com/widgets/embed-image/v1/follow.svg?product_id=1117304&theme=dark&size=small" 
                alt="AutoPenguin - AI Agent Management System (AMS) | Product Hunt" 
                style={{ width: '86px', height: '32px' }} 
                width="86" 
                height="32" 
              />
            </a>
          </div>

          {/* Title - Centered */}
          <div className="text-center space-y-4 mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground drop-shadow-lg">
              Your AI Agent Management System
            </h1>
            
            <p className="text-muted-foreground text-lg drop-shadow-md">
              Monitor agents across n8n, Make, Zapier. Steve AI manages everything.
            </p>
          </div>

          {/* Chat Window */}
          <Card className="backdrop-blur-lg bg-white/60 dark:bg-black/40 border-white/40 shadow-2xl overflow-hidden animate-scale-in mb-6" style={{ animationDelay: '0.2s', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' }}>
            <div className="h-[500px] flex flex-col">
              {/* Messages */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                  <ChatMessage key={idx} message={msg} />
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span>Thinking...</span>
                  </div>
                )}
              </div>

              {/* Quick Replies */}
              {messages.length === 1 && (
                <div className="px-4 pb-2">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {quickReplies.slice(0, 3).map((reply, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        className="text-xs backdrop-blur-sm bg-white/40 border-border hover:bg-white/60"
                        onClick={() => handleSendMessage(reply)}
                        disabled={isLoading}
                      >
                        {reply}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs backdrop-blur-sm bg-white/40 border-border hover:bg-white/60"
                      onClick={() => navigate("/auth?mode=signup")}
                      disabled={isLoading}
                    >
                      Get beta access
                    </Button>
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="border-t p-4">
                <ChatInput onSend={handleSendMessage} disabled={isLoading} />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};