#!/usr/bin/env node
// mdash URL opener — self-contained, no dependencies
// Usage: node open.mjs <markdown-file>

import { readFileSync } from 'fs'
import { execSync } from 'child_process'
import { platform } from 'os'

// --- Embedded lz-string compressToEncodedURIComponent ---
// Extracted from lz-string 1.5.0 (WTFPL license)

const keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$"

function compressToEncodedURIComponent(input) {
  if (input == null) return ""
  return _compress(input, 6, (a) => keyStr.charAt(a))
}

function _compress(uncompressed, bitsPerChar, getCharFromInt) {
  if (uncompressed == null) return ""
  let i, value
  const context_dictionary = {}
  const context_dictionaryToCreate = {}
  let context_c = ""
  let context_wc = ""
  let context_w = ""
  let context_enlargeIn = 2
  let context_dictSize = 3
  let context_numBits = 2
  const context_data = []
  let context_data_val = 0
  let context_data_position = 0

  for (let ii = 0; ii < uncompressed.length; ii++) {
    context_c = uncompressed.charAt(ii)
    if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
      context_dictionary[context_c] = context_dictSize++
      context_dictionaryToCreate[context_c] = true
    }
    context_wc = context_w + context_c
    if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
      context_w = context_wc
    } else {
      if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
        if (context_w.charCodeAt(0) < 256) {
          for (i = 0; i < context_numBits; i++) {
            context_data_val = (context_data_val << 1)
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0
              context_data.push(getCharFromInt(context_data_val))
              context_data_val = 0
            } else { context_data_position++ }
          }
          value = context_w.charCodeAt(0)
          for (i = 0; i < 8; i++) {
            context_data_val = (context_data_val << 1) | (value & 1)
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0
              context_data.push(getCharFromInt(context_data_val))
              context_data_val = 0
            } else { context_data_position++ }
            value = value >> 1
          }
        } else {
          value = 1
          for (i = 0; i < context_numBits; i++) {
            context_data_val = (context_data_val << 1) | value
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0
              context_data.push(getCharFromInt(context_data_val))
              context_data_val = 0
            } else { context_data_position++ }
            value = 0
          }
          value = context_w.charCodeAt(0)
          for (i = 0; i < 16; i++) {
            context_data_val = (context_data_val << 1) | (value & 1)
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0
              context_data.push(getCharFromInt(context_data_val))
              context_data_val = 0
            } else { context_data_position++ }
            value = value >> 1
          }
        }
        context_enlargeIn--
        if (context_enlargeIn == 0) {
          context_enlargeIn = Math.pow(2, context_numBits)
          context_numBits++
        }
        delete context_dictionaryToCreate[context_w]
      } else {
        value = context_dictionary[context_w]
        for (i = 0; i < context_numBits; i++) {
          context_data_val = (context_data_val << 1) | (value & 1)
          if (context_data_position == bitsPerChar - 1) {
            context_data_position = 0
            context_data.push(getCharFromInt(context_data_val))
            context_data_val = 0
          } else { context_data_position++ }
          value = value >> 1
        }
      }
      context_enlargeIn--
      if (context_enlargeIn == 0) {
        context_enlargeIn = Math.pow(2, context_numBits)
        context_numBits++
      }
      context_dictionary[context_wc] = context_dictSize++
      context_w = String(context_c)
    }
  }
  if (context_w !== "") {
    if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
      if (context_w.charCodeAt(0) < 256) {
        for (i = 0; i < context_numBits; i++) {
          context_data_val = (context_data_val << 1)
          if (context_data_position == bitsPerChar - 1) {
            context_data_position = 0
            context_data.push(getCharFromInt(context_data_val))
            context_data_val = 0
          } else { context_data_position++ }
        }
        value = context_w.charCodeAt(0)
        for (i = 0; i < 8; i++) {
          context_data_val = (context_data_val << 1) | (value & 1)
          if (context_data_position == bitsPerChar - 1) {
            context_data_position = 0
            context_data.push(getCharFromInt(context_data_val))
            context_data_val = 0
          } else { context_data_position++ }
          value = value >> 1
        }
      } else {
        value = 1
        for (i = 0; i < context_numBits; i++) {
          context_data_val = (context_data_val << 1) | value
          if (context_data_position == bitsPerChar - 1) {
            context_data_position = 0
            context_data.push(getCharFromInt(context_data_val))
            context_data_val = 0
          } else { context_data_position++ }
          value = 0
        }
        value = context_w.charCodeAt(0)
        for (i = 0; i < 16; i++) {
          context_data_val = (context_data_val << 1) | (value & 1)
          if (context_data_position == bitsPerChar - 1) {
            context_data_position = 0
            context_data.push(getCharFromInt(context_data_val))
            context_data_val = 0
          } else { context_data_position++ }
          value = value >> 1
        }
      }
      context_enlargeIn--
      if (context_enlargeIn == 0) {
        context_enlargeIn = Math.pow(2, context_numBits)
        context_numBits++
      }
      delete context_dictionaryToCreate[context_w]
    } else {
      value = context_dictionary[context_w]
      for (i = 0; i < context_numBits; i++) {
        context_data_val = (context_data_val << 1) | (value & 1)
        if (context_data_position == bitsPerChar - 1) {
          context_data_position = 0
          context_data.push(getCharFromInt(context_data_val))
          context_data_val = 0
        } else { context_data_position++ }
        value = value >> 1
      }
    }
    context_enlargeIn--
    if (context_enlargeIn == 0) {
      context_numBits++
    }
  }
  value = 2
  for (i = 0; i < context_numBits; i++) {
    context_data_val = (context_data_val << 1) | (value & 1)
    if (context_data_position == bitsPerChar - 1) {
      context_data_position = 0
      context_data.push(getCharFromInt(context_data_val))
      context_data_val = 0
    } else { context_data_position++ }
    value = value >> 1
  }
  while (true) {
    context_data_val = (context_data_val << 1)
    if (context_data_position == bitsPerChar - 1) {
      context_data.push(getCharFromInt(context_data_val))
      break
    } else { context_data_position++ }
  }
  return context_data.join('')
}

// --- Main ---

const file = process.argv[2]
if (!file) {
  console.error('Usage: node open.mjs <markdown-file>')
  process.exit(1)
}

const content = readFileSync(file, 'utf8')
const hash = compressToEncodedURIComponent(content)
const url = `https://mdash.zweibel-cocaine.com/#${hash}`

const os = platform()
const cmd = os === 'darwin' ? `open "${url}"`
  : os === 'win32' ? `start "" "${url}"`
  : `xdg-open "${url}"`

execSync(cmd)
