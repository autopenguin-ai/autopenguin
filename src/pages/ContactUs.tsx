import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, MessageSquare, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import communicationImage from "@/assets/Modern_Digital_Communication.png";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().max(20, "Phone number too long").optional().or(z.literal("")),
  company: z.string().trim().max(100, "Company name too long").optional().or(z.literal("")),
  position: z.string().trim().max(100, "Position too long").optional().or(z.literal("")),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000, "Message must be less than 2000 characters"),
  contact_method: z.enum(["email", "phone", "whatsapp"]).default("email")
});
export default function ContactUs() {
  const {
    t
  } = useTranslation();
  const {
    toast
  } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    position: "",
    message: "",
    contact_method: "email" as "email" | "phone" | "whatsapp"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Validate form data
      const validatedData = contactSchema.parse(formData);

      // Call edge function to save submission
      const {
        error
      } = await supabase.functions.invoke('save-contact-form', {
        body: validatedData
      });
      if (error) throw error;
      toast({
        title: "Message Sent!",
        description: "Thank you for contacting us. We'll get back to you soon."
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        position: "",
        message: "",
        contact_method: "email"
      });
    } catch (error: any) {
      console.error("Submission error:", error);
      if (error?.issues && Array.isArray(error.issues)) {
        toast({
          title: "Validation Error",
          description: error.issues[0].message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  return <div className="min-h-screen flex flex-col">
      <PublicHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
              Contact Us
            </h1>
            <p className="text-xl text-muted-foreground mb-12 animate-fade-in">
              Have questions? We'd love to hear from you.
            </p>
          </div>
        </section>

        {/* Contact Form & Info */}
        <section className="py-8 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Info */}
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="text-3xl font-bold mb-6">Let's Talk</h2>
                  <p className="text-muted-foreground mb-8">
                    Whether you have a question about features, pricing, or anything else, our team is ready to answer all your questions.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-card border">
                    <Mail className="w-6 h-6 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">New Inquiries</h3>
                      <p className="text-sm text-muted-foreground">sales@autopenguin.app</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-lg bg-card border">
                    <Mail className="w-6 h-6 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Existing Customers</h3>
                      <p className="text-sm text-muted-foreground">cs@autopenguin.app</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-lg bg-card border cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all" onClick={() => toast({
                  title: "Coming Soon!",
                  description: "Live chat will be available soon."
                })}>
                    <MessageSquare className="w-6 h-6 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Live Chat</h3>
                      <p className="text-sm text-muted-foreground">Available Mon-Fri, 9am-5pm GMT</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="animate-fade-in">
                <form onSubmit={handleSubmit} className="space-y-4 p-8 rounded-lg bg-card border">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Name
                    </label>
                    <Input id="name" value={formData.name} onChange={e => setFormData(prev => ({
                    ...prev,
                    name: e.target.value
                  }))} required placeholder="Your name" />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email
                    </label>
                    <Input id="email" type="email" value={formData.email} onChange={e => setFormData(prev => ({
                    ...prev,
                    email: e.target.value
                  }))} required placeholder="your@email.com" />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium mb-2">
                      Phone Number
                    </label>
                    <Input id="phone" type="tel" value={formData.phone} onChange={e => setFormData(prev => ({
                    ...prev,
                    phone: e.target.value
                  }))} placeholder="+44 7XXX XXX XXX" />
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium mb-2">
                      Company Name
                    </label>
                    <Input id="company" type="text" value={formData.company} onChange={e => setFormData(prev => ({
                    ...prev,
                    company: e.target.value
                  }))} placeholder="Your company name" />
                  </div>

                  <div>
                    <label htmlFor="position" className="block text-sm font-medium mb-2">
                      Your Position
                    </label>
                    <Input id="position" type="text" value={formData.position} onChange={e => setFormData(prev => ({
                    ...prev,
                    position: e.target.value
                  }))} placeholder="Your role/position" />
                  </div>

                  <div>
                    <label htmlFor="contact_method" className="block text-sm font-medium mb-2">
                      Preferred Contact Method
                    </label>
                    <Select value={formData.contact_method} onValueChange={(value: "email" | "phone" | "whatsapp") => setFormData(prev => ({
                      ...prev,
                      contact_method: value
                    }))}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select contact method" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2">
                      Message
                    </label>
                    <Textarea id="message" value={formData.message} onChange={e => setFormData(prev => ({
                    ...prev,
                    message: e.target.value
                  }))} required placeholder="Tell us how we can help..." rows={6} />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Preview */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-4">Quick Questions?</h2>
            <p className="text-muted-foreground mb-8">
              Check out our FAQ or documentation for instant answers
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button variant="outline">View FAQ</Button>
              <Button variant="outline">Documentation</Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>;
}