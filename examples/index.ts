import { create, ref, readonly, withContext } from '../lib/main'
import Parent, { provideParent } from './Parent'

document.addEventListener('DOMContentLoaded', () => {
  const { component, unmount } = create()

  const refParent = document.getElementById('parent')

  if (refParent) {
    const createParent = component(withContext(Parent, provideParent(() => {
      const isOpen = ref(false)
      
      return {
        isOpen: readonly(isOpen),
        onOpen: () => { isOpen.value = true },
        onClose: () => { isOpen.value = false },
      }
    })))
    createParent(refParent)

    setTimeout(() => {
      unmount([refParent])
    }, 5000)
  }
})
