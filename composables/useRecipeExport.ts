import type { RecipeWithIngredients } from '~/types'

/**
 * Recipe export helpers: download as BeerXML, and copy the recipe to the
 * clipboard as a forum (BBCode) table or an HTML table. These mirror the
 * "Kopieer in forumopmaak" / "Kopieer in html-opmaak" exports of the
 * original BrewBuddy.
 */
export function useRecipeExport() {
  /** Trigger a download of the recipe as BeerXML / BrouwHulp XML. */
  async function downloadBeerXml(id: number, name: string) {
    const xml = await $fetch<string>(`/api/recipes/${id}/export`)
    const blob = new Blob([xml], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(name || 'recipe').replace(/[^a-z0-9._-]+/gi, '_')}.xml`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function gramsFromKg(kg: number | null | undefined): number {
    return Math.round((kg || 0) * 1000)
  }

  /** Build a forum BBCode table for the recipe. */
  function buildForumTable(recipe: RecipeWithIngredients): string {
    const lines: string[] = []
    lines.push(`[b]${recipe.name}[/b]`)
    lines.push('')
    lines.push('[table]')
    lines.push('[tr][td][b]Parameter[/b][/td][td][b]Value[/b][/td][/tr]')
    lines.push(`[tr][td]Type[/td][td]${recipe.type ?? ''}[/td][/tr]`)
    lines.push(`[tr][td]Batch size[/td][td]${recipe.batchSize ?? 0} L[/td][/tr]`)
    lines.push(`[tr][td]OG[/td][td]${recipe.og?.toFixed(3) ?? '-'}[/td][/tr]`)
    lines.push(`[tr][td]FG[/td][td]${recipe.fg?.toFixed(3) ?? '-'}[/td][/tr]`)
    lines.push(`[tr][td]IBU[/td][td]${recipe.ibu?.toFixed(0) ?? '-'}[/td][/tr]`)
    lines.push(`[tr][td]Color[/td][td]${recipe.color?.toFixed(0) ?? '-'} EBC[/td][/tr]`)
    lines.push(`[tr][td]ABV[/td][td]${recipe.abv?.toFixed(1) ?? '-'} %[/td][/tr]`)
    lines.push('[/table]')
    lines.push('')

    lines.push('[b]Fermentables[/b]')
    lines.push('[table]')
    lines.push('[tr][td][b]Name[/b][/td][td][b]Amount (kg)[/b][/td][td][b]EBC[/b][/td][/tr]')
    for (const f of recipe.fermentables) {
      lines.push(
        `[tr][td]${f.name}[/td][td]${(f.amount ?? 0).toFixed(2)}[/td][td]${(f.color ?? 0).toFixed(0)}[/td][/tr]`,
      )
    }
    lines.push('[/table]')
    lines.push('')

    lines.push('[b]Hops[/b]')
    lines.push('[table]')
    lines.push(
      '[tr][td][b]Name[/b][/td][td][b]Amount (g)[/b][/td][td][b]Alpha %[/b][/td][td][b]Time (min)[/b][/td][td][b]Use[/b][/td][/tr]',
    )
    for (const h of recipe.hops) {
      lines.push(
        `[tr][td]${h.name}[/td][td]${gramsFromKg(h.amount)}[/td][td]${(h.alpha ?? 0).toFixed(1)}[/td][td]${h.time ?? 0}[/td][td]${h.use ?? ''}[/td][/tr]`,
      )
    }
    lines.push('[/table]')
    lines.push('')

    lines.push('[b]Yeast[/b]')
    lines.push('[table]')
    lines.push('[tr][td][b]Name[/b][/td][td][b]Attenuation %[/b][/td][/tr]')
    for (const y of recipe.yeasts) {
      lines.push(`[tr][td]${y.name}[/td][td]${(y.attenuation ?? 0).toFixed(0)}[/td][/tr]`)
    }
    lines.push('[/table]')

    if (recipe.miscs?.length) {
      lines.push('')
      lines.push('[b]Miscellaneous[/b]')
      lines.push('[table]')
      lines.push(
        '[tr][td][b]Name[/b][/td][td][b]Type[/b][/td][td][b]Amount[/b][/td][td][b]Time (min)[/b][/td][td][b]Use[/b][/td][/tr]',
      )
      for (const m of recipe.miscs) {
        lines.push(
          `[tr][td]${m.name}[/td][td]${m.type ?? ''}[/td][td]${(m.amount ?? 0).toFixed(2)}[/td][td]${m.time ?? 0}[/td][td]${m.use ?? ''}[/td][/tr]`,
        )
      }
      lines.push('[/table]')
    }

    return lines.join('\n')
  }

  /** Build an HTML table for the recipe. */
  function buildHtmlTable(recipe: RecipeWithIngredients): string {
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

    const parts: string[] = []
    parts.push(`<h2>${esc(recipe.name)}</h2>`)
    parts.push('<table border="1" cellpadding="4" cellspacing="0">')
    parts.push('<tr><th>Parameter</th><th>Value</th></tr>')
    parts.push(`<tr><td>Type</td><td>${esc(recipe.type ?? '')}</td></tr>`)
    parts.push(`<tr><td>Batch size</td><td>${recipe.batchSize ?? 0} L</td></tr>`)
    parts.push(`<tr><td>OG</td><td>${recipe.og?.toFixed(3) ?? '-'}</td></tr>`)
    parts.push(`<tr><td>FG</td><td>${recipe.fg?.toFixed(3) ?? '-'}</td></tr>`)
    parts.push(`<tr><td>IBU</td><td>${recipe.ibu?.toFixed(0) ?? '-'}</td></tr>`)
    parts.push(`<tr><td>Color</td><td>${recipe.color?.toFixed(0) ?? '-'} EBC</td></tr>`)
    parts.push(`<tr><td>ABV</td><td>${recipe.abv?.toFixed(1) ?? '-'} %</td></tr>`)
    parts.push('</table>')

    parts.push('<h3>Fermentables</h3>')
    parts.push('<table border="1" cellpadding="4" cellspacing="0">')
    parts.push('<tr><th>Name</th><th>Amount (kg)</th><th>EBC</th></tr>')
    for (const f of recipe.fermentables) {
      parts.push(
        `<tr><td>${esc(f.name)}</td><td>${(f.amount ?? 0).toFixed(2)}</td><td>${(f.color ?? 0).toFixed(0)}</td></tr>`,
      )
    }
    parts.push('</table>')

    parts.push('<h3>Hops</h3>')
    parts.push('<table border="1" cellpadding="4" cellspacing="0">')
    parts.push(
      '<tr><th>Name</th><th>Amount (g)</th><th>Alpha %</th><th>Time (min)</th><th>Use</th></tr>',
    )
    for (const h of recipe.hops) {
      parts.push(
        `<tr><td>${esc(h.name)}</td><td>${gramsFromKg(h.amount)}</td><td>${(h.alpha ?? 0).toFixed(1)}</td><td>${h.time ?? 0}</td><td>${esc(h.use ?? '')}</td></tr>`,
      )
    }
    parts.push('</table>')

    parts.push('<h3>Mash</h3>')
    parts.push('<table border="1" cellpadding="4" cellspacing="0">')
    parts.push('<tr><th>Parameter</th><th>Value</th></tr>')
    if (recipe.mashName) parts.push(`<tr><td>Name</td><td>${esc(recipe.mashName)}</td></tr>`)
    parts.push(`<tr><td>Grain temp</td><td>${(recipe.grainTemp ?? 0).toFixed(1)} °C</td></tr>`)
    parts.push(`<tr><td>Tun temp</td><td>${(recipe.tunTemp ?? 0).toFixed(1)} °C</td></tr>`)
    parts.push(`<tr><td>Sparge temp</td><td>${(recipe.spargeTemp ?? 0).toFixed(1)} °C</td></tr>`)
    parts.push('</table>')
    if (recipe.mashSteps?.length) {
      parts.push('<table border="1" cellpadding="4" cellspacing="0">')
      parts.push(
        '<tr><th>Step</th><th>Type</th><th>Temp (°C)</th><th>Time (min)</th><th>Ramp (min)</th><th>Infuse (L)</th></tr>',
      )
      for (const m of recipe.mashSteps) {
        parts.push(
          `<tr><td>${esc(m.name)}</td><td>${esc(m.type ?? '')}</td><td>${(m.stepTemp ?? 0).toFixed(1)}</td><td>${m.stepTime ?? 0}</td><td>${m.rampTime ?? 0}</td><td>${(m.infuseAmount ?? 0).toFixed(1)}</td></tr>`,
        )
      }
      parts.push('</table>')
    }

    parts.push('<h3>Boil</h3>')
    parts.push('<table border="1" cellpadding="4" cellspacing="0">')
    parts.push('<tr><th>Parameter</th><th>Value</th></tr>')
    parts.push(`<tr><td>Boil size</td><td>${(recipe.boilSize ?? 0).toFixed(1)} L</td></tr>`)
    parts.push(`<tr><td>Boil time</td><td>${recipe.boilTime ?? 0} min</td></tr>`)
    parts.push('</table>')
    if (recipe.miscs?.length) {
      parts.push('<table border="1" cellpadding="4" cellspacing="0">')
      parts.push(
        '<tr><th>Misc</th><th>Type</th><th>Amount</th><th>Time (min)</th><th>Use</th></tr>',
      )
      for (const m of recipe.miscs) {
        parts.push(
          `<tr><td>${esc(m.name)}</td><td>${esc(m.type ?? '')}</td><td>${(m.amount ?? 0).toFixed(2)}</td><td>${m.time ?? 0}</td><td>${esc(m.use ?? '')}</td></tr>`,
        )
      }
      parts.push('</table>')
    }

    parts.push('<h3>Yeast</h3>')
    parts.push('<table border="1" cellpadding="4" cellspacing="0">')
    parts.push('<tr><th>Name</th><th>Attenuation %</th></tr>')
    for (const y of recipe.yeasts) {
      parts.push(`<tr><td>${esc(y.name)}</td><td>${(y.attenuation ?? 0).toFixed(0)}</td></tr>`)
    }
    parts.push('</table>')

    if (recipe.notes) {
      parts.push('<h3>Notes</h3>')
      parts.push(`<p>${esc(recipe.notes).replace(/\n/g, '<br>')}</p>`)
    }

    return parts.join('\n')
  }

  async function copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return false
    }
  }

  async function copyForumTable(recipe: RecipeWithIngredients) {
    return copyToClipboard(buildForumTable(recipe))
  }

  async function copyHtmlTable(recipe: RecipeWithIngredients) {
    return copyToClipboard(buildHtmlTable(recipe))
  }

  /**
   * Open a clean, print-friendly recipe sheet in a new window and trigger the
   * browser print dialog, from which the user can save as PDF. Mirrors the
   * "afdrukken" (print) action of the original BrewBuddy.
   */
  function printRecipe(recipe: RecipeWithIngredients) {
    const win = window.open('', '_blank')
    if (!win) return
    const styles = `
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; margin: 32px; }
        h2 { margin: 0 0 4px; }
        h3 { margin: 24px 0 6px; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 8px; }
        th, td { border: 1px solid #999; padding: 4px 8px; text-align: left; font-size: 13px; }
        th { background: #f3f3f3; }
        @media print { body { margin: 0; } }
      </style>`
    win.document.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>${recipe.name}</title>${styles}</head><body>${buildHtmlTable(recipe)}</body></html>`,
    )
    win.document.close()
    win.focus()
    // Give the new document a tick to render before printing.
    setTimeout(() => win.print(), 250)
  }

  return {
    downloadBeerXml,
    buildForumTable,
    buildHtmlTable,
    copyForumTable,
    copyHtmlTable,
    printRecipe,
  }
}
