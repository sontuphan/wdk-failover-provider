import { detectRuntime } from 'noba'

const runtime = detectRuntime()

if (runtime === 'bare') await import('bare-node-runtime/global')

/**
 * @type {ImportAttributes}
 */
export const shims = runtime === 'bare' ? { imports: 'bare-node-runtime/imports' } : {}
