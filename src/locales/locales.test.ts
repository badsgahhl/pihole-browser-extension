import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

const LOCALES = ['de', 'pt_BR'] as const

function load(locale: string): Map<string, string> {
  // Vitest runs from the project root; import.meta.url is not a usable file URL on Windows here.
  const text = readFileSync(resolve('src/locales', `${locale}.yml`), 'utf8')
  return flatten(parse(text))
}

function flatten(value: unknown, prefix = '', into = new Map<string, string>()): Map<string, string> {
  if (typeof value === 'object' && value !== null) {
    for (const [key, child] of Object.entries(value)) flatten(child, prefix ? `${prefix}.${key}` : key, into)
  } else {
    into.set(prefix, String(value))
  }
  return into
}

function substitutions(message: string): string[] {
  return [...message.matchAll(/\$\d/g)].map((match) => match[0]).sort()
}

const english = load('en')

describe.each(LOCALES)('%s locale', (locale) => {
  const messages = load(locale)

  it('has exactly the keys of the English source', () => {
    expect([...messages.keys()].sort()).toEqual([...english.keys()].sort())
  })

  it('uses the same substitutions as the English message', () => {
    const mismatched = [...english].filter(([key, message]) => {
      const translated = messages.get(key) ?? ''
      return substitutions(translated).join() !== substitutions(message).join()
    })
    expect(mismatched.map(([key]) => key)).toEqual([])
  })

  it('leaves no message empty', () => {
    expect([...messages].filter(([, message]) => message.trim() === '').map(([key]) => key)).toEqual([])
  })
})
