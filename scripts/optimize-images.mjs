// Сжимает исходники из assets-src/ в public/img/ (webp + avif).
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const jobs = [
  { src: 'assets-src/pulse/og.png', out: 'pulse-cover', width: 1120 },
  { src: 'assets-src/tenderradar/in-work-desktop-light.png', out: 'tenderradar-in-work', width: 1120 },
  { src: 'assets-src/tenderradar/results-desktop-light.png', out: 'tenderradar-results', width: 1120 },
  { src: 'assets-src/tenderradar/results-phone-light.png', out: 'tenderradar-phone', width: 390 },
]

await mkdir('public/img', { recursive: true })
for (const job of jobs) {
  const image = sharp(job.src).resize({ width: job.width, withoutEnlargement: true })
  const webp = await image.clone().webp({ quality: 78 }).toFile(`public/img/${job.out}.webp`)
  const avif = await image.clone().avif({ quality: 52 }).toFile(`public/img/${job.out}.avif`)
  console.log(`${job.out}: webp ${(webp.size / 1024).toFixed(1)} КБ, avif ${(avif.size / 1024).toFixed(1)} КБ`)
}
