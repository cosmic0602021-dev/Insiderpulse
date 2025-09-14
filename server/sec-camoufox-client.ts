import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

interface CamoufoxRequestOptions {
  url: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  data?: any;
  timeout?: number;
}

interface CamoufoxResponse {
  data: any;
  status: number;
  headers: Record<string, string>;
}

export class SecCamoufoxClient {
  private blocked: boolean = false;
  private blockUntil: number = 0;
  private cooldownDuration: number = 45 * 60 * 1000; // 45 minutes
  private lastRequestTime: number = 0;
  private minDelay: number = 3000; // 3 seconds between requests

  constructor() {
    console.log('🦊 SecCamoufoxClient initialized');
  }

  async request(options: CamoufoxRequestOptions): Promise<CamoufoxResponse> {
    // Check cooldown
    if (this.blocked && Date.now() < this.blockUntil) {
      const remainingTime = Math.ceil((this.blockUntil - Date.now()) / 1000 / 60);
      throw new Error(`SEC_BLOCKED: Still in cooldown period. ${remainingTime} minutes remaining.`);
    }

    // Clear cooldown if expired
    if (this.blocked && Date.now() >= this.blockUntil) {
      console.log('🟢 SEC cooldown expired, resuming requests with Camoufox');
      this.blocked = false;
      this.blockUntil = 0;
    }

    // Rate limiting
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.minDelay) {
      const waitTime = this.minDelay - timeSinceLastRequest;
      await this.delay(waitTime);
    }

    // Add random jitter
    const jitter = Math.random() * 2000; // 0-2 second random delay
    await this.delay(jitter);

    try {
      console.log(`🦊 Making Camoufox request to: ${options.url}`);
      
      // Create a temporary Python script to run Camoufox
      const pythonScript = this.generatePythonScript(options);
      const scriptPath = path.join(process.cwd(), 'temp_camoufox_script.py');
      
      fs.writeFileSync(scriptPath, pythonScript);
      
      // Execute the Python script
      const { stdout, stderr } = await execAsync(`cd ${process.cwd()} && python ${scriptPath}`);
      
      // Clean up temp file
      fs.unlinkSync(scriptPath);
      
      if (stderr && stderr.includes('error')) {
        console.error('🔴 Camoufox error:', stderr);
        throw new Error(`Camoufox execution error: ${stderr}`);
      }

      // Parse the response
      const response = JSON.parse(stdout.trim());
      this.lastRequestTime = Date.now();

      // Check for WAF blocking indicators
      if (this.isWafBlocked(response)) {
        console.log('🔴 SEC WAF blocked request - entering 45 minute cooldown');
        this.blocked = true;
        this.blockUntil = Date.now() + this.cooldownDuration;
        const resumeTime = new Date(this.blockUntil).toLocaleTimeString();
        console.log(`⏰ Will resume at: ${resumeTime}`);
        throw new Error('SEC_BLOCKED: WAF detected, entering cooldown period');
      }

      console.log('✅ Camoufox request successful');
      return response;

    } catch (error) {
      console.error('❌ Camoufox request failed:', error);
      
      // Check if it's a WAF blocking error
      if (error instanceof Error && (
        error.message.includes('blocked') ||
        error.message.includes('captcha') ||
        error.message.includes('cloudflare') ||
        error.message.includes('Access Denied')
      )) {
        console.log('🔴 SEC WAF blocked request - entering 45 minute cooldown');
        this.blocked = true;
        this.blockUntil = Date.now() + this.cooldownDuration;
        const resumeTime = new Date(this.blockUntil).toLocaleTimeString();
        console.log(`⏰ Will resume at: ${resumeTime}`);
        throw new Error('SEC_BLOCKED: WAF detected, entering cooldown period');
      }
      
      throw error;
    }
  }

  private generatePythonScript(options: CamoufoxRequestOptions): string {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0',
      'Accept': 'application/xml, text/xml, application/json, text/html, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'no-cache',
      ...options.headers
    };

    return `
import json
import sys
import time
from camoufox.sync_api import Camoufox

def make_request():
    try:
        # Use Camoufox with stealth features
        with Camoufox(
            headless=True,
            humanize=True,  # Add human-like behavior
            i_know_what_im_doing=True,  # Suppress WebGL warning
        ) as browser:
            page = browser.new_page()
            
            # Set extra headers
            page.set_extra_http_headers(${JSON.stringify(headers)})
            
            # Navigate to the URL with shorter timeout for XML files
            response = page.goto('${options.url}', wait_until='domcontentloaded', timeout=30000)
            
            # For XML files, get the raw response
            if '${options.url}'.endswith('.xml') or 'application/xml' in '${options.headers?.Accept || ''}':
                # This is likely an XML file, get the raw content
                raw_content = page.content()
                
                # Clean up the content - remove any HTML wrapper
                if raw_content.strip().startswith('<html'):
                    # Extract XML from HTML body
                    start = raw_content.find('<ownershipDocument>')
                    if start > -1:
                        end = raw_content.find('</ownershipDocument>') + len('</ownershipDocument>')
                        raw_content = raw_content[start:end]
                    else:
                        # Look for any XML content
                        start = raw_content.find('<?xml')
                        if start > -1:
                            raw_content = raw_content[start:]
                
                data = raw_content.strip()
            else:
                # Regular page content
                data = page.content()
            
            result = {
                'data': data,
                'status': response.status,
                'headers': dict(response.headers) if response.headers else {}
            }
            
            print(json.dumps(result, ensure_ascii=False))
            
    except Exception as e:
        error_result = {
            'data': None,
            'status': 500,
            'headers': {},
            'error': str(e)
        }
        print(json.dumps(error_result))

if __name__ == '__main__':
    make_request()
`;
  }

  private isWafBlocked(response: CamoufoxResponse): boolean {
    const content = response.data?.toString().toLowerCase() || '';
    const status = response.status;
    
    // Check for common WAF blocking indicators
    return (
      status === 403 ||
      status === 429 ||
      status === 503 ||
      content.includes('access denied') ||
      content.includes('blocked') ||
      content.includes('cloudflare') ||
      content.includes('captcha') ||
      content.includes('ray id') ||
      content.includes('error 1020') ||
      content.includes('attention required')
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Clear blocked state (for manual intervention)
  clearBlocked(): void {
    this.blocked = false;
    this.blockUntil = 0;
    console.log('🟢 SEC cooldown manually cleared (Camoufox)');
  }

  isBlocked(): boolean {
    return this.blocked && Date.now() < this.blockUntil;
  }

  getBlockedUntil(): number {
    return this.blockUntil;
  }
}