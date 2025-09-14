import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import crypto from "crypto";
import { SecCamoufoxClient } from './sec-camoufox-client.js';

interface RequestOptions {
  method: 'GET' | 'POST';
  url: string;
  headers?: Record<string, string>;
  data?: any;
}

interface HttpResponse {
  data: any;
  status: number;
  headers: Record<string, string>;
}

export class SecHttpClient {
  private userAgent: string;
  private lastRequestTime: number = 0;
  private minDelay: number = 2000; // Minimum 2 seconds between requests
  private blocked: boolean = false;
  private blockUntil: number = 0;
  private cooldownDuration: number = 45 * 60 * 1000; // 45 minutes in milliseconds
  private camoufoxClient: SecCamoufoxClient;

  constructor() {
    // Generate a unique user agent for SEC compliance
    this.userAgent = `InsiderTrack Pro Analytics Bot v1.0 (contact@insidertrack.com)`;
    this.camoufoxClient = new SecCamoufoxClient();
  }

  async request(options: RequestOptions): Promise<HttpResponse> {
    // Use Camoufox for XML files, SEC APIs, and if we've been blocked recently
    const isXmlRequest = options.url.endsWith('.xml') || 
                        options.headers?.['Accept']?.includes('xml') ||
                        options.url.includes('/Archives/edgar/');
                        
    const isSecApiRequest = options.url.includes('sec.gov') || 
                           options.url.includes('efts.sec.gov');
                        
    const shouldUseCamoufox = isXmlRequest || isSecApiRequest || this.blocked;
    
    if (shouldUseCamoufox) {
      console.log('🦊 Using Camoufox for request:', options.url);
      try {
        const camoufoxResponse = await this.camoufoxClient.request({
          url: options.url,
          method: options.method,
          headers: {
            'Accept': options.headers?.['Accept'] || 'application/xml, text/xml, application/json, */*',
            ...options.headers
          },
          ...(options.data && { data: options.data })
        });
        
        console.log('✅ Camoufox request successful');
        console.log('🔍 [DEBUG] Camoufox response type:', typeof camoufoxResponse.data);
        console.log('🔍 [DEBUG] Camoufox response preview:', 
          typeof camoufoxResponse.data === 'string' 
            ? camoufoxResponse.data.substring(0, 200) + '...'
            : JSON.stringify(camoufoxResponse.data).substring(0, 200) + '...'
        );
        
        // Try to parse JSON if it's a string, handle HTML-wrapped JSON
        let parsedData = camoufoxResponse.data;
        if (typeof camoufoxResponse.data === 'string') {
          try {
            // Check if it's HTML-wrapped JSON (browser display format)
            if (camoufoxResponse.data.includes('<pre>') && camoufoxResponse.data.includes('</pre>')) {
              const preMatch = camoufoxResponse.data.match(/<pre>(.*?)<\/pre>/s);
              if (preMatch && preMatch[1]) {
                const jsonString = preMatch[1].trim();
                parsedData = JSON.parse(jsonString);
                console.log('✅ Successfully extracted and parsed JSON from HTML wrapper');
              } else {
                parsedData = JSON.parse(camoufoxResponse.data);
              }
            } else {
              parsedData = JSON.parse(camoufoxResponse.data);
            }
            console.log('✅ Successfully parsed JSON from Camoufox string response');
          } catch (error) {
            console.log('⚠️ Camoufox response is not valid JSON, using as-is');
          }
        }
        
        return {
          data: parsedData,
          status: 200,
          headers: {}
        };
      } catch (error) {
        console.log('❌ Camoufox failed, falling back to axios:', (error as Error).message);
        // Continue to axios fallback
      }
    }

    // Check if we're in cooldown period
    if (this.blocked && Date.now() < this.blockUntil) {
      const remainingTime = Math.ceil((this.blockUntil - Date.now()) / 1000 / 60);
      throw new Error(`SEC_BLOCKED: Still in cooldown period. ${remainingTime} minutes remaining.`);
    }

    // If cooldown expired, clear blocked state
    if (this.blocked && Date.now() >= this.blockUntil) {
      console.log('🟢 SEC cooldown expired, resuming requests');
      this.blocked = false;
      this.blockUntil = 0;
    }

    // Rate limiting - ensure minimum delay between requests
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.minDelay) {
      const waitTime = this.minDelay - timeSinceLastRequest;
      await this.delay(waitTime);
    }

