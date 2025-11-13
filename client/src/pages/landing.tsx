import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuroraBackground } from "@/components/aurora-background";
import { GrainTexture } from "@/components/grain-texture";
import { BrutalistGrid } from "@/components/brutalist-grid";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import LanguageSelection from "@/pages/language-selection";
import {
  TrendingUp,
  Brain,
  Bell,
  Shield,
  Zap,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Clock,
  Lock,
  Check
} from "lucide-react";

export default function LandingPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [showLanguageSelection, setShowLanguageSelection] = useState(false);

  // Check if language was selected
  useEffect(() => {
    const languageSelected = localStorage.getItem('language-selected');
    if (!languageSelected) {
      setShowLanguageSelection(true);
    }
  }, []);

  // Redirect authenticated users to trades page
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/trades');
    }
  }, [isAuthenticated, navigate]);

  // Show language selection modal if needed
  if (showLanguageSelection) {
    return (
      <LanguageSelection
        onLanguageSelected={() => setShowLanguageSelection(false)}
      />
    );
  }

  return (
    <div className="min-h-screen relative bg-slate-950">
      {/* Aurora Gradient Background Effect */}
      <AuroraBackground />

      {/* Grain Texture Overlay */}
      <GrainTexture opacity={0.05} animate={true} />

      {/* Brutalist Grid Overlay */}
      <BrutalistGrid variant="data" opacity={0.08} />

      {/* Header/Navigation - Enhanced with CTA */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/50 bg-slate-950/95 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/80">
        <div className="container flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-emerald-500" />
            <span className="text-xl font-bold tracking-tight text-white">InsiderPulse</span>
          </div>

          {/* Navigation with prominent CTA */}
          <div className="flex items-center gap-4">
            <Link href="/premium-checkout">
              <Button
                variant="ghost"
                className="hidden sm:inline-flex text-slate-300 hover:text-white"
              >
                Pricing
              </Button>
            </Link>
            <Link href="/premium-checkout">
              <Button
                size="sm"
                className="font-bold uppercase tracking-wider text-xs
                           bg-emerald-500 hover:bg-emerald-400
                           text-slate-950
                           shadow-[0_0_20px_rgba(16,185,129,0.3)]
                           hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]
                           transition-all duration-200
                           border-2 border-emerald-400/20"
              >
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Brutalist Enhanced */}
      <section className="container px-4 lg:px-6 py-24 md:py-40 relative z-10">
        <div className="mx-auto max-w-5xl text-center">
          <Badge className="mb-6 px-4 py-1.5 text-xs font-bold uppercase tracking-widest
                           bg-emerald-500/10 text-emerald-400 border-2 border-emerald-500/30
                           hover:bg-emerald-500/20" variant="outline">
            {t('landing.tagline')}
          </Badge>
          <h1 className="mb-8 text-5xl font-black tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl
                        text-white leading-[0.9]
                        [text-shadow:_0_0_40px_rgb(16_185_129_/_20%)]">
            {t('landing.title')}
          </h1>
          <p className="mb-12 text-xl sm:text-2xl font-medium text-slate-400 max-w-3xl mx-auto leading-relaxed">
            {t('landing.description')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 items-center">
            <Link href="/trades">
              <Button
                size="lg"
                className="w-full sm:w-auto text-base font-bold uppercase tracking-wider px-10 py-7
                           bg-white text-slate-950
                           hover:bg-slate-100
                           border-4 border-slate-800
                           shadow-[8px_8px_0px_0px_rgba(16,185,129,0.4)]
                           hover:shadow-[12px_12px_0px_0px_rgba(16,185,129,0.6)]
                           transition-all duration-200 ease-out
                           hover:translate-x-[-2px] hover:translate-y-[-2px]
                           active:shadow-[4px_4px_0px_0px_rgba(16,185,129,0.4)]
                           active:translate-x-[2px] active:translate-y-[2px]"
                data-testid="button-hero-browse"
              >
                {t('landing.browse')}
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/premium-checkout">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-base font-bold uppercase tracking-wider px-10 py-7
                           bg-emerald-500/10 text-emerald-400
                           border-4 border-emerald-500/50
                           hover:bg-emerald-500/20 hover:border-emerald-400
                           shadow-[8px_8px_0px_0px_rgba(16,185,129,0.2)]
                           hover:shadow-[12px_12px_0px_0px_rgba(16,185,129,0.3)]
                           transition-all duration-200
                           hover:translate-x-[-2px] hover:translate-y-[-2px]"
              >
                Start 7-Day Trial
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm font-mono text-slate-500 uppercase tracking-wider">
            {t('landing.noCreditCard')}
          </p>
        </div>
      </section>

      {/* Features Section - Brutalist Enhanced */}
      <section className="container px-4 lg:px-6 py-24 md:py-32 relative z-10">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4 text-white tracking-tight uppercase">
              {t('landing.features.title')}
            </h2>
            <p className="text-lg md:text-xl font-medium text-slate-400">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 border-slate-800 bg-slate-900/50 backdrop-blur-sm hover:border-emerald-500/50 transition-colors">
              <CardHeader>
                <Brain className="h-12 w-12 text-emerald-500 mb-3" />
                <CardTitle className="text-xl font-bold">{t('landing.features.aiAnalysis')}</CardTitle>
                <CardDescription className="text-base text-slate-400">
                  {t('landing.features.aiAnalysisDesc')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-slate-800 bg-slate-900/50 backdrop-blur-sm hover:border-emerald-500/50 transition-colors">
              <CardHeader>
                <Zap className="h-12 w-12 text-emerald-500 mb-3" />
                <CardTitle className="text-xl font-bold">{t('landing.features.realtime')}</CardTitle>
                <CardDescription className="text-base text-slate-400">
                  {t('landing.features.realtimeDesc')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-slate-800 bg-slate-900/50 backdrop-blur-sm hover:border-emerald-500/50 transition-colors">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-emerald-500 mb-3" />
                <CardTitle className="text-xl font-bold">{t('landing.features.filtering')}</CardTitle>
                <CardDescription className="text-base text-slate-400">
                  {t('landing.features.filteringDesc')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-slate-800 bg-slate-900/50 backdrop-blur-sm hover:border-emerald-500/50 transition-colors">
              <CardHeader>
                <Bell className="h-12 w-12 text-emerald-500 mb-3" />
                <CardTitle className="text-xl font-bold">{t('landing.features.alerts')}</CardTitle>
                <CardDescription className="text-base text-slate-400">
                  {t('landing.features.alertsDesc')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-slate-800 bg-slate-900/50 backdrop-blur-sm hover:border-emerald-500/50 transition-colors">
              <CardHeader>
                <Shield className="h-12 w-12 text-emerald-500 mb-3" />
                <CardTitle className="text-xl font-bold">{t('landing.features.secData')}</CardTitle>
                <CardDescription className="text-base text-slate-400">
                  {t('landing.features.secDataDesc')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-slate-800 bg-slate-900/50 backdrop-blur-sm hover:border-emerald-500/50 transition-colors">
              <CardHeader>
                <Clock className="h-12 w-12 text-emerald-500 mb-3" />
                <CardTitle className="text-xl font-bold">{t('landing.features.historical')}</CardTitle>
                <CardDescription className="text-base text-slate-400">
                  {t('landing.features.historicalDesc')}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section - Brutalist Trading Platform Style */}
      <section className="container px-4 lg:px-6 py-24 md:py-32 relative z-10">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4 text-white tracking-tight uppercase">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg md:text-xl font-medium text-slate-400">
              Start with a free trial. No credit card required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <Card className="border-2 border-slate-700 bg-slate-900/70 backdrop-blur-sm relative">
              <CardHeader className="pb-8">
                <CardTitle className="text-2xl font-black uppercase tracking-tight">Free</CardTitle>
                <div className="mt-4">
                  <span className="text-5xl font-black text-white">$0</span>
                </div>
                <CardDescription className="mt-2 text-base font-medium text-slate-400">
                  48-hour delayed data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/trades">
                  <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase tracking-wider border-2 border-slate-700">
                    Browse Trades
                  </Button>
                </Link>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-slate-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-400">48-hour delayed insider trades</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-slate-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-400">Basic filtering & search</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-slate-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-400">Historical data access</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Monthly Plan */}
            <Card className="border-4 border-emerald-500 bg-slate-900/90 backdrop-blur-sm relative shadow-[0_0_40px_rgba(16,185,129,0.3)]">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-emerald-500 text-slate-950 font-black uppercase tracking-wider px-4 py-1 border-2 border-emerald-400">
                  Popular
                </Badge>
              </div>
              <CardHeader className="pb-8 pt-8">
                <CardTitle className="text-2xl font-black uppercase tracking-tight">Monthly</CardTitle>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white">$14</span>
                  <span className="text-slate-400 font-bold">/month</span>
                </div>
                <CardDescription className="mt-2 text-base font-bold text-emerald-400">
                  3-day free trial
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/premium-checkout">
                  <Button className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-wider text-base py-6 shadow-[4px_4px_0px_0px_rgba(16,185,129,0.4)] hover:shadow-[6px_6px_0px_0px_rgba(16,185,129,0.6)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
                    Start Free Trial
                  </Button>
                </Link>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-white font-medium">Real-time insider trades (no delay)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-white font-medium">AI-powered analysis & predictions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-white font-medium">Advanced pattern detection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-white font-medium">Live push notifications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-white font-medium">Executive trade tracking</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Yearly Plan */}
            <Card className="border-2 border-slate-700 bg-slate-900/70 backdrop-blur-sm relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-amber-500 text-slate-950 font-black uppercase tracking-wider px-4 py-1 border-2 border-amber-400">
                  33% OFF
                </Badge>
              </div>
              <CardHeader className="pb-8 pt-8">
                <CardTitle className="text-2xl font-black uppercase tracking-tight">Yearly</CardTitle>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white">$112</span>
                  <span className="text-slate-400 font-bold">/year</span>
                </div>
                <CardDescription className="mt-2 text-base font-medium text-slate-400">
                  <span className="line-through">$168</span> • 7-day free trial
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/premium-checkout">
                  <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold uppercase tracking-wider border-2 border-slate-600">
                    Start Free Trial
                  </Button>
                </Link>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-white font-medium">Everything in Monthly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-white font-medium">Save $56 per year</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-white font-medium">Extended 7-day trial</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-white font-medium">Best value for serious traders</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Trust badges */}
          <div className="mt-16 flex flex-wrap justify-center items-center gap-8 text-sm text-slate-500 font-mono uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span>Cancel Anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>No Hidden Fees</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Brutalist Enhanced */}
      <section className="container px-4 lg:px-6 py-24 md:py-32 relative z-10">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4 text-white tracking-tight uppercase">
              {t('landing.howItWorks.title')}
            </h2>
            <p className="text-lg md:text-xl font-medium text-slate-400">
              {t('landing.howItWorks.subtitle')}
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-6 p-6 border-2 border-slate-800 bg-slate-900/50 hover:border-emerald-500/50 transition-colors">
              <div className="flex-shrink-0">
                <div className="flex h-14 w-14 items-center justify-center bg-emerald-500 text-slate-950 font-black text-2xl border-2 border-emerald-400">
                  1
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black mb-3 text-white uppercase tracking-tight">{t('landing.howItWorks.step1')}</h3>
                <p className="text-base text-slate-300 leading-relaxed">
                  {t('landing.howItWorks.step1Desc')}
                </p>
              </div>
            </div>

            <div className="flex gap-6 p-6 border-2 border-slate-800 bg-slate-900/50 hover:border-emerald-500/50 transition-colors">
              <div className="flex-shrink-0">
                <div className="flex h-14 w-14 items-center justify-center bg-emerald-500 text-slate-950 font-black text-2xl border-2 border-emerald-400">
                  2
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black mb-3 text-white uppercase tracking-tight">{t('landing.howItWorks.step2')}</h3>
                <p className="text-base text-slate-300 leading-relaxed">
                  {t('landing.howItWorks.step2Desc')}
                </p>
              </div>
            </div>

            <div className="flex gap-6 p-6 border-2 border-slate-800 bg-slate-900/50 hover:border-emerald-500/50 transition-colors">
              <div className="flex-shrink-0">
                <div className="flex h-14 w-14 items-center justify-center bg-emerald-500 text-slate-950 font-black text-2xl border-2 border-emerald-400">
                  3
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black mb-3 text-white uppercase tracking-tight">{t('landing.howItWorks.step3')}</h3>
                <p className="text-base text-slate-300 leading-relaxed">
                  {t('landing.howItWorks.step3Desc')}
                </p>
              </div>
            </div>

            <div className="flex gap-6 p-6 border-2 border-slate-800 bg-slate-900/50 hover:border-emerald-500/50 transition-colors">
              <div className="flex-shrink-0">
                <div className="flex h-14 w-14 items-center justify-center bg-emerald-500 text-slate-950 font-black text-2xl border-2 border-emerald-400">
                  4
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black mb-3 text-white uppercase tracking-tight">{t('landing.howItWorks.step4')}</h3>
                <p className="text-base text-slate-300 leading-relaxed">
                  {t('landing.howItWorks.step4Desc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Brutalist Enhanced */}
      <footer className="border-t-4 border-slate-800 relative z-10 bg-slate-950/80">
        <div className="container px-4 lg:px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="font-black text-sm mb-4 text-white uppercase tracking-wider">Product</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><Link href="/premium-checkout"><a className="hover:text-emerald-400 transition-colors font-medium">Pricing</a></Link></li>
                <li><Link href="/trades"><a className="hover:text-emerald-400 transition-colors font-medium">Browse Trades</a></Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-black text-sm mb-4 text-white uppercase tracking-wider">Company</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#" className="hover:text-emerald-400 transition-colors font-medium">About</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors font-medium">Blog</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors font-medium">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-black text-sm mb-4 text-white uppercase tracking-wider">Legal</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#" className="hover:text-emerald-400 transition-colors font-medium">Privacy</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors font-medium">Terms</a></li>
                <li><a href="/sitemap.xml" className="hover:text-emerald-400 transition-colors font-medium">Sitemap</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-black text-sm mb-4 text-white uppercase tracking-wider">Connect</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#" className="hover:text-emerald-400 transition-colors font-medium">Twitter</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors font-medium">LinkedIn</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors font-medium">GitHub</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t-2 border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <span className="font-black text-lg tracking-tight text-white">InsiderPulse</span>
            </div>
            <p className="text-sm text-slate-500 font-mono uppercase tracking-wider">
              &copy; 2025 All rights reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
