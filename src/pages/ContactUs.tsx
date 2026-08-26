import React, { useState } from "react";
import { Mail, Send, MessageSquare, Clock, MapPin, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function ContactUs() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Missing fields",
        description: "Please fill out your name, email, and message.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast({
        title: "Message Sent!",
        description: "Thank you for reaching out. We will respond shortly.",
      });
    }, 800);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
          <Mail className="w-3.5 h-3.5" />
          Get In Touch
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
          Contact Us
        </h1>
        <p className="text-muted-foreground text-base max-w-xl mx-auto">
          Have a question, feedback, feature request, or partnership inquiry? We'd love to hear from you!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Contact Info Cards */}
        <div className="space-y-4 md:col-span-1">
          <Card className="bg-card/60 backdrop-blur">
            <CardContent className="p-5 flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">Email Us</h3>
                <p className="text-xs text-muted-foreground mt-0.5">naxivocreators@gmail.com</p>
                <p className="text-[11px] text-muted-foreground/80 mt-1">Direct support inquiries</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur">
            <CardContent className="p-5 flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">Response Time</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Within 24 Hours</p>
                <p className="text-[11px] text-muted-foreground/80 mt-1">Monday – Friday</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur">
            <CardContent className="p-5 flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">Community & Feedback</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Open Suggestions</p>
                <p className="text-[11px] text-muted-foreground/80 mt-1">Tell us what new tools to build next!</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <Card className="md:col-span-2 border-border">
          <CardHeader>
            <CardTitle className="text-xl">Send Us a Message</CardTitle>
            <CardDescription>Fill out the form below and our team will get back to you.</CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="p-8 text-center space-y-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="text-lg font-bold text-foreground">Thank You!</h3>
                <p className="text-sm text-muted-foreground">
                  Your message has been received successfully. We appreciate your feedback and will be in touch soon.
                </p>
                <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground">Your Name *</label>
                    <Input
                      placeholder="e.g. Alex Smith"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground">Your Email *</label>
                    <Input
                      type="email"
                      placeholder="alex@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">Subject</label>
                  <Input
                    placeholder="e.g. Feature Suggestion / Bug Report"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">Message *</label>
                  <Textarea
                    placeholder="Type your message or inquiry here..."
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  <Send className="w-4 h-4" />
                  {loading ? "Sending..." : "Send Message"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
