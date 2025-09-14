#!/usr/bin/env python3
"""
Simple test script to verify Camoufox works with SEC website
"""
import json
import time
from camoufox.sync_api import Camoufox

def test_sec_access():
    try:
        print("🦊 Starting Camoufox test...")
        
        # Test with a simple SEC page first
        with Camoufox(
            headless=True,
            humanize=True,  # Add human-like behavior
            block_webgl=True,  # Block WebGL fingerprinting
        ) as browser:
            page = browser.new_page()
            
            # Set realistic headers
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }
            page.set_extra_http_headers(headers)
            
            print("🔍 Testing SEC main page...")
            response = page.goto('https://www.sec.gov/', wait_until='networkidle')
            
            print(f"✅ Response status: {response.status}")
            
            # Check if we got blocked
            content = page.content()
            if 'access denied' in content.lower() or 'blocked' in content.lower():
                print("🔴 Request was blocked!")
                return False
            else:
                print("✅ Request successful - no blocking detected")
                
            # Wait a bit
            time.sleep(2)
            
            # Now try a specific SEC filing search
            print("🔍 Testing SEC EDGAR search...")
            response2 = page.goto('https://www.sec.gov/edgar/searchedgar/companysearch.html', wait_until='networkidle')
            print(f"✅ EDGAR search status: {response2.status}")
            
            content2 = page.content()
            if 'access denied' in content2.lower() or 'blocked' in content2.lower():
                print("🔴 EDGAR search was blocked!")
                return False
            else:
                print("✅ EDGAR search successful - no blocking detected")
                
            return True
            
    except Exception as e:
        print(f"❌ Camoufox test failed: {e}")
        return False

if __name__ == '__main__':
    success = test_sec_access()
    if success:
        print("🎉 Camoufox SEC test completed successfully!")
    else:
        print("💥 Camoufox SEC test failed!")