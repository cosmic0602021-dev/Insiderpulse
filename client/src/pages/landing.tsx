import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StripeMeshGradient } from "@/components/stripe-mesh-gradient";
import { GlassCard } from "@/components/glass-card";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import LanguageSelectionModal from "@/components/language-selection-modal";
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
  Check,
  Sparkles,
  LineChart
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

  return (
    <div className="min-h-screen relative bg-[#0a0a0f] overflow-hidden">
      {/* Language Selection Modal */}
      <LanguageSelectionModal
        open={showLanguageSelection}
        onClose={() => setShowLanguageSelection(false)}
      />

      {/* Stripe-style Mesh Gradient Background */}
      <StripeMeshGradient variant="purple" opacity={0.4} animate={true} />

      {/* Header/Navigation - Glass morphism */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/40 backdrop-blur-2xl">
        <div className="container flex h-16 items-center justify-between px-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <img
              src="/KakaoTalk_20251119_174042868.png"
              alt="InsiderPulse"
              className="h-8 w-auto object-contain"
            />
            <span className="text-lg font-semibold text-white tracking-tight">InsiderPulse</span>
          </div>

          {/* Navigation with Stripe-style CTA */}
          <div className="flex items-center gap-4">
            {/* Removed: Product Hunt badge */}
          </div>
        </div>
      </header>

      {/* Hero Section - Stripe + Linear Premium */}
      <section className="container px-4 lg:px-6 py-32 md:py-48 relative z-10 max-w-7xl mx-auto">
        <div className="mx-auto max-w-5xl text-center">
          <Badge className="mb-8 px-4 py-2 text-xs font-medium
                           bg-white/10 text-white border border-white/20
                           backdrop-blur-xl rounded-full
                           shadow-lg shadow-purple-500/10">
            <Sparkles className="inline-block w-3 h-3 mr-2" />
            {t('landing.tagline')}
          </Badge>

          <h1 className="mb-8 text-5xl sm:text-6xl md:text-7xl lg:text-8xl
                        font-bold tracking-tight
                        text-white leading-[1.1]
                        bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40
                        [text-shadow:_0_1px_2px_rgb(0_0_0_/_20%)]">
            {t('landing.title')}
          </h1>

          <p className="mb-12 text-lg sm:text-xl md:text-2xl
                        text-slate-400 max-w-3xl mx-auto
                        leading-relaxed font-normal">
            {t('landing.description')}
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 items-center mb-8">
            <Link href="/trades">
              <Button
                size="lg"
                className="w-full sm:w-auto text-base font-medium px-8 py-6
                           bg-white text-black
                           hover:bg-slate-100
                           rounded-full
                           shadow-[0_20px_60px_-15px_rgba(255,255,255,0.3)]
                           hover:shadow-[0_25px_80px_-15px_rgba(255,255,255,0.4)]
                           transition-all duration-200
                           border border-white/20"
                data-testid="button-hero-browse"
              >
                {t('landing.browse')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          <p className="text-sm text-slate-500 font-medium">
            {t('landing.noCreditCard')}
          </p>
        </div>
      </section>

      {/* Features Section - Glassmorphism Premium */}
      <section className="container px-4 lg:px-6 py-24 md:py-32 relative z-10 max-w-7xl mx-auto">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white tracking-tight leading-tight">
              {t('landing.features.title')}
            </h2>
            <p className="text-lg md:text-xl text-slate-400 font-normal max-w-2xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <GlassCard variant="default" className="p-8">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-6">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">{t('landing.features.aiAnalysis')}</h3>
              <p className="text-base text-slate-400 leading-relaxed">
                {t('landing.features.aiAnalysisDesc')}
              </p>
            </GlassCard>

            <GlassCard variant="default" className="p-8">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 mb-6">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">{t('landing.features.realtime')}</h3>
              <p className="text-base text-slate-400 leading-relaxed">
                {t('landing.features.realtimeDesc')}
              </p>
            </GlassCard>

            <GlassCard variant="default" className="p-8">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 mb-6">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">{t('landing.features.filtering')}</h3>
              <p className="text-base text-slate-400 leading-relaxed">
                {t('landing.features.filteringDesc')}
              </p>
            </GlassCard>

            <GlassCard variant="default" className="p-8">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 mb-6">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">{t('landing.features.alerts')}</h3>
              <p className="text-base text-slate-400 leading-relaxed">
                {t('landing.features.alertsDesc')}
              </p>
            </GlassCard>

            <GlassCard variant="default" className="p-8">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 mb-6">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">{t('landing.features.secData')}</h3>
              <p className="text-base text-slate-400 leading-relaxed">
                {t('landing.features.secDataDesc')}
              </p>
            </GlassCard>

            <GlassCard variant="default" className="p-8">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 mb-6">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">{t('landing.features.historical')}</h3>
              <p className="text-base text-slate-400 leading-relaxed">
                {t('landing.features.historicalDesc')}
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Pricing Section - Premium Glass Design */}
      <section className="container px-4 lg:px-6 py-24 md:py-32 relative z-10 max-w-7xl mx-auto">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white tracking-tight">
              {t('landing.pricing.title')}
            </h2>
            <p className="text-lg md:text-xl text-slate-400 font-normal">
              {t('landing.pricing.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Monthly Plan */}
            <GlassCard variant="premium" className="p-10 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white border-none px-4 py-1.5 rounded-full shadow-lg">
                  <Sparkles className="inline-block w-3 h-3 mr-1" />
                  {t('landing.pricing.mostPopular')}
                </Badge>
              </div>
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">{t('landing.pricing.monthly')}</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-6xl font-bold text-white">{t('landing.pricing.monthlyPrice')}</span>
                  <span className="text-slate-400 font-medium">{t('landing.pricing.monthlyPeriod')}</span>
                </div>
                <p className="text-sm text-emerald-400 font-medium">{t('landing.pricing.monthlyTrial')}</p>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white">{t('landing.pricing.monthlyFeature1')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white">{t('landing.pricing.monthlyFeature2')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white">{t('landing.pricing.monthlyFeature3')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white">{t('landing.pricing.monthlyFeature4')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white">{t('landing.pricing.monthlyFeature5')}</span>
                </li>
              </ul>
            </GlassCard>

            {/* Yearly Plan */}
            <GlassCard variant="elevated" className="p-10 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-none px-4 py-1.5 rounded-full shadow-lg">
                  {t('landing.pricing.savePercent')}
                </Badge>
              </div>
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">{t('landing.pricing.yearly')}</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-6xl font-bold text-white">{t('landing.pricing.yearlyPrice')}</span>
                  <span className="text-slate-400 font-medium">{t('landing.pricing.yearlyPeriod')}</span>
                </div>
                <p className="text-sm text-slate-400"><span className="line-through">{t('landing.pricing.yearlySaveOriginal')}</span> • {t('landing.pricing.yearlyTrial')}</p>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white">{t('landing.pricing.yearlyFeature1')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white">{t('landing.pricing.yearlyFeature2')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white">{t('landing.pricing.yearlyFeature3')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white">{t('landing.pricing.yearlyFeature4')}</span>
                </li>
              </ul>
            </GlassCard>
          </div>

          {/* Free tier callout */}
          <div className="mt-12 text-center">
            <p className="text-slate-400 mb-4">{t('landing.pricing.notReady')}</p>
            <Link href="/trades">
              <Button variant="ghost" className="text-white hover:bg-white/5 rounded-full">
                {t('landing.pricing.browseDelayed')}
                <LineChart className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-16 flex flex-wrap justify-center items-center gap-12 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span className="font-medium">{t('landing.pricing.cancelAnytime')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <span className="font-medium">{t('landing.pricing.securePayment')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">{t('landing.pricing.noHiddenFees')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Minimal Premium */}
      <footer className="border-t border-white/5 relative z-10 bg-black/40 backdrop-blur-xl mt-32">
        <div className="container px-4 lg:px-6 py-16 max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
            <div>
              <h3 className="text-xs font-semibold mb-4 text-white uppercase tracking-wider">{t('landing.footer.product')}</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><Link href="/premium-checkout"><a className="hover:text-white transition-colors">{t('landing.footer.pricing')}</a></Link></li>
                <li><Link href="/trades"><a className="hover:text-white transition-colors">{t('landing.footer.browseTrades')}</a></Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold mb-4 text-white uppercase tracking-wider">{t('landing.footer.company')}</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.about')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.blog')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.contact')}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold mb-4 text-white uppercase tracking-wider">{t('landing.footer.legal')}</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.privacy')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.terms')}</a></li>
                <li><a href="/sitemap.xml" className="hover:text-white transition-colors">{t('landing.footer.sitemap')}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold mb-4 text-white uppercase tracking-wider">{t('landing.footer.connect')}</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.twitter')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.linkedin')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.github')}</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img
                src="/KakaoTalk_20251119_174042868.png"
                alt="InsiderPulse"
                className="h-7 w-auto object-contain"
              />
              <span className="text-base font-semibold tracking-tight text-white">InsiderPulse</span>
            </div>
            <p className="text-sm text-slate-500">
              {t('landing.footer.copyright')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
