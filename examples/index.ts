import { create } from '../lib/main'
import Parent from './Parent'

document.addEventListener('DOMContentLoaded', () => {
  const { component, unmount } = create()

  const refParent = document.getElementById('parent')

  if (refParent) {
    const createParent = component(Parent)

    createParent(refParent)

    setTimeout(() => {
      unmount([refParent])
    }, 5000)
  }
})
