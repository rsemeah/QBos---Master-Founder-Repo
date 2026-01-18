#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

function stableStringify(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj)
  if (Array.isArray(obj)) return '[' + obj.map(stableStringify).join(',') + ']'
  const keys = Object.keys(obj).sort()
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',') + '}'
}

function verifyReceiptFile(fp, pubkeyPem) {
  const data = JSON.parse(fs.readFileSync(fp, 'utf8'))
  if (!data.payload || !data.signature) throw new Error('missing payload or signature')
  const payloadString = stableStringify(data.payload)
  const payloadBuf = Buffer.from(payloadString, 'utf8')
  const sigBuf = Buffer.from(data.signature, 'base64')
  const publicKey = crypto.createPublicKey(pubkeyPem)
  const ok = crypto.verify(null, payloadBuf, publicKey, sigBuf)
  return ok
}

function main() {
  const receiptsDir = path.resolve('.robby/receipts')
  if (!fs.existsSync(receiptsDir)) {
    console.error('No receipts directory found at .robby/receipts')
    process.exit(1)
  }

  const pubkey = process.env.RECEIPT_VERIFY_PUBKEY
  if (!pubkey) {
    console.error('Missing RECEIPT_VERIFY_PUBKEY env secret (set in Actions secrets)')
    process.exit(2)
  }

  const files = fs.readdirSync(receiptsDir).filter(f => f.endsWith('.json'))
  if (files.length === 0) {
    console.error('No receipt JSON files found in .robby/receipts')
    process.exit(1)
  }

  let failed = false

  for (const file of files) {
    const fp = path.join(receiptsDir, file)
    try {
      const ok = verifyReceiptFile(fp, pubkey)
      if (!ok) {
        console.error(`${file}: signature verification FAILED`)
        failed = true
      } else {
        console.log(`${file}: signature verified`)
      }
    } catch (err) {
      console.error(`${file}: verification error:`, err.message)
      failed = true
    }
  }

  if (failed) process.exit(1)
  console.log('All receipts verified')
}

main()
#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

function stableStringify(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj)
  if (Array.isArray(obj)) return '[' + obj.map(stableStringify).join(',') + ']'
  const keys = Object.keys(obj).sort()
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',') + '}'
}

function verifyReceiptFile(fp, pubkeyPem) {
  const data = JSON.parse(fs.readFileSync(fp, 'utf8'))
  if (!data.payload || !data.signature) throw new Error('missing payload or signature')
  const payloadString = stableStringify(data.payload)
  const payloadBuf = Buffer.from(payloadString, 'utf8')
  const sigBuf = Buffer.from(data.signature, 'base64')
  const publicKey = crypto.createPublicKey(pubkeyPem)
  const ok = crypto.verify(null, payloadBuf, publicKey, sigBuf)
  return ok
}

function main() {
  const receiptsDir = path.resolve('.robby/receipts')
  if (!fs.existsSync(receiptsDir)) {
    console.error('No receipts directory found at .robby/receipts')
    process.exit(1)
  }

  const pubkey = process.env.RECEIPT_VERIFY_PUBKEY
  if (!pubkey) {
    console.error('Missing RECEIPT_VERIFY_PUBKEY env secret (set in Actions secrets)')
    process.exit(2)
  }

  const files = fs.readdirSync(receiptsDir).filter(f => f.endsWith('.json'))
  if (files.length === 0) {
    console.error('No receipt JSON files found in .robby/receipts')
    process.exit(1)
  }

  let failed = false

  for (const file of files) {
    const fp = path.join(receiptsDir, file)
    try {
      const ok = verifyReceiptFile(fp, pubkey)
      if (!ok) {
        console.error(`${file}: signature verification FAILED`)
        failed = true
      } else {
        console.log(`${file}: signature verified`)
      }
    } catch (err) {
      console.error(`${file}: verification error:`, err.message)
      failed = true
    }
  }

  if (failed) process.exit(1)
  console.log('All receipts verified')
}

main()
#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

function stableStringify(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj)
  if (Array.isArray(obj)) return '[' + obj.map(stableStringify).join(',') + ']'
  const keys = Object.keys(obj).sort()
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',') + '}'
}

function verifyReceiptFile(fp, pubkeyPem) {
  const data = JSON.parse(fs.readFileSync(fp, 'utf8'))
  if (!data.payload || !data.signature) throw new Error('missing payload or signature')
  const payloadString = stableStringify(data.payload)
  const payloadBuf = Buffer.from(payloadString, 'utf8')
  const sigBuf = Buffer.from(data.signature, 'base64')
  const publicKey = crypto.createPublicKey(pubkeyPem)
  const ok = crypto.verify(null, payloadBuf, publicKey, sigBuf)
  return ok
}

function main() {
  const receiptsDir = path.resolve('.robby/receipts')
  if (!fs.existsSync(receiptsDir)) {
    console.error('No receipts directory found at .robby/receipts')
    process.exit(1)
  }

  const pubkey = process.env.RECEIPT_VERIFY_PUBKEY
  if (!pubkey) {
    console.error('Missing RECEIPT_VERIFY_PUBKEY env secret (set in Actions secrets)')
    process.exit(2)
  }

  const files = fs.readdirSync(receiptsDir).filter(f => f.endsWith('.json'))
  if (files.length === 0) {
    console.error('No receipt JSON files found in .robby/receipts')
    process.exit(1)
  }

  let failed = false

  for (const file of files) {
    const fp = path.join(receiptsDir, file)
    try {
      const ok = verifyReceiptFile(fp, pubkey)
      if (!ok) {
        console.error(`${file}: signature verification FAILED`)
        failed = true
      } else {
        console.log(`${file}: signature verified`)
      }
    } catch (err) {
      console.error(`${file}: verification error:`, err.message)
      failed = true
    }
  }

  if (failed) process.exit(1)
  console.log('All receipts verified')
}

main()

