import { existsSync, readFileSync, rmSync } from 'node:fs'
import { teardown, SEED_FILE, type SeedData } from './seed'

export default async function globalTeardown() {
  if (!existsSync(SEED_FILE)) return
  const data = JSON.parse(readFileSync(SEED_FILE, 'utf8')) as SeedData
  await teardown(data)
  rmSync(SEED_FILE, { force: true })
}
