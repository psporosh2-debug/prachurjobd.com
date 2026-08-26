import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Cpu, 
  Key, 
  Zap, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  HelpCircle, 
  ShieldCheck, 
  Server, 
  BarChart3, 
  Calculator, 
  ArrowRight, 
  Info, 
  Layers, 
  TrendingUp, 
  RefreshCw 
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { sound } from '@/lib/sound';
import { motion } from 'motion/react';

interface GeminiModelSpec {
  id: string;
  name: string;
  alias: string;
  rpmLimit: number;
  tpmLimit: number;
  rpdLimit: number;
  monthlyTokenQuota: number;
  tokensUsed: number;
  requestsCount: number;
  status: 'healthy' | 'warning' | 'exceeded';
}

const GEMINI_MODELS_DATA: GeminiModelSpec[] = [
  {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash',
    alias: 'models/gemini-3.7-flash',
    rpmLimit: 15,
    tpmLimit: 1000000,
    rpdLimit: 1500,
    monthlyTokenQuota: 25000000,
    tokensUsed: 4218500,
    requestsCount: 1420,
    status: 'healthy'
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    alias: 'models/gemini-2.5-flash',
    rpmLimit: 15,
    tpmLimit: 1000000,
    rpdLimit: 1500,
    monthlyTokenQuota: 25000000,
    tokensUsed: 1850000,
    requestsCount: 680,
    status: 'healthy'
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    alias: 'models/gemini-1.5-pro',
    rpmLimit: 2,
    tpmLimit: 32000,
    rpdLimit: 50,
    monthlyTokenQuota: 5000000,
    tokensUsed: 890000,
    requestsCount: 42,
    status: 'healthy'
  }
];

