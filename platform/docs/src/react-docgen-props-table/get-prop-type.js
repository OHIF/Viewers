import capitalize from 'capitalize'
import get from 'lodash.get'
import { humanize } from './humanize-prop'

export const getPropType = (prop) => {
  const propName = get(prop.flowType || prop.type, 'name')
  if (!propName) return null

  const isEnum = propName.startsWith('"') || propName === 'enum'
  const name = capitalize(isEnum ? 'enum' : propName)
  const value = get(prop, 'type.value')
  if (!name) return null

  if (
    (isEnum && typeof value === 'string') ||
    (!prop.flowType && !isEnum && !value) ||
    (prop.flowType && !prop.flowType.elements)
  ) {
    return name
  }

  return prop.flowType ? humanize(prop.flowType) : humanize(prop.type)
}
