import React from "react";
import { Shield, Zap, Lock, Sparkles, Globe, Heart, Users, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AboutUs() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          About Prachurjo
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
          Empowering Creators & Developers with Free Web Utilities
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Prachurjo is a modern, high-speed Prachurjo Tools providing free, privacy-focused online tools for YouTube creators, developers, designers, and digital marketers.
        </p>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/60 backdrop-blur border-border/60">
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
              <Zap className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg">Lightning Fast</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              All image conversions, text tools, and thumbnail processing run directly inside your browser for near-instant results.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur border-border/60">
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2">
              <Lock className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg">100% Client-Side Privacy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your files and input data never touch any remote server. Your privacy and file security are fully guaranteed.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur border-border/60">
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-2">
              <Globe className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg">No Registration Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Enjoy complete access to all of our web utilities completely free without signing up or creating an account.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mission & Story Section */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500" />
            Our Mission & Vision
          </CardTitle>
          <CardDescription>Why we built Prachurjo and who we build it for.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm md:text-base text-muted-foreground leading-relaxed">
          <p>
            In today's digital landscape, creators and web professionals often waste precious time switching between bloated online tools full of aggressive paywalls, mandatory signups, and slow file processing.
          </p>
          <p>
            At <strong className="text-foreground font-semibold">Prachurjo</strong>, we set out to build a streamlined toolkit that solves everyday content and media tasks effortlessly. Whether you need to grab high-definition YouTube thumbnail previews, optimize titles and descriptions with AI, convert images into web-ready WebP formats, or generate custom website favicons, Prachurjo has you covered in a single place.
          </p>
          
          <h3 className="text-lg font-bold text-foreground pt-4 mb-2">Core Commitments</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Free forever with zero hidden fees</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Browser-based local file conversion</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>AI-assisted optimization for creators</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Clean, fast, non-intrusive experience</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
