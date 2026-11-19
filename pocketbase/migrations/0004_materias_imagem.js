migrate(
  (app) => {
    // Campo de imagem da matéria (upload de arquivo, um por matéria)
    const materias = app.findCollectionByNameOrId('materias')
    if (!materias.fields.getByName('imagem')) {
      materias.fields.add(
        new FileField({
          name: 'imagem',
          maxSelect: 1,
          maxSize: 5242880, // 5 MB
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          thumbs: ['100x100', '300x0', '600x0'],
        }),
      )
    }
    app.save(materias)
  },
  (app) => {
    const materias = app.findCollectionByNameOrId('materias')
    try {
      const field = materias.fields.getByName('imagem')
      if (field) {
        materias.fields.removeByName('imagem')
        app.save(materias)
      }
    } catch (_) {}
  },
)
