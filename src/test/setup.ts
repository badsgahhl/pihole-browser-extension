import { beforeEach, vi } from 'vitest'
import { fakeBrowser } from 'wxt/testing/fake-browser'

/**
 * APIs @webext-core/fake-browser does not implement. They are reinstalled before every test so
 * each test starts with fresh mocks. Tests that need other answers override them with mockResolvedValue.
 */
export function installBrowserStubs(): void {
  const target = fakeBrowser as unknown as Record<string, unknown>
  target.permissions = {
    contains: vi.fn(async () => true),
    request: vi.fn(async () => true),
    getAll: vi.fn(async () => ({ origins: [], permissions: [] })),
    remove: vi.fn(async () => true)
  }
  target.contextMenus = {
    removeAll: vi.fn(async () => undefined),
    create: vi.fn(() => 'id'),
    onClicked: { addListener: vi.fn(), removeListener: vi.fn() }
  }
  target.commands = {
    getAll: vi.fn(async () => []),
    onCommand: { addListener: vi.fn(), removeListener: vi.fn() }
  }
  target.i18n = {
    // Returns the message key so tests can assert on it without the real catalogue.
    getMessage: vi.fn((key: string, substitutions?: string | string[]) => {
      const subs = substitutions === undefined ? [] : Array.isArray(substitutions) ? substitutions : [substitutions]
      return subs.length > 0 ? `${key}:${subs.join(',')}` : key
    })
  }
  const runtime = fakeBrowser.runtime as unknown as Record<string, unknown>
  runtime.setUninstallURL ??= vi.fn(async () => undefined)
  runtime.openOptionsPage ??= vi.fn(async () => undefined)
}

// Every test starts from an empty fake browser: no storage, no listeners, no alarms.
beforeEach(() => {
  fakeBrowser.reset()
  installBrowserStubs()
})

// happy-dom implements none of these, and reka-ui's Popover/Dialog/Tooltip primitives reach for
// them while measuring, positioning and focusing.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver
window.IntersectionObserver ??= class {
  root = null
  rootMargin = ''
  thresholds = []
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
} as unknown as typeof IntersectionObserver

Element.prototype.scrollIntoView ??= vi.fn()
Element.prototype.hasPointerCapture ??= () => false
Element.prototype.setPointerCapture ??= () => {}
Element.prototype.releasePointerCapture ??= () => {}
