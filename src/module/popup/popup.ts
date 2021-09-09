import '../general/general.scss'
import PopupInitializer from './init/PopupInitializer'

document.addEventListener('DOMContentLoaded', () =>
  new PopupInitializer().init()
)
