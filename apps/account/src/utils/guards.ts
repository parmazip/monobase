/**
 * Guard Composition Utility
 * 
 * Provides helpers for composing multiple route guard functions together.
 */

/**
 * Compose multiple guard functions into a single beforeLoad handler
 * Guards are executed in order, and their return values are merged
 * 
 * @example
 * beforeLoad: composeGuards(requireAuth, requirePerson)
 */
export function composeGuards(...guards: Array<(opts: any) => Promise<any> | any>) {
  return async (opts: any) => {
    let result = {}
    for (const guard of guards) {
      const guardResult = await guard(opts)
      if (guardResult) {
        result = { ...result, ...guardResult }
      }
    }
    return result
  }
}
