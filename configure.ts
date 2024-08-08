import ConfigureCommand from '@adonisjs/core/commands/configure'

export async function configure(command: ConfigureCommand) {
  const codemods = await command.createCodemods()

  codemods.updateRcFile((rcFile) => {
    rcFile.setDirectory('requests', 'app/requests')
  })
}
