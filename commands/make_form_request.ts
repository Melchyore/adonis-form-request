import type { CommandOptions } from '@adonisjs/core/types/ace'

import { BaseCommand, args } from '@adonisjs/core/ace'
import string from '@adonisjs/core/helpers/string'

import { stubsRoot } from '../stubs/main.js'

export default class MakeFormRequest extends BaseCommand {
  static commandName = 'make:form-request'
  static description = 'Make a new form request class'
  static options: CommandOptions = {
    loadApp: false,
    staysAlive: false,
  }

  @args.string({
    name: 'Form request name',
    description: 'Name of the form request class',
    required: true,
  })
  declare name: string

  /**
   * Returns the destination path for the form request class
   */
  protected getDestinationPath(...paths: string[]): string {
    const requestsDirectoryPath = this.app.rcFile.directories.requests

    return this.app.makePath(requestsDirectoryPath ?? 'app/requests', ...paths)
  }

  /**
   * Converts an entity name to a form request name
   */
  #requestName(entityName: string) {
    return string
      .create(entityName)
      .removeSuffix('request')
      .pascalCase()
      .suffix('FormRequest')
      .toString()
  }

  /**
   * Converts an entity name to a form request file name
   */
  #requestFileName(entityName: string) {
    return string
      .create(entityName)
      .removeSuffix('request')
      .snakeCase()
      .suffix('_request')
      .ext('ts')
      .toString()
  }

  public async run(): Promise<void> {
    const entity = this.app.generators.createEntity(this.name)
    const codemods = await this.createCodemods()

    await codemods.makeUsingStub(stubsRoot, 'form_request.stub', {
      requestName: this.#requestName(entity.name),
      destination: this.getDestinationPath(entity.path, this.#requestFileName(entity.name)),
    })
  }
}
