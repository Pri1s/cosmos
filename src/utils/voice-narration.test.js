import { describe, expect, it } from 'vitest'
import { buildVoiceNarration } from './voice-narration'

describe('voice narration', () => {
  it('builds a default exoplanet narration when no lens is active', () => {
    const narration = buildVoiceNarration({
      id: 'kepler-186f',
      type: 'exoplanet',
      name: 'Kepler-186f',
      hostStar: 'Kepler-186',
      discoveryYear: 2014,
      method: 'Transit',
      temperature: 285,
      habitability: 'It sits near the habitable-zone conversation.',
    })

    expect(narration.title).toBe('Narrating Kepler-186f')
    expect(narration.channel).toBe('World overview channel')
    expect(narration.transcript.join(' ')).toContain('Kepler-186f')
    expect(narration.transcript.join(' ')).toContain('habitable-zone')
    expect(narration.cues).toContain('Transit')
  })

  it('folds the active lens and nearby nodes into the script', () => {
    const narration = buildVoiceNarration(
      {
        id: 'kepler-1181c',
        type: 'exoplanet',
        name: 'Kepler-1181 c',
        hostStar: 'Kepler-1181',
      },
      {
        title: 'Related Missions',
        summary: 'Kepler is the mission most directly tied to this world.',
        whyItMatters: 'Planet stories are instrument stories too.',
        facts: [{ label: 'Kepler', value: 'Transit photometry' }],
      },
      [{ id: 'kepler', name: 'Kepler' }, { id: 'tess', name: 'TESS' }]
    )

    expect(narration.title).toBe('Narrating Related Missions')
    expect(narration.channel).toBe('Related Missions channel')
    expect(narration.subtitle).toContain('Kepler-1181 c')
    expect(narration.transcript.join(' ')).toContain('instrument stories')
    expect(narration.transcript.join(' ')).toContain('Kepler and TESS')
    expect(narration.cues).toContain('Related Missions')
    expect(narration.cues).toContain('Kepler')
  })

  it('builds mission narration without requiring lens context', () => {
    const narration = buildVoiceNarration({
      id: 'jwst',
      type: 'mission',
      name: 'JWST',
      agency: 'NASA',
      launchYear: 2021,
      contribution: 'It pushed exoplanet science from detection into atmospheric characterization.',
      method: 'Spectroscopy',
    })

    expect(narration.channel).toBe('Mission overview channel')
    expect(narration.transcript.join(' ')).toContain("NASA's mission")
    expect(narration.transcript.join(' ')).toContain('atmospheric characterization')
    expect(narration.cues).toContain('Mission arc')
    expect(narration.duration).toMatch(/^\d{2}:\d{2}$/)
  })
})
