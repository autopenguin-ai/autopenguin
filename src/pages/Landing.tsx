import { Footer } from "@/components/Footer";
import { PublicHeader } from "@/components/PublicHeader";
import { HeroChatInterface } from "@/components/chatbot/HeroChatInterface";
import spaceBackground from "@/assets/space-background.png";

export default function Landing() {
  return (
    <div 
      className="min-h-screen bg-background relative"
      style={{
        backgroundImage: `url(${spaceBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <PublicHeader />

      {/* Hero Section with Chatbot */}
      <HeroChatInterface />

      <Footer />
    </div>
  );
}