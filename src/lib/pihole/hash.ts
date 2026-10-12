const memo = new Map<string, Promise<string>>()

/** SHA-256 of a string as lowercase hex. Used to tie a cached session to the password it was made with. */
export function sha256Hex(text: string): Promise<string> {
  let pending = memo.get(text)
  if (!pending) {
    pending = crypto.subtle
      .digest('SHA-256', new TextEncoder().encode(text))
      .then((buffer) => Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join(''))
    memo.set(text, pending)
  }
  return pending
}