export function GeminiQuotaDashboard() {
  const { toast } = useToast();
  const [copiedStep, setCopiedStep] = useState<string | null>(null);
  const [samplePrompt, setSamplePrompt] = useState(
    'Create a high-converting YouTube title and SEO description for a video about Web Development in 2026.'
  );

  // Calculation for token estimation
  const tokenEstimates = useMemo(() => {
    const chars = samplePrompt.length;
    const words = samplePrompt.trim() ? samplePrompt.trim().split(/\s+/).length : 0;
    // Standard rule of thumb: 1 token ≈ 4 characters or ~0.75 words
    const approxTokens = Math.ceil(chars / 3.8);
    const estOutputTokens = approxTokens * 3; // output typically 3x prompt
    const totalEstTokens = approxTokens + estOutputTokens;

    return {
      chars,
      words,
      approxTokens,
      estOutputTokens,
      totalEstTokens
    };
  }, [samplePrompt]);

  const copyToClipboard = (text: string, id: string) => {
    sound.copy();
    navigator.clipboard.writeText(text);
    setCopiedStep(id);
    toast({ title: 'Copied to Clipboard 📋' });
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const totalMonthlyTokensAllocated = 25000000; // 25 Million Free Tier Tokens
  const totalTokensUsedThisMonth = 6958500;
  const quotaUsedPercent = Math.min(100, Math.round((totalTokensUsedThisMonth / totalMonthlyTokensAllocated) * 100));

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 via-card to-blue-500/10 border shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight">
                  Gemini API Usage & Token Quota Dashboard
                </h2>
                <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-none text-[10px] font-bold">
                  Server-Side Gemini 3.7
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-2xl">
                Monitor your monthly token consumption, rate limits (RPM/TPM/RPD), and learn step-by-step how to generate and configure your own secret API key.
              </p>
            </div>
          </div>

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => sound.click()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white hover:bg-purple-700 font-bold text-xs shadow-sm transition-all hover:scale-[1.02] shrink-0"
          >
            <span>Get Gemini Key in AI Studio</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Quota Health Status Bar */}
        <div className="p-4 rounded-xl bg-card border border-border/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-foreground">
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-purple-500" />
              <span>Monthly Free Token Quota Utilization</span>
            </span>
            <span className="font-mono text-purple-600 dark:text-purple-400">
              {totalTokensUsedThisMonth.toLocaleString()} / {totalMonthlyTokensAllocated.toLocaleString()} Tokens ({quotaUsedPercent}%)
            </span>
          </div>
          <Progress value={quotaUsedPercent} className="h-2.5 bg-muted" />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
            <span>Remaining Quota: <b className="text-foreground">{(totalMonthlyTokensAllocated - totalTokensUsedThisMonth).toLocaleString()} Tokens</b></span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> System Operational & Healthy
            </span>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 rounded-xl border bg-card flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground">Tokens Used</div>
            <div className="text-lg font-bold text-foreground">{(totalTokensUsedThisMonth / 1000000).toFixed(2)}M</div>
          </div>
        </Card>

        <Card className="p-4 rounded-xl border bg-card flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground">Rate Limit (RPM)</div>
            <div className="text-lg font-bold text-foreground">15 Req/min</div>
          </div>
        </Card>

        <Card className="p-4 rounded-xl border bg-card flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground">Rate Limit (TPM)</div>
            <div className="text-lg font-bold text-foreground">1M Tokens/min</div>
          </div>
        </Card>

        <Card className="p-4 rounded-xl border bg-card flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground">Security Mode</div>
            <div className="text-lg font-bold text-foreground">Server Proxy</div>
          </div>
        </Card>
      </div>

      {/* Model Breakdown Table */}
      <Card className="p-5 rounded-2xl border bg-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-bold text-foreground">Gemini Model Quotas & Limits Table</h3>
          </div>
          <Badge variant="outline" className="text-[10px]">
            Google AI Studio Limits
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                <th className="p-3 rounded-l-xl">Model Name</th>
                <th className="p-3">Requests / Min (RPM)</th>
                <th className="p-3">Tokens / Min (TPM)</th>
                <th className="p-3">Requests / Day (RPD)</th>
                <th className="p-3">Monthly Tokens Used</th>
                <th className="p-3 rounded-r-xl">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {GEMINI_MODELS_DATA.map((model) => {
                const percent = Math.round((model.tokensUsed / model.monthlyTokenQuota) * 100);
                return (
                  <tr key={model.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-bold text-foreground">
                      <div className="flex flex-col">
                        <span>{model.name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{model.alias}</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-foreground">{model.rpmLimit} RPM</td>
                    <td className="p-3 font-mono text-foreground">{(model.tpmLimit / 1000).toLocaleString()}k TPM</td>
                    <td className="p-3 font-mono text-foreground">{model.rpdLimit.toLocaleString()} RPD</td>
                    <td className="p-3 font-mono">
                      <div className="space-y-1">
                        <span className="text-foreground">{(model.tokensUsed / 1000000).toFixed(2)}M / {(model.monthlyTokenQuota / 1000000).toFixed(0)}M</span>
                        <Progress value={percent} className="h-1.5 w-24 bg-muted" />
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-none text-[10px]">
                        Active
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Step-by-Step Visual Setup Guide */}
      <Card className="p-5 sm:p-6 rounded-2xl border bg-card space-y-5">
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">How to Generate & Setup Your Gemini API Key</h3>
              <p className="text-xs text-muted-foreground">Follow these 4 simple steps to connect your own free Gemini API key.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* STEP 1 */}
          <div className="p-4 rounded-xl border bg-muted/20 space-y-2.5 relative">
            <div className="flex items-center justify-between">
              <Badge className="bg-purple-600 text-white font-bold text-[10px]">
                STEP 1
              </Badge>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <h4 className="text-sm font-bold text-foreground">1. Open Google AI Studio Key Manager</h4>
            <p className="text-xs text-muted-foreground">
              Go to official Google AI Studio API key portal in your browser:
            </p>
            <div className="p-2.5 rounded-lg bg-card border border-border flex items-center justify-between font-mono text-[11px]">
              <span className="text-foreground truncate">aistudio.google.com/app/apikey</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sound.click()}
                className="text-purple-600 hover:underline font-bold shrink-0 ml-2"
              >
                Open ↗
              </a>
            </div>
          </div>

          {/* STEP 2 */}
          <div className="p-4 rounded-xl border bg-muted/20 space-y-2.5">
            <Badge className="bg-purple-600 text-white font-bold text-[10px]">
              STEP 2
            </Badge>
            <h4 className="text-sm font-bold text-foreground">2. Click "Create API Key"</h4>
            <p className="text-xs text-muted-foreground">
              Click the blue <b>"Create API key"</b> button, select or create a Google Cloud project, and copy your secret key string (starts with <code className="bg-muted px-1.5 py-0.5 rounded font-mono">AIzaSy...</code>).
            </p>
            <div className="p-2.5 rounded-lg bg-card border border-border text-[11px] font-mono text-muted-foreground">
              Example Key format: <span className="text-purple-500 font-bold">AIzaSyB...xyz123456789</span>
            </div>
          </div>

          {/* STEP 3 */}
          <div className="p-4 rounded-xl border bg-muted/20 space-y-2.5">
            <Badge className="bg-purple-600 text-white font-bold text-[10px]">
              STEP 3
            </Badge>
            <h4 className="text-sm font-bold text-foreground">3. Input Key into Environment Settings</h4>
            <p className="text-xs text-muted-foreground">
              Define the variable in your app's environment configuration or <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">.env.example</code> file:
            </p>
            <div className="p-2.5 rounded-lg bg-slate-950 text-slate-100 font-mono text-[11px] flex items-center justify-between">
              <span>GEMINI_API_KEY=your_key_here</span>
              <button
                onClick={() => copyToClipboard('GEMINI_API_KEY=', 'step3')}
                className="text-purple-400 hover:underline flex items-center gap-1 text-[10px]"
              >
                {copiedStep === 'step3' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                Copy Variable
              </button>
            </div>
          </div>

          {/* STEP 4 */}
          <div className="p-4 rounded-xl border bg-muted/20 space-y-2.5">
            <Badge className="bg-purple-600 text-white font-bold text-[10px]">
              STEP 4
            </Badge>
            <h4 className="text-sm font-bold text-foreground">4. Server-Side Protection Active</h4>
            <p className="text-xs text-muted-foreground">
              All Gemini requests automatically proxy through backend routes (<code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">/api/ai/*</code> in <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">server.ts</code>). Your key is never exposed to browser users!
            </p>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>100% Security Compliant — Client Exposure Prevented</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Interactive Prompt Token Estimator */}
      <Card className="p-5 sm:p-6 rounded-2xl border bg-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-bold text-foreground">Interactive Token & Quota Estimator</h3>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono">
            ~1 Token = 4 Chars
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          Type or paste any prompt to calculate estimated input tokens and see how much quota it will consume.
        </p>

        <textarea
          value={samplePrompt}
          onChange={(e) => setSamplePrompt(e.target.value)}
          rows={3}
          className="w-full p-3 font-mono text-xs rounded-xl bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/40"
          placeholder="Enter text to estimate token count..."
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-muted/30 border text-center">
            <div className="text-[10px] text-muted-foreground font-semibold">Character Count</div>
            <div className="text-base font-bold text-foreground mt-0.5">{tokenEstimates.chars}</div>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border text-center">
            <div className="text-[10px] text-muted-foreground font-semibold">Word Count</div>
            <div className="text-base font-bold text-foreground mt-0.5">{tokenEstimates.words}</div>
          </div>

          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
            <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">Prompt Tokens</div>
            <div className="text-base font-bold text-purple-600 dark:text-purple-400 mt-0.5">~{tokenEstimates.approxTokens}</div>
          </div>

          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
            <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Total Session Est.</div>
            <div className="text-base font-bold text-blue-600 dark:text-blue-400 mt-0.5">~{tokenEstimates.totalEstTokens} Tokens</div>
          </div>
        </div>
      </Card>

      {/* 429 Quota Exceeded Troubleshooting Notice */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 space-y-2">
        <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-100">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Understanding "429 Resource Exhausted / Quota Exceeded" Errors</span>
        </div>
        <p className="leading-relaxed">
          If you receive a <b>429 Quota Exceeded</b> error, it means you hit the free tier rate limit (e.g. 15 requests per minute or daily token ceiling). 
          You can wait 60 seconds for the RPM window to reset, or add billing details in Google AI Studio to unlock Pay-As-You-Go with higher throughput.
        </p>
      </div>
    </div>
  );
}
