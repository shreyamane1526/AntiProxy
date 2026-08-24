import jsQR from "jsqr"

/**
 * Parses raw QR string payload to extract sessionId and token.
 * Expected formats:
 * - https://domain/attendance/scan?sessionId=XYZ&token=ABC
 * - attendance://session/XYZ?token=ABC
 * - Query string: sessionId=XYZ&token=ABC
 * - JSON: { "sessionId": "XYZ", "token": "ABC" }
 */
export function parseQRPayload(rawPayload) {
  if (!rawPayload || typeof rawPayload !== "string") {
    console.log(`[QR-PARSE] No input`)
    return { error: "QR_NOT_DETECTED" }
  }

  const str = rawPayload.trim()
  console.log(`[QR-PARSE] input="${str}"`)

  // Case 1: JSON payload
  if (str.startsWith("{") && str.endsWith("}")) {
    try {
      const parsed = JSON.parse(str)
      const sessionId = parsed.sessionId || parsed.sid
      const token = parsed.token || parsed.tok
      if (sessionId && token) {
        console.log(`[QR-PARSE] JSON: sessionId=${sessionId}, token=${token}`)
        return { sessionId: String(sessionId).trim(), token: String(token).trim() }
      }
    } catch (e) {}
  }

  // Case 2: Deep link (e.g. attendance://session/S123?token=T456)
  if (str.includes("session/")) {
    try {
      const parts = str.split("session/")[1].split("?token=")
      const sessionId = parts[0]
      const token = parts[1] ? parts[1].split("&")[0] : null
      console.log(`[QR-PARSE] deep link: sessionId=${sessionId}, token=${token}`)
      if (sessionId && token) {
        return { sessionId: sessionId.trim(), token: token.trim() }
      }
    } catch (e) {}
  }

  // Case 3: URL with query parameters (e.g. ?sessionId=X&token=Y or ?sid=X&token=Y)
  if (str.includes("sessionId=") || str.includes("token=")) {
    try {
      const urlString = str.includes("://") ? str : `https://dummy.dev/${str.startsWith("?") ? str : "?" + str}`
      const url = new URL(urlString)
      const sessionId = url.searchParams.get("sessionId") || url.searchParams.get("sid")
      const token = url.searchParams.get("token") || url.searchParams.get("tok")

      if (sessionId && token) {
        console.log(`[QR-PARSE] URL params: sessionId=${sessionId}, token=${token}`)
        return { sessionId: sessionId.trim(), token: token.trim() }
      }
    } catch (e) {}
  }

  console.log(`[QR-PARSE] FAILED to parse: raw=${str}`)
  return { error: "INVALID_QR_FORMAT" }
}

/**
 * Decodes a QR code from HTMLCanvasElement or ImageData using jsQR.
 * Returns { rawPayload, sessionId, token } or { error: 'QR_NOT_DETECTED' | 'INVALID_QR_FORMAT' }
 */
export function decodeQRFromImageData(imageData) {
  if (!imageData || !imageData.data || !imageData.width || !imageData.height) {
    return { error: "QR_NOT_DETECTED" }
  }

  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "attemptBoth",
  })

  if (!code || !code.data) {
    return { error: "QR_NOT_DETECTED" }
  }

  const rawPayload = code.data
  console.log(`[QR-DECODE] jsQR returned: ${rawPayload}`)
  const parsed = parseQRPayload(rawPayload)

  if (parsed.error) {
    return { error: parsed.error, rawPayload }
  }

  return {
    rawPayload,
    sessionId: parsed.sessionId,
    token: parsed.token,
  }
}

/**
 * Decodes a QR code from an Image File (PNG, JPG, JPEG, WEBP).
 */
export function decodeQRFromImageFile(file) {
  return new Promise((resolve) => {
    if (!file) {
      resolve({ error: "QR_NOT_DETECTED" })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0, img.width, img.height)

        try {
          const imageData = ctx.getImageData(0, 0, img.width, img.height)
          const result = decodeQRFromImageData(imageData)
          resolve(result)
        } catch (err) {
          resolve({ error: "QR_NOT_DETECTED" })
        }
      }
      img.onerror = () => resolve({ error: "QR_NOT_DETECTED" })
      img.src = event.target.result
    }
    reader.onerror = () => resolve({ error: "QR_NOT_DETECTED" })
    reader.readAsDataURL(file)
  })
}
