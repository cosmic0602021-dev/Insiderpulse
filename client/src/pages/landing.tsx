import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuroraBackground } from "@/components/aurora-background";
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
  Lock
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
    <div className="min-h-screen relative">
      {/* Aurora Gradient Background Effect */}
      <AuroraBackground />

      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60">
        <div className="container flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">InsiderPulse</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container px-4 lg:px-6 py-24 md:py-40 relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <Badge className="mb-4" variant="secondary">
            {t('landing.tagline')}
          </Badge>
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
            {t('landing.title')}
          </h1>
          <p className="mb-8 text-xl text-slate-300 max-w-2xl mx-auto">
            {t('landing.description')}
          </p>
          <div className="flex justify-center">
            <Link href="/trades">
              <Button
                size="lg"
                className="w-full sm:w-auto text-lg px-8 py-6
                           bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700
                           hover:from-blue-500 hover:via-blue-600 hover:to-indigo-600
                           shadow-[0_4px_14px_0_rgba(59,130,246,0.39)]
                           hover:shadow-[0_6px_20px_rgba(59,130,246,0.5)]
                           transition-all duration-200 ease-out
                           hover:-translate-y-0.5 active:translate-y-0
                           border-0 text-white font-semibold"
                data-testid="button-hero-browse"
              >
                {t('landing.browse')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {t('landing.noCreditCard')}
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="container px-4 lg:px-6 py-24 md:py-32 relative z-10">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-white">
              {t('landing.features.title')}
            </h2>
            <p className="text-lg text-slate-400">
              {t('landing.features.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Brain className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{t('landing.features.aiAnalysis')}</CardTitle>
                <CardDescription>
                  {t('landing.features.aiAnalysisDesc')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{t('landing.features.realtime')}</CardTitle>
                <CardDescription>
                  {t('landing.features.realtimeDesc')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{t('landing.features.filtering')}</CardTitle>
                <CardDescription>
                  {t('landing.features.filteringDesc')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Bell className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{t('landing.features.alerts')}</CardTitle>
                <CardDescription>
                  {t('landing.features.alertsDesc')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{t('landing.features.secData')}</CardTitle>
                <CardDescription>
                  {t('landing.features.secDataDesc')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Clock className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{t('landing.features.historical')}</CardTitle>
                <CardDescription>
                  {t('landing.features.historicalDesc')}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container px-4 lg:px-6 py-24 md:py-32 relative z-10">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-white">
              {t('landing.howItWorks.title')}
            </h2>
            <p className="text-lg text-slate-400">
              {t('landing.howItWorks.subtitle')}
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  1
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-white">{t('landing.howItWorks.step1')}</h3>
                <p className="text-slate-400">
                  {t('landing.howItWorks.step1Desc')}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  2
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-white">{t('landing.howItWorks.step2')}</h3>
                <p className="text-slate-400">
                  {t('landing.howItWorks.step2Desc')}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  3
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-white">{t('landing.howItWorks.step3')}</h3>
                <p className="text-slate-400">
                  {t('landing.howItWorks.step3Desc')}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  4
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 text-white">{t('landing.howItWorks.step4')}</h3>
                <p className="text-slate-400">
                  {t('landing.howItWorks.step4Desc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 relative z-10">
        <div className="container px-4 lg:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4 text-white">Product</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/premium-checkout"><a className="hover:text-white">Pricing</a></Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">Company</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">Legal</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
                <li><a href="/sitemap.xml" className="hover:text-white">Sitemap</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">Connect</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white">Twitter</a></li>
                <li><a href="#" className="hover:text-white">LinkedIn</a></li>
                <li><a href="#" className="hover:text-white">GitHub</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
            <p>&copy; 2025 InsiderPulse. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
