import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

interface RefreshAccountButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  showIcon?: boolean;
}

export function RefreshAccountButton({
  variant = 'outline',
  size = 'default',
  className = '',
  showIcon = true,
}: RefreshAccountButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { refreshUser, user } = useAuth();
  const { toast } = useToast();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    console.log('🔄 User clicked refresh account button');

    try {
      const success = await refreshUser();

      if (success) {
        console.log('✅ Account data refreshed successfully');
        toast({
          title: 'Account Refreshed',
          description: `Subscription: ${user?.subscriptionTier || 'free'} (${user?.subscriptionStatus || 'inactive'})`,
        });
      } else {
        console.log('❌ Failed to refresh account data');
        toast({
          title: 'Refresh Failed',
          description: 'Could not refresh account data. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('❌ Error refreshing account:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while refreshing your account.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleRefresh}
      disabled={isRefreshing}
    >
      {showIcon && (
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''} ${size === 'sm' ? 'mr-1' : 'mr-2'}`} />
      )}
      {isRefreshing ? 'Refreshing...' : 'Refresh Account'}
    </Button>
  );
}
