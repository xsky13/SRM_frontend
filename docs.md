# DOCUMENTACION
## Errores
* En todas las querys y mutaciones, si hubo un error va a mostrar un toast en la pagina. Para suprimirlo, agregar esto a la query: `meta: { silent: true }`
* Para reemplazar la funcionalidad de error en las mutaciones, primero agregar `meta: { silent: true }` y despues configurar el `onError` que se quiere utilizar.
