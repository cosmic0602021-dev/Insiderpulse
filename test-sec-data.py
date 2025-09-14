#!/usr/bin/env python3
"""
Test script to fetch actual SEC Form 4 data using Camoufox
"""
import json
import time
from camoufox.sync_api import Camoufox

def test_sec_form4_data():
    try:
        print("🦊 Testing SEC Form 4 data retrieval...")
        
        # Known Form 4 filing URL (the CorMedix one we've been seeing)
        form4_url = "https://www.sec.gov/Archives/edgar/data/1774807/000121390025087374/ownership.xml"
        
        with Camoufox(
            headless=True,
            humanize=True,
            i_know_what_im_doing=True  # Suppress WebGL warning
        ) as browser:
            page = browser.new_page()
            
            # Set realistic headers
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0',
                'Accept': 'application/xml, text/xml, */*',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
            }
            page.set_extra_http_headers(headers)
            
            print(f"🔍 Fetching Form 4 data from: {form4_url}")
            response = page.goto(form4_url, wait_until='networkidle')
            
            print(f"✅ Response status: {response.status}")
            
            # Get the XML content
            content = page.content()
            
            # Check if we got valid XML
            if content.strip().startswith('<?xml') and '<ownershipDocument>' in content:
                print("✅ Successfully retrieved Form 4 XML data!")
                print(f"📄 Data length: {len(content)} characters")
                
                # Extract some key info to verify it's working
                if 'CorMedix' in content:
                    print("✅ Found CorMedix data - matches our database!")
                if 'Todisco' in content:
                    print("✅ Found Todisco trader - data is correct!")
                    
                # Show first 500 characters
                print("📋 Sample data:")
                print(content[:500] + "...")
                
                return True
            elif 'access denied' in content.lower() or 'blocked' in content.lower():
                print("🔴 Request was blocked by WAF!")
                return False
            else:
                print(f"⚠️ Unexpected response format. Length: {len(content)}")
                print("📋 First 200 characters:")
                print(content[:200])
                return False
                
    except Exception as e:
        print(f"❌ SEC Form 4 test failed: {e}")
        return False

def test_sec_search_api():
    """Test SEC search API that gives us filing URLs"""
    try:
        print("🔍 Testing SEC search API...")
        
        # SEC Full-Text Search API (the one that was getting blocked)
        search_url = "https://efts.sec.gov/LATEST/search-index"
        
        with Camoufox(
            headless=True,
            humanize=True,
            i_know_what_im_doing=True
        ) as browser:
            page = browser.new_page()
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0',
                'Accept': 'application/json, */*',
                'Accept-Language': 'en-US,en;q=0.5',
                'Content-Type': 'application/json',
            }
            page.set_extra_http_headers(headers)
            
            print(f"🔍 Testing search API: {search_url}")
            
            # Prepare search data (looking for recent Form 4 filings)
            search_data = {
                "dateRange": "30d",
                "category": "form-cat",
                "forms": ["4"],
                "from": 0,
                "size": 10
            }
            
            # POST the search query
            response = page.request.post(search_url, data=json.dumps(search_data))
            
            print(f"✅ Search API status: {response.status}")
            
            if response.status == 200:
                result = response.json()
                hits = result.get('hits', {}).get('hits', [])
                print(f"✅ Found {len(hits)} recent Form 4 filings!")
                
                for i, hit in enumerate(hits[:3]):  # Show first 3
                    source = hit.get('_source', {})
                    print(f"  {i+1}. {source.get('display_names', ['Unknown'])[0]} - {source.get('ciks', ['Unknown'])[0]}")
                
                return True
            else:
                print(f"🔴 Search API failed with status {response.status}")
                return False
                
    except Exception as e:
        print(f"❌ SEC search API test failed: {e}")
        return False

if __name__ == '__main__':
    print("🧪 Starting comprehensive SEC data tests with Camoufox...")
    
    # Test 1: Direct XML retrieval
    success1 = test_sec_form4_data()
    time.sleep(3)  # Be respectful
    
    # Test 2: Search API 
    success2 = test_sec_search_api()
    
    if success1 and success2:
        print("🎉 All SEC data tests passed! Camoufox can bypass the WAF!")
    elif success1:
        print("✅ XML retrieval works, but search API still blocked")
    elif success2:
        print("✅ Search API works, but XML retrieval has issues")
    else:
        print("💥 All tests failed - WAF still blocking Camoufox")