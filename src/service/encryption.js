

function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(b64) {
  if (typeof b64 !== "string" || !b64.trim()) {
    throw new Error("Encryption key is missing");
  }
  const normalized = b64.trim();
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function getConfiguredAesKeyBase64() {
  try {
    return (
      import.meta.env.VITE_AUTH_KEY
    );
  } catch {
    return undefined;
  }
}

async function encryptPasswordAesGcm(password, aesKeyBase64) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Web Crypto API is not available in this browser/context");
  }

  const keyBytes = base64ToUint8Array(aesKeyBase64);
  if (keyBytes.byteLength !== 32) {
    throw new Error(
      `Invalid AES key length: expected 32 bytes for aes-256-gcm, got ${keyBytes.byteLength}`
    );
  }

  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const iv = new Uint8Array(12);
  globalThis.crypto.getRandomValues(iv);

  const encoded = new TextEncoder().encode(password);
  const cipherWithTagBuf = await globalThis.crypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    key,
    encoded
  );
  const cipherWithTag = new Uint8Array(cipherWithTagBuf);
  const tagLengthBytes = 16;
  if (cipherWithTag.length < tagLengthBytes) {
    throw new Error("Encryption failed: missing auth tag");
  }


  const ciphertext = cipherWithTag.slice(0, cipherWithTag.length - tagLengthBytes);
  const authTag = cipherWithTag.slice(cipherWithTag.length - tagLengthBytes);
  const combined = new Uint8Array(iv.length + authTag.length + ciphertext.length);
  combined.set(iv, 0);
  combined.set(authTag, iv.length);
  combined.set(ciphertext, iv.length + authTag.length);

  return arrayBufferToBase64(combined.buffer);
}

export async function encryptPassword(password, publicKeyPem) {
  const normalizedPassword = typeof password === "string" ? password : "";
  void publicKeyPem;

  const aesKeyBase64 = getConfiguredAesKeyBase64();
  if (aesKeyBase64) {
    return encryptPasswordAesGcm(normalizedPassword, aesKeyBase64);
  }

  return normalizedPassword;
}
