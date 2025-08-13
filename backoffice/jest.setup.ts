import "@testing-library/jest-dom"
import fetch from 'cross-fetch'

const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
global.fetch = fetch