    // Add jitter to avoid predictable patterns
    const jitter = Math.random() * 1000; // 0-1 second random delay
    await this.delay(jitter);

    const axiosConfig: AxiosRequestConfig = {
      method: options.method,
      url: options.url,
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'application/xml, text/xml, application/json, text/html, */*',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        ...options.headers
      },
      timeout: 30000, // 30 second timeout
      maxRedirects: 5,
      validateStatus: function (status) {
        return status >= 200 && status < 500; // Don't throw on 4xx errors
      }
    };

    if (options.data) {
      axiosConfig.data = options.data;
    }

    try {
      this.lastRequestTime = Date.now();
      
      const response: AxiosResponse = await axios(axiosConfig);

      // Check for SEC WAF blocking indicators
      if (this.isSecBlocked(response)) {
        this.enterCooldown();
        throw new Error('SEC_BLOCKED: WAF detected, entering cooldown period');
      }

      // Check for rate limiting indicators
      if (response.status === 429 || response.status === 503) {
        console.log('⚠️ SEC rate limiting detected, adding extra delay');
        await this.delay(5000); // Extra 5 second delay
      }

      return {
        data: response.data,
        status: response.status,
        headers: response.headers as Record<string, string>
      };

    } catch (error: any) {
      // Check if this is a network/timeout error that might indicate blocking
      if (error.code === 'ECONNRESET' || 
          error.code === 'ECONNREFUSED' || 
          error.code === 'ETIMEDOUT' ||
          error.message?.includes('timeout') ||
          error.message?.includes('Network Error')) {
        
        console.log('🔴 Network error detected, might be SEC blocking');
        this.enterCooldown();
        throw new Error('SEC_BLOCKED: Network error, entering cooldown period');
      }

      // Re-throw other errors
      throw error;
    }
  }

  private isSecBlocked(response: AxiosResponse): boolean {
    // Check various indicators that SEC WAF might be blocking us
    const content = typeof response.data === 'string' ? response.data : '';
    
    // Common WAF blocking indicators
    const blockingIndicators = [
      'access denied',
      'blocked',
      'security',
      'cloudflare',
      'ray id',
      '403 forbidden',
      'too many requests',
      'rate limit'
    ];

    const contentLower = content.toLowerCase();
    const hasBlockingIndicator = blockingIndicators.some(indicator => 
      contentLower.includes(indicator)
    );

    // Check for suspicious status codes
    const suspiciousStatus = response.status === 403 || 
                           response.status === 429 || 
                           response.status === 503;

    // Check for WAF-specific headers
    const hasWafHeaders = response.headers['cf-ray'] || 
                         response.headers['x-ratelimit-limit'] ||
                         response.headers['retry-after'];

    // If response is too small for a valid SEC document, might be blocked
    const tooSmall = content.length < 100 && response.status === 200;

    return hasBlockingIndicator || suspiciousStatus || hasWafHeaders || tooSmall;
  }

  private enterCooldown(): void {
    this.blocked = true;
    this.blockUntil = Date.now() + this.cooldownDuration;
    console.log(`🔴 SEC WAF blocked request - entering 45 minute cooldown`);
    console.log(`⏰ Will resume at: ${new Date(this.blockUntil).toLocaleTimeString()}`);
  }

  public isBlocked(): boolean {
    return this.blocked && Date.now() < this.blockUntil;
  }

  public getCooldownRemaining(): number {
    if (!this.blocked) return 0;
    return Math.max(0, this.blockUntil - Date.now());
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Method to manually clear cooldown (for testing)
  public clearCooldown(): void {
    this.blocked = false;
    this.blockUntil = 0;
    console.log('🟢 SEC cooldown manually cleared');
  }
}