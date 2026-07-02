import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { seed, SEED_FILE } from './seed'

export default async function globalSetup() {
  const data = await seed()
  mkdirSync(path.dirname(SEED_FILE), { recursive: true })
  writeFileSync(SEED_FILE, JSON.stringify(data, null, 2))
}
