import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  return (
    <div className="min-h-screen bg-background">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">InsiderPulse</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" data-testid="button-login">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button data-testid="button-signup">
                Get Started Free
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <Badge className="mb-4" variant="secondary">
            AI-Powered SEC Filing Analysis
          </Badge>
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Track Insider Trading in Real-Time
          </h1>
          <p className="mb-8 text-xl text-muted-foreground max-w-2xl mx-auto">
            Get instant alerts and AI-powered insights from SEC Form 4 filings. 
            Make informed investment decisions based on what corporate insiders are doing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto" data-testid="button-hero-signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/trades">
              <Button size="lg" variant="outline" className="w-full sm:w-auto" data-testid="button-view-trades">
                View Live Trades
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required • Free 48-hour delayed data • Upgrade anytime
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-20 bg-muted/50">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Everything You Need to Track Insider Activity
            </h2>
            <p className="text-lg text-muted-foreground">
              Powerful features designed for serious investors
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Brain className="h-10 w-10 text-primary mb-2" />
                <CardTitle>AI-Powered Analysis</CardTitle>
                <CardDescription>
                  Advanced GPT analysis extracts buy/sell signals and significance scores (1-100) from every trade
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Real-Time Updates</CardTitle>
                <CardDescription>
                  WebSocket-powered live updates deliver new insider trades the moment they're filed with the SEC
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Smart Filtering</CardTitle>
                <CardDescription>
                  Filter by ticker, signal type, significance score, and transaction type to find the trades that matter
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Bell className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Custom Alerts</CardTitle>
                <CardDescription>
                  Set up personalized notifications for specific companies or trade patterns you want to monitor
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>SEC Data Direct</CardTitle>
                <CardDescription>
                  Automated collection from official SEC EDGAR filings ensures accuracy and compliance
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Clock className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Historical Analysis</CardTitle>
                <CardDescription>
                  Access complete trading history and pattern analysis to identify insider buying trends
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              How InsiderPulse Works
            </h2>
            <p className="text-lg text-muted-foreground">
              From SEC filing to actionable insight in seconds
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
                <h3 className="text-xl font-semibold mb-2">Automated Data Collection</h3>
                <p className="text-muted-foreground">
                  Our system monitors SEC EDGAR filings 24/7, automatically collecting Form 4 insider trading reports every 10 minutes.
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
                <h3 className="text-xl font-semibold mb-2">AI-Powered Analysis</h3>
                <p className="text-muted-foreground">
                  Each trade is instantly analyzed using advanced AI to extract significance scores, trading signals, and key insights about the transaction.
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
                <h3 className="text-xl font-semibold mb-2">Instant Alerts</h3>
                <p className="text-muted-foreground">
                  Premium users receive real-time notifications when significant insider trades occur in their watchlist companies.
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
                <h3 className="text-xl font-semibold mb-2">Make Informed Decisions</h3>
                <p className="text-muted-foreground">
                  Use our insights and analytics to guide your investment strategy based on what corporate insiders are doing with their own money.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container py-20 bg-muted/50">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground">
              Choose the plan that's right for you
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Free</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>48-hour delayed insider trade data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>AI-powered analysis and insights</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Basic filtering and search</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Historical data access</span>
                  </li>
                </ul>
                <Link href="/signup">
                  <Button variant="outline" className="w-full" data-testid="button-signup-free">
                    Get Started Free
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Premium</CardTitle>
                  <Badge>Most Popular</Badge>
                </div>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$14</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="font-semibold">Real-time insider trade data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>WebSocket live updates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Custom alerts and notifications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Advanced filtering and analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Priority support</span>
                  </li>
                </ul>
                <Link href="/premium-checkout">
                  <Button className="w-full" data-testid="button-upgrade-premium">
                    Upgrade to Premium
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              All plans include AI-powered analysis • Cancel anytime • No hidden fees
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4">
            Start Tracking Insider Trades Today
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of investors who use InsiderPulse to make informed trading decisions based on insider activity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto" data-testid="button-cta-signup">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/trades">
              <Button size="lg" variant="outline" className="w-full sm:w-auto" data-testid="button-cta-demo">
                View Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/trades"><a className="hover:text-foreground">Live Trades</a></Link></li>
                <li><Link href="/premium-checkout"><a className="hover:text-foreground">Pricing</a></Link></li>
                <li><Link href="/trades"><a className="hover:text-foreground">Features</a></Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">About</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms</a></li>
                <li><a href="/sitemap.xml" className="hover:text-foreground">Sitemap</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Twitter</a></li>
                <li><a href="#" className="hover:text-foreground">LinkedIn</a></li>
                <li><a href="#" className="hover:text-foreground">GitHub</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; 2025 InsiderPulse. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
