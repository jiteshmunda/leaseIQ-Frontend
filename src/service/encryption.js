function pemToArrayBuffer(publicKeyPem) {
  if (!publicKeyPem || typeof publicKeyPem !== "string") {
    throw new Error("Public key is missing");
  }

  const b64 = publicKeyPem
    .replace(/-----BEGIN PUBLIC KEY-----/g, "")
    .replace(/-----END PUBLIC KEY-----/g, "")
    .replace(/\s+/g, "");

  if (!b64) {
    throw new Error(
      "Invalid public key format. Expected PEM with BEGIN PUBLIC KEY header."
    );
  }

  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function importRsaPublicKey(publicKeyPem) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Web Crypto API is not available in this browser/context");
  }

  const keyData = pemToArrayBuffer(publicKeyPem);

  return globalThis.crypto.subtle.importKey(
    "spki",
    keyData,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );
}

function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function encryptPassword(password, publicKeyPem) {
  const key = await importRsaPublicKey(publicKeyPem);
  const encoded = new TextEncoder().encode(password);
  const ciphertext = await globalThis.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    key,
    encoded
  );
  return arrayBufferToBase64(ciphertext);
}
