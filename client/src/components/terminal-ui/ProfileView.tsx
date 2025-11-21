
import React, { useState, useEffect } from 'react';
import { Language } from './types';
import { TRANSLATIONS } from '@/lib/translations';
import { User, Crown, CreditCard, ExternalLink, AlertCircle, XCircle, Clock, Ticket, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest } from '@/lib/queryClient';

interface ProfileViewProps {
  lang: Language;
  isPro?: boolean;
  onRedeemCoupon?: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ lang, onRedeemCoupon }) => {
  const t = TRANSLATIONS[lang].profile;
  const common = TRANSLATIONS[lang].common;
  const { user } = useAuth();

  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  
  const isPro = user?.subscriptionTier === 'insider_pro' || user?.subscriptionTier === 'insider';
  const isTrialing = user?.subscriptionStatus === 'trialing';
  const isActive = user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trialing';
  
  const trialEndDate = user?.trialExpiresAt ? new Date(user.trialExpiresAt) : null;
  const subscriptionEndDate = user?.subscriptionEndDate ? new Date(user.subscriptionEndDate) : null;
  const nextBillingDate = isTrialing ? trialEndDate : subscriptionEndDate;

  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0 });

  useEffect(() => {
      if (!nextBillingDate) return;

      const timer = setInterval(() => {
          const now = new Date();
          const diffMs = nextBillingDate.getTime() - now.getTime();
          
          if (diffMs > 0) {
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            setTimeLeft({ hours, minutes });
          } else {
             setTimeLeft({ hours: 0, minutes: 0 });
          }
      }, 1000 * 60);

      return () => clearInterval(timer);
  }, [nextBillingDate]);

  const handleRedeem = () => {
      if (!couponCode.trim()) {
          setCouponStatus('error');
          return;
      }

      setCouponStatus('success');
      setCouponCode('');
      
      if (onRedeemCoupon) onRedeemCoupon();

      setTimeout(() => setCouponStatus('idle'), 3000);
  };

  const handleManageStripe = async () => {
      if (!user?.stripeCustomerId) {
          setCouponStatus('error');
          return;
      }

      setIsLoadingPortal(true);
      try {
          const response = await apiRequest('POST', '/api/create-portal-session', {});
          const data = await response.json();
          
          if (data.url) {
              window.location.href = data.url;
          }
      } catch (error) {
          console.error('Failed to create portal session:', error);
          setCouponStatus('error');
      } finally {
          setIsLoadingPortal(false);
      }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#050505]">
        <div className="p-6 border-b border-neutral-900">
            <h1 className="text-3xl font-light text-neutral-200 tracking-tight uppercase">{t.header}</h1>
            <p className="text-xs text-neutral-600 mt-1 mono uppercase tracking-widest">{t.subHeader}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6 custom-scrollbar">
            {/* Account Info */}
            <div className="bg-[#0a0a0a] border border-neutral-900 p-6 rounded-sm">
                <div className="flex items-center gap-3 mb-6 border-b border-neutral-800 pb-4">
                    <User className="text-neutral-500" size={20} />
                    <h2 className="text-lg font-bold text-neutral-300">{t.account}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <div className="text-xs text-neutral-600 uppercase tracking-wider mb-1">{t.email}</div>
                        <div className="text-neutral-300 mono font-medium">{user?.email || 'N/A'}</div>
                    </div>
                    <div>
                        <div className="text-xs text-neutral-600 uppercase tracking-wider mb-1">{t.joined}</div>
                        <div className="text-neutral-300 mono font-medium">
                            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Subscription Info */}
            <div className="bg-[#0a0a0a] border border-neutral-900 p-6 rounded-sm">
                 <div className="flex items-center gap-3 mb-6 border-b border-neutral-800 pb-4">
                    <Crown className="text-neutral-500" size={20} />
                    <h2 className="text-lg font-bold text-neutral-300">{t.subStatus}</h2>
                </div>

                <div className="bg-neutral-900/30 border border-neutral-800 p-4 flex justify-between items-center mb-6">
                    <div>
                        <div className="text-xs text-neutral-600 uppercase tracking-wider mb-1">{t.currentPlan}</div>
                        <div className="text-xl font-bold text-white flex items-center gap-2">
                            {isPro ? common.tierPro : common.tierFree} 
                            <span className={isPro ? "text-emerald-500" : "text-amber-500"}>{isPro ? '♛' : '♙'}</span>
                        </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border rounded-full ${isActive ? 'bg-emerald-900/30 text-emerald-500 border-emerald-900/50' : 'bg-neutral-800 text-neutral-400 border-neutral-700'}`}>
                        {isActive ? (isTrialing ? 'TRIALING' : 'ACTIVE') : 'INACTIVE'}
                    </span>
                </div>

                {isPro && isActive && (
                    <>
                        {isTrialing && (
                            <div className="flex justify-end mb-4">
                                 <div className="flex items-center gap-2 text-xs text-emerald-500">
                                     <CheckCircle2 size={12} />
                                     <span>Using free trial</span>
                                 </div>
                            </div>
                        )}

                        {nextBillingDate && (
                            <div className="bg-neutral-900/50 p-6 rounded text-center border border-neutral-800 relative overflow-hidden group">
                                <div className="relative z-10">
                                    <div className="flex items-center justify-center gap-2 text-neutral-500 mb-2">
                                        <Clock size={14} />
                                        <span className="text-xs uppercase tracking-wider">{t.nextBilling}</span>
                                    </div>
                                    <div className="text-4xl md:text-5xl font-mono font-bold text-neutral-200 mb-2 transition-all duration-500">
                                        {timeLeft.hours}<span className="text-neutral-600">:</span>{timeLeft.minutes.toString().padStart(2, '0')}<span className="text-sm text-neutral-600 ml-2 self-end mb-2">hours</span>
                                    </div>
                                    <div className="text-xs text-neutral-600 mono">{nextBillingDate.toLocaleString()}</div>
                                </div>
                                <div className="absolute bottom-0 left-0 h-1 bg-emerald-900/50 w-full">
                                    <div className="h-full bg-emerald-500/50 w-[80%]"></div>
                                </div>
                            </div>
                        )}
                    </>
                )}
                
                {!isPro && (
                    <div className="mt-4 flex justify-center text-[10px] text-neutral-600 items-center gap-1.5">
                         <AlertCircle size={10} className="text-amber-600" />
                         <span>Upgrade to activate real-time signals</span>
                    </div>
                )}
            </div>

            {/* Coupon / Promotions Section */}
            <div className="bg-[#0a0a0a] border border-neutral-900 p-6 rounded-sm relative overflow-hidden">
                 <div className="flex items-center gap-3 mb-6 border-b border-neutral-800 pb-4">
                    <Ticket className="text-neutral-500" size={20} />
                    <h2 className="text-lg font-bold text-neutral-300">Redeem Code</h2>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4">
                    <input 
                        type="text" 
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="ENTER COUPON CODE"
                        className="flex-1 bg-[#050505] border border-neutral-800 p-4 text-sm text-neutral-200 focus:outline-none focus:border-emerald-700 font-mono tracking-widest uppercase"
                    />
                    <button 
                        onClick={handleRedeem}
                        className="bg-neutral-100 hover:bg-white text-black px-8 py-4 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={couponStatus === 'success'}
                    >
                        {couponStatus === 'success' ? 'APPLIED' : 'REDEEM'}
                    </button>
                </div>

                {couponStatus === 'success' && (
                    <div className="mt-4 p-3 bg-emerald-900/20 border border-emerald-900/50 text-emerald-500 text-xs font-mono flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <CheckCircle2 size={14} />
                        SUCCESS: TRIAL EXTENDED BY +72 HOURS
                    </div>
                )}
                {couponStatus === 'error' && (
                     <div className="mt-4 p-3 bg-rose-900/20 border border-rose-900/50 text-rose-500 text-xs font-mono flex items-center gap-2 animate-in fade-in">
                        <AlertCircle size={14} />
                        ERROR: INVALID CODE OR INPUT EMPTY
                    </div>
                )}
                
                <p className="text-[10px] text-neutral-600 mt-4 flex items-center gap-2">
                    <Ticket size={10} />
                    Enter promotional code to extend your free trial duration.
                </p>
            </div>

             {/* Payment Info */}
             {user?.stripeCustomerId && (
                 <div className="bg-[#0a0a0a] border border-neutral-900 p-6 rounded-sm">
                    <div className="flex items-center gap-3 mb-4 border-b border-neutral-800 pb-4">
                        <CreditCard className="text-neutral-500" size={20} />
                        <h2 className="text-lg font-bold text-neutral-300">{t.payment}</h2>
                    </div>
                    <p className="text-xs text-neutral-500 mb-6">Secure payment management via Stripe</p>
                    
                    <button 
                        onClick={handleManageStripe}
                        disabled={isLoadingPortal}
                        className="w-full py-3 border border-neutral-800 text-neutral-300 hover:bg-neutral-900 transition-colors text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoadingPortal ? (
                            <>
                                <div className="w-3 h-3 border-2 border-neutral-300 border-t-transparent rounded-full animate-spin"></div>
                                <span>LOADING...</span>
                            </>
                        ) : (
                            <>
                                <ExternalLink size={14} />
                                {t.stripe}
                            </>
                        )}
                    </button>
                </div>
             )}
        </div>
    </div>
  );
};

export default ProfileView;
