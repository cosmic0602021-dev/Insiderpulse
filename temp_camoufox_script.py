
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
            page.set_extra_http_headers({"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0","Accept":"application/xml","Accept-Language":"en-US,en;q=0.9","Accept-Encoding":"gzip, deflate, br","Connection":"keep-alive","Upgrade-Insecure-Requests":"1","Sec-Fetch-Dest":"document","Sec-Fetch-Mode":"navigate","Sec-Fetch-Site":"none","Cache-Control":"no-cache"})
            
            # Navigate to the URL with shorter timeout for XML files
            response = page.goto('https://www.sec.gov/Archives/edgar/data/9631/000183988225050613/xslF345X04/ownership.xml', wait_until='domcontentloaded', timeout=30000)
            
            # For XML files, get the raw response
            if 'https://www.sec.gov/Archives/edgar/data/9631/000183988225050613/xslF345X04/ownership.xml'.endswith('.xml') or 'application/xml' in 'application/xml':
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
