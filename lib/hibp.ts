export async function checkPasswordBreach(password: string): Promise<number> {
  if (!password || password.length < 8) {
    return 0; // Don't check extremely short passwords or empty ones
  }

  try {
    // Hash the password with SHA-1 using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    
    // Convert ArrayBuffer to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    
    // k-anonymity: send only the first 5 characters
    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);
    
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      // Add cache handling if needed, though HIBP handles caching well via Cloudflare
      cache: 'force-cache'
    });
    
    if (!response.ok) {
      throw new Error(`HIBP API error: ${response.status}`);
    }
    
    const text = await response.text();
    
    // Parse the response which is in format: SUFFIX:COUNT\nSUFFIX:COUNT
    const lines = text.split('\n');
    for (const line of lines) {
      const [returnedSuffix, count] = line.trim().split(':');
      if (returnedSuffix === suffix) {
        return parseInt(count, 10);
      }
    }
    
    return 0; // Not found in breaches
  } catch (error) {
    console.error('Failed to check password breach status:', error);
    // Return a negative number to indicate a network/API failure so the UI can handle it gracefully
    return -1;
  }
}
