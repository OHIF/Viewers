function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

/**
 * Decodes a JWT token without verifying the signature.
 * Signature verification should happen on the server.
 */
export function decodeJWT(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [, payloadB64] = parts;

    // Decode payload
    const payload = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(
          base64UrlDecode(payloadB64),
          c => c.charCodeAt(0)
        )
      )
    );

    return payload;
  } catch (error) {
    console.error('JWT decoding error:', error);
    throw error;
  }
}
