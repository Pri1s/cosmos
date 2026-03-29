import { describe, expect, test } from 'vitest'
import {
  buildGenerateContentRequest,
  buildRequestContext,
  extractGenerateContentText,
  getLocalGuideResponse,
  trimConversationHistory,
  toGeminiContents,
} from './stella.js'

describe('toGeminiContents', () => {
  test('maps local chat roles to Gemini roles', () => {
    expect(toGeminiContents([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
    ])).toEqual([
      { role: 'user', parts: [{ text: 'Hello' }] },
      { role: 'model', parts: [{ text: 'Hi there' }] },
    ])
  })
})

describe('trimConversationHistory', () => {
  test('keeps only the most recent turns and truncates oversized messages', () => {
    const history = Array.from({ length: 8 }, (_, index) => ({
      role: index % 2 === 0 ? 'user' : 'assistant',
      content: `${index}: ${'x'.repeat(400)}`,
    }))

    const trimmed = trimConversationHistory(history)

    expect(trimmed).toHaveLength(6)
    expect(trimmed[0].content.startsWith('2:')).toBe(true)
    expect(trimmed.at(-1).content.endsWith('…')).toBe(true)
  })
})

describe('buildGenerateContentRequest', () => {
  test('builds a Gemini payload with compact context and thinking disabled', () => {
    const now = new Date('2026-03-29T12:00:00Z')
    const payload = buildGenerateContentRequest([
      { role: 'user', content: 'Tell me about JWST.' },
    ], {
      selectedNode: { id: 'jwst' },
      now,
    })

    expect(payload.contents).toEqual([
      { role: 'user', parts: [{ text: 'Tell me about JWST.' }] },
    ])
    expect(payload.system_instruction.parts[0].text).toContain('You are Stella')
    expect(payload.system_instruction.parts[0].text).toContain('Current browser date: Sunday, March 29, 2026.')
    expect(payload.system_instruction.parts[0].text).toContain('Current selected node: JWST mission')
    expect(payload.generationConfig).toEqual({
      maxOutputTokens: 350,
      responseMimeType: 'text/plain',
      temperature: 0.7,
      thinkingConfig: {
        thinkingBudget: 0,
      },
    })
  })
})

describe('buildRequestContext', () => {
  test('adds comparison context for habitability questions', () => {
    const context = buildRequestContext([
      { role: 'user', content: 'Which planet here seems most habitable?' },
    ], {
      now: new Date('2026-03-29T12:00:00Z'),
    })

    expect(context).toContain('Catalog overview:')
    expect(context).toContain('Comparison shortlist from the current')
    expect(context).toContain('-planet Cosmos catalog:')
    expect(context).toContain('- ')
  })
})

describe('getLocalGuideResponse', () => {
  test('answers day and date questions from the local clock', () => {
    const now = new Date('2026-03-29T12:00:00Z')
    expect(getLocalGuideResponse('What day is it?', now)).toBe('Today is Sunday, March 29, 2026.')
    expect(getLocalGuideResponse('What date is it?', now)).toBe('Today is Sunday, March 29, 2026.')
    expect(getLocalGuideResponse("What's the date?", now)).toBe('Today is Sunday, March 29, 2026.')
  })

  test('returns null for non-utility prompts', () => {
    expect(getLocalGuideResponse('Tell me about JWST.')).toBeNull()
  })
})

describe('extractGenerateContentText', () => {
  test('joins text parts from the first Gemini candidate', () => {
    expect(extractGenerateContentText({
      candidates: [
        {
          content: {
            parts: [
              { text: 'TRAPPIST-1e ' },
              { text: 'is one of the best-known habitable-zone candidates.' },
            ],
          },
        },
      ],
    })).toBe('TRAPPIST-1e is one of the best-known habitable-zone candidates.')
  })

  test('throws when Gemini returns no text', () => {
    expect(() => extractGenerateContentText({
      candidates: [
        {
          content: {
            parts: [{ inlineData: { mimeType: 'image/png', data: 'abc123' } }],
          },
        },
      ],
    })).toThrow('Gemini response did not contain text')
  })
})
