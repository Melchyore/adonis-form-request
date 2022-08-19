import { join } from 'path'
import { BaseGenerator } from '@adonisjs/assembler/build/commands/Make/Base'
import { args } from '@adonisjs/core/build/standalone'

export default class MakeFormRequest extends BaseGenerator {
  /**
   * Required by BaseGenerator
   */
  protected suffix = 'Request'
  protected form = 'singular' as const
  protected pattern = 'pascalcase' as const
  protected resourceName: string
  protected createExact = false

  public static commandName = 'make:request'
  public static description = 'Make a new Request'
  public static settings = {
    loadApp: false,
  }

  @args.string({ name: 'Request name', description: 'Name of the request class', required: true })
  public name: string

  /**
   * Pull path from the `requests` directory declaration from
   * the `.adonisrc.json` file or fallback to `app/Requests`
   */
  protected getDestinationPath(): string {
    return this.getPathForNamespace('requests') || 'app/Requests'
  }

  /**
   * Returns the template stub
   */
  protected getStub(): string {
    return join(__dirname, '..', 'templates', 'form-request.txt')
  }

  public async run() {
    this.resourceName = this.name

    await super.generate()
  }
}
