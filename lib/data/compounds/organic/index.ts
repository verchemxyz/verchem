import { ALCOHOLS } from './alcohols'
import { AMINES } from './amines'
import { AROMATICS } from './aromatics'
import { CARBOXYLIC_ACIDS } from './carboxylic'
import { ESTERS } from './esters'
import { HYDROCARBONS } from './hydrocarbons'
import { KETONES_AND_ALDEHYDES } from './ketones'

export const ORGANIC_COMPOUNDS = [
  ...HYDROCARBONS,
  ...ALCOHOLS,
  ...CARBOXYLIC_ACIDS,
  ...KETONES_AND_ALDEHYDES,
  ...ESTERS,
  ...AMINES,
  ...AROMATICS,
]
