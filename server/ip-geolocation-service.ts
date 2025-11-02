import axios from 'axios';

interface GeolocationData {
  country: string; // ISO code (e.g., "US", "KR")
  countryName: string; // Full name
  region: string;
  city: string;
}

class IPGeolocationService {
  private cache: Map<string, GeolocationData> = new Map();

  /**
   * Get geolocation data for an IP address
   * Uses ip-api.com free API (45 requests per minute limit)
   */
  async getLocation(ipAddress: string): Promise<GeolocationData | null> {
    // Check cache first
    if (this.cache.has(ipAddress)) {
      return this.cache.get(ipAddress)!;
    }

    // Skip localhost/private IPs
    if (
      ipAddress === '127.0.0.1' ||
      ipAddress === 'localhost' ||
      ipAddress === '::1' ||
      ipAddress?.startsWith('192.168.') ||
      ipAddress?.startsWith('10.') ||
      ipAddress?.startsWith('172.')
    ) {
      const localData: GeolocationData = {
        country: 'LOCAL',
        countryName: 'Local Development',
        region: 'Local',
        city: 'Local',
      };
      this.cache.set(ipAddress, localData);
      return localData;
    }

    try {
      // Use ip-api.com free API
      const response = await axios.get(`http://ip-api.com/json/${ipAddress}`, {
        timeout: 5000,
      });

      if (response.data.status === 'success') {
        const locationData: GeolocationData = {
          country: response.data.countryCode || 'Unknown',
          countryName: response.data.country || 'Unknown',
          region: response.data.regionName || 'Unknown',
          city: response.data.city || 'Unknown',
        };

        // Cache the result
        this.cache.set(ipAddress, locationData);
        return locationData;
      }

      console.warn(`Geolocation failed for IP ${ipAddress}:`, response.data.message);
      return null;
    } catch (error) {
      console.error(`Failed to get geolocation for IP ${ipAddress}:`, error);
      return null;
    }
  }

  /**
   * Extract IP address from Express request
   */
  getClientIP(req: any): string {
    return (
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      '127.0.0.1'
    );
  }
}

export const ipGeolocationService = new IPGeolocationService();
