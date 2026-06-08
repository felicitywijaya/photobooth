interface Rect {
  x: number
  y: number
  width: number
  height: number
}

function detectPlaceholderRegions(imageData: ImageData, count: number): Rect[] {
  const { data, width, height } = imageData
  const ROW_COVERAGE_THRESHOLD = 0.15
  const MIN_HEIGHT = 40

  let hasTransparency = false
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 128) { hasTransparency = true; break }
  }

  function isPlaceholder(idx: number): boolean {
    if (hasTransparency) return data[idx + 3] < 50
    const r = data[idx], g = data[idx + 1], b = data[idx + 2]
    const avg = (r + g + b) / 3
    return avg > 150 && avg < 225 &&
      Math.abs(r - g) < 25 && Math.abs(g - b) < 25 && Math.abs(r - b) < 25
  }

  const rowCoverage = new Float32Array(height)
  for (let y = 0; y < height; y++) {
    let n = 0
    for (let x = 0; x < width; x++) {
      if (isPlaceholder((y * width + x) * 4)) n++
    }
    rowCoverage[y] = n / width
  }

  const bands: Array<{ start: number; end: number }> = []
  let inBand = false
  let bandStart = 0

  for (let y = 0; y < height; y++) {
    if (rowCoverage[y] >= ROW_COVERAGE_THRESHOLD && !inBand) {
      inBand = true
      bandStart = y
    } else if (rowCoverage[y] < ROW_COVERAGE_THRESHOLD && inBand) {
      inBand = false
      if (y - bandStart >= MIN_HEIGHT) bands.push({ start: bandStart, end: y - 1 })
    }
  }
  if (inBand && height - bandStart >= MIN_HEIGHT) {
    bands.push({ start: bandStart, end: height - 1 })
  }

  const allRegions: Rect[] = bands.map(({ start, end }) => {
    // Use column-coverage threshold for X boundaries (avoids stray transparent pixels)
    const colCount = new Int32Array(width)
    const bandHeight = end - start + 1
    for (let y = start; y <= end; y++) {
      for (let x = 0; x < width; x++) {
        if (isPlaceholder((y * width + x) * 4)) colCount[x]++
      }
    }
    const COL_THRESHOLD = 0.1
    let xMin = width, xMax = -1
    for (let x = 0; x < width; x++) {
      if (colCount[x] / bandHeight >= COL_THRESHOLD) {
        if (x < xMin) xMin = x
        if (x > xMax) xMax = x
      }
    }
    if (xMax === -1) { xMin = 0; xMax = 0 }
    return { x: xMin, y: start, width: xMax - xMin + 1, height: end - start + 1 }
  })

  // Drop decorative/small regions — keep only those >= 25% of the largest area
  const largestArea = allRegions.reduce((m, r) => Math.max(m, r.width * r.height), 0)
  const filtered = allRegions.filter(r => r.width * r.height >= largestArea * 0.25)
  const candidates = filtered.length >= count ? filtered : allRegions

  candidates.sort((a, b) => b.width * b.height - a.width * a.height)
  const top = candidates.slice(0, count)
  top.sort((a, b) => a.y - b.y)
  return top
}

export function compositeImages(frames: string[], templateUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const templateImg = new Image()
    templateImg.crossOrigin = "anonymous"

    templateImg.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = templateImg.naturalWidth
      canvas.height = templateImg.naturalHeight
      const ctx = canvas.getContext("2d")!

      ctx.drawImage(templateImg, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const regions = detectPlaceholderRegions(imageData, 3)

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const loadPromises = frames.slice(0, regions.length).map((frameDataUrl, i) =>
        new Promise<void>((res, rej) => {
          const photo = new Image()
          photo.onload = () => {
            const region = regions[i]
            const scale = Math.max(region.width / photo.naturalWidth, region.height / photo.naturalHeight)
            const scaledW = photo.naturalWidth * scale
            const scaledH = photo.naturalHeight * scale
            const offsetX = region.x + (region.width - scaledW) / 2
            // Anchor at 1/3 from top: portrait-captured photos have face at ~33% from top,
            // this keeps face position consistent regardless of each template's frame height.
            const vAnchor = region.height > region.width ? 1 / 3 : 0.5
            const offsetY = region.y + (region.height - scaledH) * vAnchor

            ctx.save()
            ctx.beginPath()
            ctx.rect(region.x, region.y, region.width, region.height)
            ctx.clip()
            ctx.drawImage(photo, offsetX, offsetY, scaledW, scaledH)
            ctx.restore()
            res()
          }
          photo.onerror = rej
          photo.src = frameDataUrl
        })
      )

      Promise.all(loadPromises)
        .then(() => {
          ctx.drawImage(templateImg, 0, 0)
          resolve(canvas.toDataURL("image/jpeg", 0.82))
        })
        .catch(reject)
    }

    templateImg.onerror = reject
    templateImg.src = templateUrl
  })
}
