export class CliParser {
  public static async parseCommandLineArgs(
    args: string[],
    usage: string = '',
  ): Promise<{ parsedArgs: Record<string, any>; positionalArgs: string[] }> {
    const parsedArgs: Record<string, any> = {}
    const positionalArgs: string[] = []

    for (let i = 0; i < args.length; i++) {
      const arg = args[i]

      if (arg === '-h' || arg === '--help') {
        console.log(usage)
        process.exit(0)
      }

      if (arg.startsWith('-')) {
        const isLongOption = arg.startsWith('--')
        const optionName = isLongOption ? arg.slice(2) : arg.slice(1)

        if (i + 1 >= args.length || args[i + 1].startsWith('-')) {
          parsedArgs[optionName] = true
        } else {
          parsedArgs[optionName] = args[i + 1]
          i++
        }
      } else {
        positionalArgs.push(arg)
      }
    }

    return { parsedArgs, positionalArgs }
  }
}
