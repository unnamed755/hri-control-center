import { Rng, daysAgo } from './seedRandom'
import { AVATAR_TONES, FIRST_NAMES_F, FIRST_NAMES_M, LAST_NAMES } from './constants'

const OPERATOR_CODES = ['90', '91', '93', '94', '97', '98', '99', '88', '33']

export const makePerson = (rng) => {
  const gender = rng.bool(0.56) ? 'male' : 'female'
  const first = rng.pick(gender === 'male' ? FIRST_NAMES_M : FIRST_NAMES_F)
  const base = rng.pick(LAST_NAMES)
  const last = gender === 'female' ? `${base}a` : base
  return {
    gender,
    firstName: first,
    lastName: last,
    fullName: `${last} ${first}`,
    avatarTone: rng.pick(AVATAR_TONES),
  }
}

export const makePhone = (rng) =>
  `998${rng.pick(OPERATOR_CODES)}${String(rng.int(1000000, 9999999)).padStart(7, '0')}`

const slug = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[‘’ʻʼ']/g, '')
    .replace(/[^a-z0-9]/g, '')

export const makeEmail = (person, index) =>
  `${slug(person.firstName)}.${slug(person.lastName)}${index % 7 === 0 ? index : ''}@hri-demo.uz`

export const makeBirthDate = (rng) => daysAgo(rng.int(20, 52) * 365 + rng.int(0, 364))

/** Unique-ish personnel code */
export const makeCode = (index) => `HRI-${String(1000 + index)}`

export const createRng = (seed) => new Rng(seed)
